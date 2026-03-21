import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from src.db import get_db
from src.utils import get_current_user_id
from src.documents.models import Document, DocumentChunk
from src.documents.schemas import (
    DocumentResponse, DocumentDetailResponse, DocumentListResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/", response_model=DocumentListResponse)
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document)
        .where(Document.source_type == "material")
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    count_result = await db.execute(
        select(func.count()).select_from(Document).where(Document.source_type == "material")
    )
    total = count_result.scalar() or 0
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(d) for d in docs],
        total=total,
    )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.source_type == "material",
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentDetailResponse.model_validate(doc)


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.source_type == "material",
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunk_result = await db.execute(
        select(DocumentChunk).where(DocumentChunk.document_id == document_id)
    )
    chunks = chunk_result.scalars().all()
    chunk_ids = [c.id for c in chunks]

    vector_index = request.app.state.vector_index
    vector_index.delete_documents(chunk_ids)

    for chunk in chunks:
        await db.delete(chunk)
    await db.delete(doc)
    await db.commit()

    bm25_index = request.app.state.bm25_index
    bm25_index.remove_documents(chunk_ids)
    bm25_index.rebuild()
