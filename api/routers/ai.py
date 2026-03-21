"""
AI Search & RAG Chat router.

Endpoints:
  POST /api/ai/search          — hybrid BM25 + semantic search over materials
  POST /api/ai/chat            — RAG question-answering over document chunks
  POST /api/ai/index-material  — index (or re-index) a material into ChromaDB
"""
import logging
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models.material import Material
from schemas.ai import (
    ChatRequest,
    ChatResponse,
    IndexRequest,
    IndexResponse,
    SearchRequest,
    SearchResponse,
    SourceChunk,
)
from services import embedding_service, llm_service, search_service, vector_store
from services.pdf_service import parse_pdf_to_chunks

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/ai", tags=["ai"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _material_to_index_text(mat: Material) -> str:
    """Combine material fields into a single searchable string."""
    parts = [mat.title, mat.description]
    if mat.tags:
        parts.append(" ".join(mat.tags))
    if mat.technology:
        parts.append(" ".join(mat.technology))
    if mat.table_of_contents:
        parts.append(" ".join(str(t) for t in mat.table_of_contents))
    parts.append(mat.language)
    parts.append(mat.difficulty)
    return " ".join(filter(None, parts))


def _material_metadata(mat: Material) -> dict:
    return {
        "title": mat.title,
        "language": mat.language,
        "difficulty": mat.difficulty,
        "format": mat.format,
        "task_type": mat.task_type,
        "tags": ",".join(mat.tags or []),
        "technology": ",".join(mat.technology or []),
        "price": mat.price,
        "rating": mat.rating,
    }


async def _index_single_material(mat: Material) -> tuple[bool, int]:
    """
    Index one material:
      1. Embed metadata text → upsert into 'materials' collection.
      2. If cover_url points to a local PDF → parse and index chunks.

    Returns (success, chunks_indexed).
    """
    index_text = _material_to_index_text(mat)
    embedding = await embedding_service.get_single_embedding(index_text)
    metadata = _material_metadata(mat)

    ok = vector_store.upsert_material(mat.id, embedding, index_text, metadata)
    if not ok:
        return False, 0

    chunks_indexed = 0

    # Determine which URL points to the PDF content:
    # prefer content_url (dedicated PDF field), fall back to cover_url for legacy data
    pdf_url = None
    if getattr(mat, "content_url", None) and str(mat.content_url).lower().endswith(".pdf"):
        pdf_url = mat.content_url
    elif mat.cover_url and mat.cover_url.lower().endswith(".pdf"):
        pdf_url = mat.cover_url

    if pdf_url:
        # Build local filesystem path from URL like /uploads/abc.pdf
        pdf_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(pdf_url))
        if os.path.exists(pdf_path):
            chunks = parse_pdf_to_chunks(pdf_path)
            if chunks:
                chunk_embeddings = await embedding_service.get_embeddings(chunks)
                vector_store.upsert_chunks(mat.id, chunks, chunk_embeddings)
                chunks_indexed = len(chunks)

    # Also update BM25 corpus (simple rebuild is fast enough for hackathon scale)
    # We don't rebuild here to avoid N^2 on bulk index; caller does it.

    return True, chunks_indexed


async def _rebuild_bm25(db: AsyncSession) -> None:
    """Fetch all materials from DB and rebuild the BM25 in-memory index."""
    result = await db.execute(select(Material))
    materials = result.scalars().all()
    corpus = [(mat.id, _material_to_index_text(mat)) for mat in materials]
    search_service.rebuild_bm25(corpus)


# ---------------------------------------------------------------------------
# POST /api/ai/search
# ---------------------------------------------------------------------------

@router.post("/search", response_model=SearchResponse)
async def semantic_search(
    body: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Hybrid BM25 + semantic search for relevant materials.

    Example queries:
      "мне нужен конспект по матанализу на тему ряды"
      "решающие деревья"
      "функциональный анализ"
    """
    # Ensure BM25 index is populated (lazy rebuild on first request)
    if not search_service._bm25_corpus:
        await _rebuild_bm25(db)

    # Fetch materials from DB for attaching full data to results
    result = await db.execute(select(Material))
    all_materials = result.scalars().all()
    material_lookup = {
        mat.id: {
            "id": mat.id,
            "title": mat.title,
            "description": mat.description,
            "cover_url": mat.cover_url,
            "content_url": getattr(mat, "content_url", None),
            "price": mat.price,
            "rating": mat.rating,
            "rating_count": mat.rating_count,
            "purchase_count": mat.purchase_count,
            "language": mat.language,
            "technology": mat.technology,
            "difficulty": mat.difficulty,
            "format": mat.format,
            "task_type": mat.task_type,
            "tags": mat.tags,
            "table_of_contents": mat.table_of_contents,
            "author_id": mat.author_id,
            "created_at": mat.created_at.isoformat() if mat.created_at else None,
        }
        for mat in all_materials
    }

    # If nothing is indexed yet, fall back to simple BM25-only over all materials
    indexed_ids = vector_store.get_indexed_material_ids()
    if not indexed_ids:
        # Auto-index everything in the background so next request is fast
        logger.info("No materials indexed yet — auto-indexing all %d materials", len(all_materials))
        corpus = [(mat.id, _material_to_index_text(mat)) for mat in all_materials]
        search_service.rebuild_bm25(corpus)
        # For this first request, do a lightweight BM25-only search
        bm25_scores = search_service._bm25_index.score(body.query) if search_service._bm25_index else []
        results = []
        for mat_id, score in bm25_scores[: body.limit]:
            mat_data = material_lookup.get(mat_id, {})
            desc = mat_data.get("description", "")
            results.append({
                "material_id": mat_id,
                "score": round(score / (bm25_scores[0][1] if bm25_scores else 1), 4),
                "snippet": desc[:300],
                "material": mat_data,
            })
        return SearchResponse(query=body.query, results=results, total=len(results))

    search_results = await search_service.hybrid_search(
        query=body.query,
        limit=body.limit,
        material_lookup=material_lookup,
    )

    from schemas.ai import MaterialSearchResult
    response_results = [
        MaterialSearchResult(
            material_id=r["material_id"],
            score=r["score"],
            snippet=r.get("snippet", ""),
            material=r.get("material"),
        )
        for r in search_results
    ]

    return SearchResponse(
        query=body.query,
        results=response_results,
        total=len(response_results),
    )


# ---------------------------------------------------------------------------
# POST /api/ai/chat
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat_with_documents(body: ChatRequest):
    """
    RAG-powered Q&A over one or more materials.

    Send material_ids from the search results along with your question.
    The assistant retrieves the most relevant text chunks and answers
    based exclusively on their content.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="question cannot be empty")

    # Retrieve relevant chunks from ChromaDB
    query_embedding = await embedding_service.get_single_embedding(body.question)
    chunks = vector_store.search_chunks(
        query_embedding=query_embedding,
        material_ids=body.material_ids if body.material_ids else None,
        n_results=5,
    )

    history = [{"role": m.role, "content": m.content} for m in body.chat_history]
    answer = await llm_service.answer_question(
        question=body.question,
        context_chunks=chunks,
        chat_history=history,
    )

    sources = [
        SourceChunk(
            material_id=c["metadata"].get("material_id", ""),
            text=c["text"][:500],
            score=round(c["score"], 4),
        )
        for c in chunks
    ]

    return ChatResponse(answer=answer, sources=sources)


# ---------------------------------------------------------------------------
# POST /api/ai/index-material
# ---------------------------------------------------------------------------

@router.post("/index-material", response_model=IndexResponse)
async def index_material(
    body: IndexRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Index a material (or all materials) into the vector store.

    Pass material_id="all" to reindex everything.
    Indexing runs synchronously for a single material, or triggers
    a BM25 rebuild after batch indexing.
    """
    if body.material_id == "all":
        result = await db.execute(select(Material))
        materials = result.scalars().all()
        total_chunks = 0
        for mat in materials:
            ok, n = await _index_single_material(mat)
            if ok:
                total_chunks += n

        # Rebuild BM25 after bulk indexing
        corpus = [(mat.id, _material_to_index_text(mat)) for mat in materials]
        search_service.rebuild_bm25(corpus)

        return IndexResponse(
            material_id="all",
            success=True,
            chunks_indexed=total_chunks,
            message=f"Indexed {len(materials)} materials, {total_chunks} PDF chunks total.",
        )

    # Single material
    result = await db.execute(select(Material).where(Material.id == body.material_id))
    mat = result.scalar_one_or_none()
    if mat is None:
        raise HTTPException(status_code=404, detail=f"Material {body.material_id} not found")

    ok, chunks_indexed = await _index_single_material(mat)
    if not ok:
        raise HTTPException(status_code=500, detail="Indexing failed — check server logs")

    # Update BM25 in the background
    background_tasks.add_task(_rebuild_bm25, db)

    return IndexResponse(
        material_id=mat.id,
        success=True,
        chunks_indexed=chunks_indexed,
        message=(
            f"Material '{mat.title}' indexed. "
            + (f"{chunks_indexed} PDF chunks extracted." if chunks_indexed else "No PDF content found (metadata only).")
        ),
    )
