"""
Embedding service — produces vector representations of text.

Priority:
  1. HuggingFace Inference API (HF_API_TOKEN set) — instant, no local download
  2. Local sentence-transformers (USE_LOCAL_EMBEDDINGS=True) — ~470MB download on first use
  3. Fallback: zero vectors (search still works via BM25, quality reduced)

The multilingual model supports Russian, English and 50+ other languages.
"""
import asyncio
import logging
from typing import Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

EMBEDDING_DIM = 384  # paraphrase-multilingual-MiniLM-L12-v2

_HF_API_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    f"sentence-transformers/{settings.EMBEDDING_MODEL}/pipeline/feature-extraction"
)

# ---------------------------------------------------------------------------
# HuggingFace Inference API (fast, no local download required)
# ---------------------------------------------------------------------------

async def _get_hf_embeddings(texts: list[str]) -> Optional[list[list[float]]]:
    """Call HuggingFace Inference API to get embeddings."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                _HF_API_URL,
                headers={"Authorization": f"Bearer {settings.HF_API_TOKEN}"},
                json={"inputs": texts, "options": {"wait_for_model": True}},
            )
            resp.raise_for_status()
            data = resp.json()

        # HF returns shape (batch, dim) or (batch, tokens, dim) — normalise
        result: list[list[float]] = []
        for item in data:
            if isinstance(item[0], list):
                # (tokens, dim) — mean pool over tokens
                vec = [sum(row[i] for row in item) / len(item) for i in range(len(item[0]))]
            else:
                vec = item
            result.append(vec)
        return result

    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 503:
            logger.warning("HF model is loading (503) — retrying in 10s...")
            await asyncio.sleep(10)
            return await _get_hf_embeddings(texts)
        logger.warning("HuggingFace API error %s: %s", exc.response.status_code, exc.response.text)
        return None
    except Exception as exc:
        logger.warning("HuggingFace API request failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Local model (lazy-loaded, fallback when no HF token)
# ---------------------------------------------------------------------------

_local_model = None


def _load_local_model():
    global _local_model
    if _local_model is not None:
        return _local_model
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("=" * 60)
        logger.info("Loading local embedding model: %s", settings.EMBEDDING_MODEL)
        logger.info("First run: downloading ~470 MB from HuggingFace — please wait...")
        logger.info("Tip: set HF_API_TOKEN in .env to skip this download entirely.")
        logger.info("=" * 60)
        _local_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info("Embedding model loaded successfully!")
    except Exception as exc:
        logger.warning("Could not load local embedding model: %s", exc)
        _local_model = None
    return _local_model


def _get_local_embeddings(texts: list[str]) -> Optional[list[list[float]]]:
    model = _load_local_model()
    if model is None:
        return None
    try:
        vecs = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return vecs.tolist()
    except Exception as exc:
        logger.warning("Local embedding failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Return embeddings for a list of texts."""
    if not texts:
        return []

    # 1. HuggingFace API (only if token starts with "hf_")
    if settings.HF_API_TOKEN and settings.HF_API_TOKEN.startswith("hf_"):
        result = await _get_hf_embeddings(texts)
        if result is not None:
            return result
        logger.warning("HF API failed — falling back to local model.")

    # 2. Local sentence-transformers
    if settings.USE_LOCAL_EMBEDDINGS:
        result = await asyncio.to_thread(_get_local_embeddings, texts)
        if result is not None:
            return result

    # 3. Zero vectors (search degrades to BM25 only)
    logger.warning(
        "No embedding backend available — returning zero vectors. "
        "Set HF_API_TOKEN in .env for instant cloud embeddings."
    )
    return [[0.0] * EMBEDDING_DIM for _ in texts]


async def get_single_embedding(text: str) -> list[float]:
    vecs = await get_embeddings([text])
    return vecs[0]
