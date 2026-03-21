import logging
from fastapi import APIRouter, Query, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.documents.models import DocumentChunk, Document
from src.search.schemas import SearchResultItem, SearchResponse
from src.search.hybrid import hybrid_search

logger = logging.getLogger(__name__)
router = APIRouter(tags=["search"])


@router.get("/", response_model=SearchResponse)
async def search_documents(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    top_k: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    bm25_index = request.app.state.bm25_index
    vector_index = request.app.state.vector_index

    raw_results = hybrid_search(q, bm25_index, vector_index, top_k=top_k)

    chunk_ids = [r["chunk_id"] for r in raw_results]
    if not chunk_ids:
        return SearchResponse(query=q, results=[], total=0)

    result = await db.execute(
        select(DocumentChunk, Document)
        .join(Document, DocumentChunk.document_id == Document.id)
        .where(DocumentChunk.id.in_(chunk_ids))
        .where(Document.source_type == "material")
    )
    rows = result.all()
    chunk_map = {chunk.id: (chunk, doc) for chunk, doc in rows}

    items: list[SearchResultItem] = []
    best_score = max((r["score"] for r in raw_results), default=0)
    for r in raw_results:
        cid = r["chunk_id"]
        if cid not in chunk_map:
            continue
        # Filter out results that scored less than 60% of the best result
        if best_score > 0 and r["score"] < best_score * 0.6:
            continue
        chunk, doc = chunk_map[cid]
        snippet = chunk.text[:300] + "..." if len(chunk.text) > 300 else chunk.text
        items.append(SearchResultItem(
            chunk_id=cid,
            document_id=doc.id,
            document_title=doc.title,
            score=r["score"],
            snippet=snippet,
            source_type=doc.source_type,
        ))

    return SearchResponse(query=q, results=items, total=len(items))


@router.post("/index/rebuild", status_code=200)
async def rebuild_index(request: Request, db: AsyncSession = Depends(get_db)):
    """Force rebuild BM25 index from database chunks."""
    bm25_index = request.app.state.bm25_index
    vector_index = request.app.state.vector_index

    result = await db.execute(
        select(DocumentChunk, Document)
        .join(Document, DocumentChunk.document_id == Document.id)
        .where(Document.source_type == "material")
    )
    rows = result.all()

    bm25_index._doc_ids.clear()
    bm25_index._doc_texts.clear()
    bm25_index._corpus.clear()

    for chunk, doc in rows:
        bm25_index.add_document(chunk.id, chunk.text)
        vector_index.add_document(chunk.id, chunk.text, {
            "document_id": doc.id,
            "title": doc.title,
        })

    bm25_index.rebuild()
    return {
        "status": "ok",
        "bm25_count": bm25_index.size,
        "vector_count": vector_index.count,
    }
