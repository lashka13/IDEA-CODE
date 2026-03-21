"""
ChromaDB vector store wrapper.

Two collections:
  - "materials"   — one document per material (title + description + tags)
  - "pdf_chunks"  — chunked PDF content for RAG retrieval

ChromaDB persists to disk at CHROMA_DB_PATH, so no external service needed.
"""
import logging
import os
from typing import Optional

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Lazy-initialised client and collections
_chroma_client = None
_materials_col = None
_chunks_col = None


def _get_client():
    global _chroma_client
    if _chroma_client is not None:
        return _chroma_client
    try:
        import chromadb
        os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        logger.info("ChromaDB initialised at %s", settings.CHROMA_DB_PATH)
    except Exception as exc:
        logger.error("ChromaDB init failed: %s", exc)
        _chroma_client = None
    return _chroma_client


def _get_materials_col():
    global _materials_col
    if _materials_col is not None:
        return _materials_col
    client = _get_client()
    if client is None:
        return None
    _materials_col = client.get_or_create_collection(
        name="materials",
        metadata={"hnsw:space": "cosine"},
    )
    return _materials_col


def _get_chunks_col():
    global _chunks_col
    if _chunks_col is not None:
        return _chunks_col
    client = _get_client()
    if client is None:
        return None
    _chunks_col = client.get_or_create_collection(
        name="pdf_chunks",
        metadata={"hnsw:space": "cosine"},
    )
    return _chunks_col


# ---------------------------------------------------------------------------
# Material index (metadata-based)
# ---------------------------------------------------------------------------

def upsert_material(
    material_id: str,
    embedding: list[float],
    document_text: str,
    metadata: dict,
) -> bool:
    col = _get_materials_col()
    if col is None:
        return False
    try:
        col.upsert(
            ids=[material_id],
            embeddings=[embedding],
            documents=[document_text],
            metadatas=[metadata],
        )
        return True
    except Exception as exc:
        logger.warning("upsert_material failed for %s: %s", material_id, exc)
        return False


def search_materials(
    query_embedding: list[float],
    n_results: int = 10,
) -> list[dict]:
    """Return list of {id, score, document, metadata} sorted best-first."""
    col = _get_materials_col()
    if col is None:
        return []
    try:
        count = col.count()
        if count == 0:
            return []
        n = min(n_results, count)
        res = col.query(
            query_embeddings=[query_embedding],
            n_results=n,
            include=["distances", "documents", "metadatas"],
        )
        results = []
        for i, doc_id in enumerate(res["ids"][0]):
            distance = res["distances"][0][i]
            # cosine distance → similarity score [0,1]
            score = max(0.0, 1.0 - distance)
            results.append({
                "id": doc_id,
                "score": score,
                "document": res["documents"][0][i],
                "metadata": res["metadatas"][0][i],
            })
        return results
    except Exception as exc:
        logger.warning("search_materials failed: %s", exc)
        return []


def delete_material(material_id: str) -> bool:
    col = _get_materials_col()
    if col is None:
        return False
    try:
        col.delete(ids=[material_id])
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# PDF chunk index (RAG)
# ---------------------------------------------------------------------------

def upsert_chunks(
    material_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
) -> bool:
    col = _get_chunks_col()
    if col is None:
        return False
    if not chunks:
        return True
    try:
        # Remove old chunks for this material before inserting new ones
        existing = col.get(where={"material_id": material_id})
        if existing and existing["ids"]:
            col.delete(ids=existing["ids"])

        ids = [f"{material_id}__chunk_{i}" for i in range(len(chunks))]
        metadatas = [{"material_id": material_id, "chunk_index": i} for i in range(len(chunks))]
        col.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )
        return True
    except Exception as exc:
        logger.warning("upsert_chunks failed for %s: %s", material_id, exc)
        return False


def search_chunks(
    query_embedding: list[float],
    material_ids: Optional[list[str]],
    n_results: int = 5,
) -> list[dict]:
    """Retrieve top chunks for RAG. Optionally filter by material_ids."""
    col = _get_chunks_col()
    if col is None:
        return []
    try:
        count = col.count()
        if count == 0:
            return []
        n = min(n_results, count)

        where = None
        if material_ids and len(material_ids) == 1:
            where = {"material_id": material_ids[0]}
        elif material_ids and len(material_ids) > 1:
            where = {"material_id": {"$in": material_ids}}

        kwargs: dict = dict(
            query_embeddings=[query_embedding],
            n_results=n,
            include=["distances", "documents", "metadatas"],
        )
        if where:
            kwargs["where"] = where

        res = col.query(**kwargs)
        results = []
        for i, chunk_id in enumerate(res["ids"][0]):
            distance = res["distances"][0][i]
            score = max(0.0, 1.0 - distance)
            results.append({
                "chunk_id": chunk_id,
                "score": score,
                "text": res["documents"][0][i],
                "metadata": res["metadatas"][0][i],
            })
        return results
    except Exception as exc:
        logger.warning("search_chunks failed: %s", exc)
        return []


def get_indexed_material_ids() -> list[str]:
    col = _get_materials_col()
    if col is None:
        return []
    try:
        res = col.get(include=[])
        return res["ids"]
    except Exception:
        return []
