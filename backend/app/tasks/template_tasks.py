import os
import tempfile
import subprocess
import logging
import asyncio
from uuid import UUID
from app.tasks.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.document_template import DocumentTemplate
from app.services.s3_service import s3_service
from sqlalchemy import select

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=2)
def generate_template_thumbnail_task(self, template_id: str):
    """
    Generate a PNG thumbnail from a PPTX or DOCX template file using LibreOffice.
    """
    tmp_path = None
    png_path = None
    output_dir = None

    async def run_task():
        nonlocal tmp_path, png_path, output_dir
        async with AsyncSessionLocal() as db:
            stmt = select(DocumentTemplate).where(DocumentTemplate.id == UUID(template_id))
            result = await db.execute(stmt)
            template = result.scalar_one_or_none()
            
            if not template:
                logger.error(f"Template {template_id} not found for thumbnail generation")
                return

            # 1. Download template bytes from S3
            template_bytes = b""
            try:
                async for chunk in s3_service.stream_file(template.s3_key):
                    template_bytes += chunk
            except Exception as e:
                logger.error(f"Failed to download template {template_id}: {e}")
                raise self.retry(exc=e, countdown=10)

            # 2. Save to temp file
            output_dir = tempfile.mkdtemp()
            with tempfile.NamedTemporaryFile(suffix=f".{template.format}", delete=False) as tmp:
                tmp.write(template_bytes)
                tmp_path = tmp.name

            # 3. Convert to PNG using LibreOffice headless
            try:
                subprocess.run([
                    "libreoffice",
                    "--headless",
                    "--convert-to", "png",
                    "--outdir", output_dir,
                    tmp_path
                ], timeout=60, check=True)
                
                png_filename = os.path.basename(tmp_path).replace(f".{template.format}", ".png")
                png_path = os.path.join(output_dir, png_filename)
                
                if not os.path.exists(png_path):
                    # Sometimes LibreOffice appends "-0.png" or similar for multi-page
                    alt_png = os.path.join(output_dir, os.listdir(output_dir)[0]) if os.listdir(output_dir) else None
                    if alt_png and alt_png.endswith(".png"):
                        png_path = alt_png
                
                with open(png_path, 'rb') as f:
                    png_bytes = f.read()

                # 4. Upload thumbnail to S3
                thumbnail_key = f"templates/thumbnails/{template_id}.png"
                s3_service.upload_file(
                    key=thumbnail_key,
                    content_bytes=png_bytes,
                    content_type="image/png"
                )

                # 5. Update DB
                template.thumbnail_s3_key = thumbnail_key
                await db.commit()
                logger.info(f"Thumbnail generated for template {template_id}")

            except subprocess.CalledProcessError as e:
                logger.error(f"LibreOffice conversion failed for {template_id}: {e}")
                raise self.retry(exc=e, countdown=30)
            except Exception as e:
                logger.error(f"Error in thumbnail task for {template_id}: {e}")
                raise self.retry(exc=e, countdown=30)

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(run_task())
    finally:
        # Cleanup
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if png_path and os.path.exists(png_path):
            os.unlink(png_path)
        if output_dir and os.path.exists(output_dir):
            import shutil
            shutil.rmtree(output_dir)
