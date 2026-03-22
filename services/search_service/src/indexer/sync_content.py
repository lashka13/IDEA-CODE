import logging
import httpx
from sqlalchemy import select
from src.conf import get_settings
from src.db import async_session
from src.documents.models import Document, DocumentChunk
from src.indexer.chunker import split_into_chunks
from src.indexer.pdf_extract import extract_text_from_pdf_bytes

logger = logging.getLogger(__name__)
settings = get_settings()


def _block_text(block: dict) -> str:
    """Support both seed format (`value`) and UI format (`body`, `code`)."""
    return (block.get("body") or block.get("value") or "").strip()


async def remove_material_document(app, doc_id: str):
    """Remove one material document from DB, vector index, and BM25."""
    async with async_session() as session:
        result = await session.execute(
            select(DocumentChunk).where(DocumentChunk.document_id == doc_id)
        )
        chunks = result.scalars().all()
        chunk_ids = [c.id for c in chunks]
        doc_result = await session.execute(select(Document).where(Document.id == doc_id))
        doc = doc_result.scalar_one_or_none()
        if not doc:
            return
        for chunk in chunks:
            await session.delete(chunk)
        await session.delete(doc)
        await session.commit()

    if chunk_ids:
        app.state.vector_index.delete_documents(chunk_ids)
        app.state.bm25_index.remove_documents(chunk_ids)
        app.state.bm25_index.rebuild()


def _content_headers() -> dict:
    h = {}
    if settings.SEARCH_INDEX_SECRET:
        h["X-Search-Index"] = settings.SEARCH_INDEX_SECRET
    return h


async def fetch_materials() -> list[dict]:
    """Fetch all materials + their lessons from content_service (paginated)."""
    materials = []
    async with httpx.AsyncClient(timeout=30.0, headers=_content_headers()) as client:
        page = 1
        while True:
            resp = await client.get(
                f"{settings.CONTENT_SERVICE_URL}/api/materials/",
                params={"per_page": "100", "page": str(page)},
            )
            resp.raise_for_status()
            data = resp.json()
            batch = data.get("items", [])
            materials.extend(batch)
            if len(batch) < 100:
                break
            page += 1

        for mat in materials:
            try:
                les_resp = await client.get(
                    f"{settings.CONTENT_SERVICE_URL}/api/materials/{mat['id']}/lessons/"
                )
                les_resp.raise_for_status()
                mat["_lessons"] = les_resp.json()
            except Exception as e:
                logger.warning(f"Could not fetch lessons for {mat['id']}: {e}")
                mat["_lessons"] = []

        return materials


async def fetch_pdf_text_for_material(pdf_url: str) -> str:
    """Download PDF from auth_service (or absolute URL) and extract text."""
    settings = get_settings()
    url = (pdf_url or "").strip()
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        full = url
    else:
        base = settings.AUTH_SERVICE_URL.rstrip("/")
        path = url if url.startswith("/") else f"/{url}"
        full = f"{base}{path}"
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.get(full)
            resp.raise_for_status()
        text = extract_text_from_pdf_bytes(resp.content)
        if text:
            logger.info(f"Extracted {len(text)} chars from PDF at {full[:80]}...")
        return text
    except Exception as e:
        logger.warning(f"Could not fetch or parse PDF ({full}): {e}")
        return ""


def build_material_text(material: dict) -> str:
    """Build indexable text from a material and its lessons."""
    parts = [
        material.get("title", ""),
        material.get("description", ""),
    ]

    tags = material.get("tags", [])
    if tags:
        parts.append("Теги: " + ", ".join(tags))

    tech = material.get("technology", [])
    if tech:
        parts.append("Технологии: " + ", ".join(tech))

    toc = material.get("table_of_contents", [])
    if toc:
        parts.append("Оглавление: " + ", ".join(toc))

    for lesson in material.get("_lessons", []):
        parts.append(f"\n--- {lesson.get('title', '')} ---")
        for block in lesson.get("contents", []):
            btype = block.get("type", "")
            if btype == "text":
                parts.append(_block_text(block))
            elif btype == "code":
                code = block.get("code") or _block_text(block)
                parts.append(f"```\n{code}\n```")
            elif btype == "video" and block.get("video_url"):
                parts.append(f"[Видео] {block.get('video_url')}")
            else:
                t = _block_text(block)
                if t:
                    parts.append(t)

    return "\n\n".join(parts)


async def index_material(app, material: dict):
    """Re-index a single material: replace previous chunks (e.g. after new lessons)."""
    mat_id = material["id"]
    doc_id = f"doc-mat-{mat_id}"

    await remove_material_document(app, doc_id)

    base_text = build_material_text(material)
    pdf_url = material.get("pdf_url") or ""
    pdf_text = ""
    if pdf_url:
        pdf_text = await fetch_pdf_text_for_material(pdf_url)

    parts: list[str] = []
    if base_text.strip():
        parts.append(base_text.strip())
    if pdf_text.strip():
        parts.append("--- Текст из прикреплённого PDF ---\n\n" + pdf_text.strip())

    full_text = "\n\n".join(parts).strip() if parts else ""
    if not full_text.strip():
        logger.info(f"Skip empty material {mat_id} (no text to index)")
        return

    chunks_text = split_into_chunks(full_text)
    chunk_objs = []
    chunk_ids = []
    chunk_texts = []
    chunk_metas = []
    for i, text in enumerate(chunks_text):
        chunk_id = f"{doc_id}-c{i}"
        chunk_objs.append(DocumentChunk(
            id=chunk_id,
            document_id=doc_id,
            chunk_index=i,
            text=text,
            metadata_json={"source": "material", "material_id": mat_id},
        ))
        chunk_ids.append(chunk_id)
        chunk_texts.append(text)
        chunk_metas.append({
            "document_id": doc_id,
            "title": material.get("title", ""),
        })

    async with async_session() as session:
        doc = Document(
            id=doc_id,
            title=material.get("title", ""),
            source_type="material",
            source_id=mat_id,
            content_text=full_text,
            chunk_count=len(chunk_objs),
        )
        session.add(doc)
        for c in chunk_objs:
            session.add(c)
        await session.commit()

    for cid, text in zip(chunk_ids, chunk_texts):
        app.state.bm25_index.add_document(cid, text)
    try:
        app.state.vector_index.add_documents_batch(chunk_ids, chunk_texts, chunk_metas)
    except Exception as e:
        logger.warning(
            "Semantic (vector) indexing failed for material %s; BM25/keyword search still works: %s",
            mat_id,
            e,
        )
    # Caller (startup sync or Kafka consumer) must call bm25_index.rebuild() once after batching.

    logger.info(f"Indexed material '{material.get('title', '')}' ({len(chunk_objs)} chunks)")


async def sync_content_on_startup(app):
    """Fetch all materials from content_service and index them."""
    logger.info("Starting content sync from content_service...")
    try:
        materials = await fetch_materials()
        logger.info(f"Fetched {len(materials)} materials from content_service")
        for mat in materials:
            try:
                await index_material(app, mat)
            except Exception as e:
                logger.error(
                    "Failed to index material %s: %s",
                    mat.get("id"),
                    e,
                )
        logger.info(
            f"Content sync complete. BM25: {app.state.bm25_index.size} chunks, "
            f"Vector: {app.state.vector_index.count} chunks"
        )
    except Exception as e:
        logger.error(f"Content sync failed: {e}. Search index may be empty until content_service is available.")
    finally:
        # BM25 must call rebuild() after add_document(); if vector indexing failed mid-sync,
        # rebuild was previously skipped and keyword search returned nothing.
        app.state.bm25_index.rebuild()
