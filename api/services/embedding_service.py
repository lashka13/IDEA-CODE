"""
Embedding service — produces vector representations of text.

Priority:
  1. Local sentence-transformers (USE_LOCAL_EMBEDDINGS=True, default)
  2. Fallback: zero vectors (system keeps running but search quality degrades)

The multilingual model supports Russian, English and 50+ other languages.
Embeddings run fully locally — no external API needed.
"""
import asyncio
import logging
from typing import Optional

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

EMBEDDING_DIM = 384  # dimension of paraphrase-multilingual-MiniLM-L12-v2


# ---------------------------------------------------------------------------
# Local model (lazy-loaded so startup stays fast)
# ---------------------------------------------------------------------------

_local_model = None
_model_load_lock = asyncio.Lock()


def _load_local_model():
    global _local_model
    if _local_model is not None:
        return _local_model
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading local embedding model: %s", settings.EMBEDDING_MODEL)
        _local_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info("Embedding model loaded.")
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
    """Return embeddings for a list of texts. Falls back to zero vectors gracefully."""
    if not texts:
        return []

    result = await asyncio.to_thread(_get_local_embeddings, texts)
    if result is not None:
        return result

    logger.warning("Local embedding model unavailable — returning zero vectors. "
                   "Install sentence-transformers and ensure the model can be downloaded.")
    return [[0.0] * EMBEDDING_DIM for _ in texts]


async def get_single_embedding(text: str) -> list[float]:
    vecs = await get_embeddings([text])
    return vecs[0]
