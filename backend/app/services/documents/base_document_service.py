import logging
import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.generated_document import GeneratedDocument
from app.core.config import settings
from app.services.s3_service import s3_service
from app.services.graph_client import graph_client

logger = logging.getLogger(__name__)

class BaseDocumentService:
    async def get_next_version(self, db: AsyncSession, lead_id: UUID, doc_type: str) -> int:
        """
        Get the next version number for a document type for a given lead.
        SELECT COALESCE(MAX(version_number), 0) + 1
        FROM generated_documents
        WHERE lead_id = lead_id AND doc_type = doc_type
        Use SQLAlchemy: select(func.coalesce(func.max(...), 0) + 1)
        """
        stmt = select(func.coalesce(func.max(GeneratedDocument.version_number), 0) + 1).where(
            GeneratedDocument.lead_id == lead_id,
            GeneratedDocument.doc_type == doc_type
        )
        result = await db.execute(stmt)
        return result.scalar()

    async def save_document_record(
        self,
        db: AsyncSession,
        lead_id: UUID,
        division_id: UUID,
        template_id: UUID | None,
        doc_type: str,
        format: str,
        version_number: int,
        title: str,
        s3_key: str,
        sharepoint_url: str | None,
        created_by: UUID,
        status: str = "draft"
    ) -> GeneratedDocument:
        """
        Create and save a GeneratedDocument record to DB.
        Set docusign_status = "not_sent" by default.
        Commit and refresh. Return the saved record.
        """
        document = GeneratedDocument(
            lead_id=lead_id,
            division_id=division_id,
            template_id=template_id,
            doc_type=doc_type,
            format=format,
            version_number=version_number,
            title=title,
            status=status,
            s3_key=s3_key,
            sharepoint_url=sharepoint_url,
            docusign_status="not_sent",
            created_by=created_by
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)
        logger.info(f"Document record saved: {document.id} v{version_number}")
        return document

    async def create_sharepoint_folder(
        self,
        lead_id: str,
        division_name: str,
        company_name: str,
        doc_type: str
    ) -> str | None:
        """
        Create folder structure in SharePoint via Graph API.
        Path: DealFlow/{division_name}/{company_name}/{lead_id}/{doc_type}
        """
        if not settings.SHAREPOINT_SITE_ID:
            logger.warning("SharePoint not configured — skipping SharePoint upload")
            return None

        site_id = settings.SHAREPOINT_SITE_ID
        base_path = "DealFlow"
        clean_company = company_name.replace(" ", "_")
        folder_path = f"{base_path}/{division_name}/{clean_company}/{lead_id}/{doc_type}"
        
        logger.info(f"Creating SharePoint folder: {folder_path}")

        levels = [base_path, division_name, clean_company, lead_id, doc_type]
        
        # We need to create each level if it doesn't exist
        # POST /v1.0/sites/{SHAREPOINT_SITE_ID}/drive/root/children
        # body: { name: folder_name, folder: {}, @microsoft.graph.conflictBehavior: "rename" }
        
        current_parent = "root"
        for level in levels:
            endpoint = f"/v1.0/sites/{site_id}/drive/{current_parent}/children"
            body = {
                "name": level,
                "folder": {},
                "@microsoft.graph.conflictBehavior": "rename"
            }
            # The rename behavior ensures it doesn't fail if exists, or we get the existing one
            resp = await graph_client.post(endpoint, body)
            if resp and 'id' in resp:
                current_parent = f"items/{resp['id']}"
            else:
                # Fallback or error handling
                break

        return folder_path

    async def upload_to_sharepoint(
        self,
        file_bytes: bytes,
        sharepoint_folder: str,
        filename: str
    ) -> str | None:
        """
        Upload file to SharePoint folder via Graph API.
        PUT /v1.0/sites/{SHAREPOINT_SITE_ID}/drive/root:/{folder}/{filename}:/content
        """
        if not settings.SHAREPOINT_SITE_ID:
            logger.warning("SharePoint not configured — skipping SharePoint upload")
            return None

        site_id = settings.SHAREPOINT_SITE_ID
        # Using root:/{path}:/content is easier for nested folders
        endpoint = f"/v1.0/sites/{site_id}/drive/root:/{sharepoint_folder}/{filename}:/content"
        
        headers = {"Content-Type": "application/octet-stream"}
        response = await graph_client.put(endpoint, data=file_bytes, headers=headers)
        
        if response and 'webUrl' in response:
            return response['webUrl']
        
        return None

    async def upload_to_s3(
        self,
        file_bytes: bytes,
        lead_id: str,
        division_id: str,
        doc_type: str,
        filename: str,
        content_type: str
    ) -> str:
        """
        Upload generated document to S3.
        Path: {division_id}/{lead_id}/documents/{doc_type}/{filename}
        """
        s3_key = f"{division_id}/{lead_id}/documents/{doc_type}/{filename}"
        logger.info(f"Uploading document to S3: {s3_key}")
        
        # s3_service.upload_file is synchronous in this project's existing code
        s3_service.upload_file(
            key=s3_key,
            content_bytes=file_bytes,
            content_type=content_type
        )
        return s3_key

    async def archive_previous_versions(
        self,
        db: AsyncSession,
        lead_id: UUID,
        doc_type: str
    ) -> None:
        """
        Set status = 'archived' on all previous non-archived versions
        for this lead + doc_type combination before saving a new version.
        """
        stmt = (
            update(GeneratedDocument)
            .where(
                GeneratedDocument.lead_id == lead_id,
                GeneratedDocument.doc_type == doc_type,
                GeneratedDocument.status != 'archived'
            )
            .values(status='archived')
        )
        result = await db.execute(stmt)
        await db.commit()
        
        count = result.rowcount if hasattr(result, 'rowcount') else 0
        logger.info(f"Archived {count} previous versions for lead {lead_id}")

    def build_document_title(
        self,
        doc_type: str,
        version_number: int,
        company_name: str
    ) -> str:
        """
        Build a consistent document title.
        Format: "DealFlow_{doc_type}_{company_name}_v{version}_{YYYY-MM-DD}"
        """
        clean_company = company_name.replace(" ", "_")
        date_str = datetime.now().strftime("%Y-%m-%d")
        return f"DealFlow_{doc_type}_{clean_company}_v{version_number}_{date_str}"
