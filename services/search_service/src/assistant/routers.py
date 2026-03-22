import logging
from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.utils import get_current_user_id
from src.documents.models import DocumentChunk, Document
from src.assistant.schemas import AskRequest, AskResponse
from src.assistant.rag import generate_answer
from src.search.hybrid import hybrid_search
from src.conf import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/assistant", tags=["assistant"])

_settings = get_settings()
# Broader hybrid fetch when filtering to selected documents, then cut to RAG_CHUNK_LIMIT.
HYBRID_FETCH_FOR_SCOPED = max(48, _settings.RAG_CHUNK_LIMIT * 6)


def _append_chunk(
    context_chunks: list[dict],
    source_ids: list[str],
    chunk: DocumentChunk,
    doc: Document,
) -> None:
    context_chunks.append({
        "text": chunk.text,
        "title": doc.title,
        "chunk_id": chunk.id,
    })
    if doc.id not in source_ids:
        source_ids.append(doc.id)


@router.post("/ask", response_model=AskResponse)
async def ask_assistant(
    body: AskRequest,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    context_chunks: list[dict] = []
    source_ids: list[str] = []

    bm25_index = request.app.state.bm25_index
    vector_index = request.app.state.vector_index
    rag_limit = _settings.RAG_CHUNK_LIMIT

    if body.document_ids:
        allowed = set(body.document_ids)
        search_results = hybrid_search(
            body.query, bm25_index, vector_index, top_k=HYBRID_FETCH_FOR_SCOPED,
        )
        chunk_ids_from_search = [r["chunk_id"] for r in search_results]
        if chunk_ids_from_search:
            result = await db.execute(
                select(DocumentChunk, Document)
                .join(Document, DocumentChunk.document_id == Document.id)
                .where(DocumentChunk.id.in_(chunk_ids_from_search))
                .where(DocumentChunk.document_id.in_(allowed)),
            )
            rows = result.all()
            chunk_map = {chunk.id: (chunk, doc) for chunk, doc in rows}
            for r in search_results:
                cid = r["chunk_id"]
                if cid not in chunk_map:
                    continue
                chunk, doc = chunk_map[cid]
                _append_chunk(context_chunks, source_ids, chunk, doc)
                if len(context_chunks) >= rag_limit:
                    break

        # No relevant chunks in selected docs for this query — use beginning of those documents.
        if not context_chunks:
            result = await db.execute(
                select(DocumentChunk, Document)
                .join(Document, DocumentChunk.document_id == Document.id)
                .where(DocumentChunk.document_id.in_(allowed))
                .order_by(DocumentChunk.document_id, DocumentChunk.chunk_index)
                .limit(rag_limit),
            )
            for chunk, doc in result.all():
                _append_chunk(context_chunks, source_ids, chunk, doc)
    else:
        # Need chunks from several materials; top_k=5 often collapsed to one document.
        search_results = hybrid_search(body.query, bm25_index, vector_index, top_k=16)

        chunk_ids = [r["chunk_id"] for r in search_results]
        if chunk_ids:
            result = await db.execute(
                select(DocumentChunk, Document)
                .join(Document, DocumentChunk.document_id == Document.id)
                .where(DocumentChunk.id.in_(chunk_ids))
                .where(Document.source_type == "material"),
            )
            rows = result.all()
            chunk_map = {chunk.id: (chunk, doc) for chunk, doc in rows}
            for r in search_results:
                if r["chunk_id"] in chunk_map:
                    chunk, doc = chunk_map[r["chunk_id"]]
                    context_chunks.append({
                        "text": chunk.text,
                        "title": doc.title,
                        "chunk_id": chunk.id,
                    })
                    if doc.id not in source_ids:
                        source_ids.append(doc.id)
                    if len(context_chunks) >= rag_limit:
                        break

    history = None
    if body.history:
        history = [
            {"role": m.role, "content": m.content}
            for m in body.history
            if m.content.strip()
        ] or None

    answer = await generate_answer(body.query, context_chunks, history)

    return AskResponse(answer=answer, sources=source_ids)
