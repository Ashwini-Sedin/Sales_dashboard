import asyncio
import logging
from uuid import UUID

from app.tasks.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.core.socket_manager import socket_manager

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3)
def generate_quick_sales_docx_task(self, lead_id: str, user_id: str, inputs: dict):
    """
    Celery task for async Quick Sales DOCX generation.
    """
    try:
        from app.services.documents.quick_sales_docx import QuickSalesDocxService
        from app.schemas.document import QuickSalesInput

        async def run_gen():
            async with AsyncSessionLocal() as db:
                service = QuickSalesDocxService()
                inputs_obj = QuickSalesInput(**inputs)
                await service.generate(db, UUID(lead_id), UUID(user_id), inputs_obj)

        asyncio.run(run_gen())
        asyncio.run(socket_manager.emit_to_lead_room(
            lead_id=lead_id,
            event="document_generation_complete",
            data={
                "task_id": self.request.id,
                "lead_id": lead_id,
                "status": "complete"
            }
        ))
        return {"status": "success", "lead_id": lead_id}

    except Exception as exc:
        logger.error(f"Quick Sales DOCX generation failed: {exc}")
        asyncio.run(socket_manager.emit_to_lead_room(
            lead_id=lead_id,
            event="document_generation_failed",
            data={
                "task_id": self.request.id,
                "lead_id": lead_id,
                "status": "failed",
                "error": str(exc)
            }
        ))
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@celery_app.task(bind=True, max_retries=3)
def generate_quick_sales_pptx_task(self, lead_id: str, user_id: str, inputs: dict):
    """
    Celery task for async Quick Sales PPTX generation.
    """
    try:
        from app.services.documents.quick_sales_pptx import QuickSalesPptxService
        from app.schemas.document import QuickSalesInput

        async def run_gen():
            async with AsyncSessionLocal() as db:
                service = QuickSalesPptxService()
                inputs_obj = QuickSalesInput(**inputs)
                await service.generate(db, UUID(lead_id), UUID(user_id), inputs_obj)

        asyncio.run(run_gen())
        asyncio.run(socket_manager.emit_to_lead_room(
            lead_id=lead_id,
            event="document_generation_complete",
            data={
                "task_id": self.request.id,
                "lead_id": lead_id,
                "status": "complete"
            }
        ))
        return {"status": "success", "lead_id": lead_id}

    except Exception as exc:
        logger.error(f"Quick Sales PPTX generation failed: {exc}")
        asyncio.run(socket_manager.emit_to_lead_room(
            lead_id=lead_id,
            event="document_generation_failed",
            data={
                "task_id": self.request.id,
                "lead_id": lead_id,
                "status": "failed",
                "error": str(exc)
            }
        ))
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@celery_app.task(bind=True, max_retries=3)
def generate_detailed_proposal_docx_task(self, lead_id: str, user_id: str, inputs: dict):
  try:
    from app.services.documents.detailed_proposal import DetailedProposalService
    from app.schemas.document import DetailedProposalInput

    async def run_gen():
      async with AsyncSessionLocal() as db:
        service = DetailedProposalService()
        inputs_obj = DetailedProposalInput(**inputs)
        await service.generate_docx(db, UUID(lead_id), UUID(user_id), inputs_obj)

    asyncio.run(run_gen())
    asyncio.run(socket_manager.emit_to_lead_room(
        lead_id=lead_id,
        event="document_generation_complete",
        data={
            "task_id": self.request.id,
            "lead_id": lead_id,
            "status": "complete"
        }
    ))
    return {"status": "success", "lead_id": lead_id}
  except Exception as exc:
    logger.error(f"Detailed Proposal DOCX generation failed: {exc}")
    asyncio.run(socket_manager.emit_to_lead_room(
        lead_id=lead_id,
        event="document_generation_failed",
        data={
            "task_id": self.request.id,
            "lead_id": lead_id,
            "status": "failed",
            "error": str(exc)
        }
    ))
    raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@celery_app.task(bind=True, max_retries=3)
def generate_detailed_proposal_pptx_task(self, lead_id: str, user_id: str, inputs: dict):
  try:
    from app.services.documents.detailed_proposal import DetailedProposalService
    from app.schemas.document import DetailedProposalInput

    async def run_gen():
      async with AsyncSessionLocal() as db:
        service = DetailedProposalService()
        inputs_obj = DetailedProposalInput(**inputs)
        await service.generate_pptx(db, UUID(lead_id), UUID(user_id), inputs_obj)

    asyncio.run(run_gen())
    asyncio.run(socket_manager.emit_to_lead_room(
        lead_id=lead_id,
        event="document_generation_complete",
        data={
            "task_id": self.request.id,
            "lead_id": lead_id,
            "status": "complete"
        }
    ))
    return {"status": "success", "lead_id": lead_id}
  except Exception as exc:
    logger.error(f"Detailed Proposal PPTX generation failed: {exc}")
    asyncio.run(socket_manager.emit_to_lead_room(
        lead_id=lead_id,
        event="document_generation_failed",
        data={
            "task_id": self.request.id,
            "lead_id": lead_id,
            "status": "failed",
            "error": str(exc)
        }
    ))
    raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@celery_app.task(bind=True, max_retries=3)
def generate_presales_docx_task(self, lead_id: str, user_id: str, inputs: dict):
  try:
    from app.services.documents.presales_doc import PresalesDocService
    from app.schemas.document import PresalesInput

    async def run_gen():
      async with AsyncSessionLocal() as db:
        service = PresalesDocService()
        inputs_obj = PresalesInput(**inputs)
        await service.generate_docx(db, UUID(lead_id), UUID(user_id), inputs_obj)

    asyncio.run(run_gen())
    asyncio.run(socket_manager.emit_to_lead_room(
        lead_id=lead_id,
        event="document_generation_complete",
        data={
            "task_id": self.request.id,
            "lead_id": lead_id,
            "status": "complete"
        }
    ))
    return {"status": "success", "lead_id": lead_id}
  except Exception as exc:
    logger.error(f"Presales DOCX generation failed: {exc}")
    asyncio.run(socket_manager.emit_to_lead_room(
        lead_id=lead_id,
        event="document_generation_failed",
        data={
            "task_id": self.request.id,
            "lead_id": lead_id,
            "status": "failed",
            "error": str(exc)
        }
    ))
    raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@celery_app.task(bind=True, max_retries=3)
def generate_nda_docx_task(self, lead_id: str, user_id: str, inputs: dict):
  try:
    from app.services.documents.nda_service import NdaService
    from app.schemas.document import NdaInput

    async def run_gen():
      async with AsyncSessionLocal() as db:
        service = NdaService()
        inputs_obj = NdaInput(**inputs)
        await service.generate_docx(db, UUID(lead_id), UUID(user_id), inputs_obj)

    asyncio.run(run_gen())
    asyncio.run(socket_manager.emit_to_lead_room(
        lead_id=lead_id,
        event="document_generation_complete",
        data={
            "task_id": self.request.id,
            "lead_id": lead_id,
            "status": "complete"
        }
    ))
    return {"status": "success", "lead_id": lead_id}
  except Exception as exc:
    logger.error(f"NDA DOCX generation failed: {exc}")
    asyncio.run(socket_manager.emit_to_lead_room(
        lead_id=lead_id,
        event="document_generation_failed",
        data={
            "task_id": self.request.id,
            "lead_id": lead_id,
            "status": "failed",
            "error": str(exc)
        }
    ))
    raise self.retry(exc=exc, countdown=2 ** self.request.retries)
