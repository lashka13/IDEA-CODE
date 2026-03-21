"""
Hybrid search service: BM25 (keyword) + Semantic (vector) search.

Scoring formula:
  final_score = bm25_weight * bm25_norm + semantic_weight * semantic_score

The BM25 index is built in-memory from all indexed materials
and rebuilt every time the material list is refreshed.
"""
import logging
import math
import re
from typing import Any, Optional

from services import embedding_service, vector_store

logger = logging.getLogger(__name__)

BM25_WEIGHT = 0.35
SEMANTIC_WEIGHT = 0.65

# ---------------------------------------------------------------------------
# Simple in-memory BM25 implementation (avoids heavy dependency loading issues)
# ---------------------------------------------------------------------------

class BM25Index:
    """Lightweight BM25 index that works on a list of (id, text) pairs."""

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.docs: list[tuple[str, list[str]]] = []  # [(id, tokens)]
        self.df: dict[str, int] = {}
        self.avgdl: float = 0.0

    def _tokenize(self, text: str) -> list[str]:
        return re.findall(r"[а-яёa-z0-9]+", text.lower())

    def build(self, documents: list[tuple[str, str]]) -> None:
        """documents: list of (id, text)"""
        self.docs = [(doc_id, self._tokenize(text)) for doc_id, text in documents]
        self.df = {}
        total_len = 0
        for _, tokens in self.docs:
            total_len += len(tokens)
            for tok in set(tokens):
                self.df[tok] = self.df.get(tok, 0) + 1
        self.avgdl = total_len / len(self.docs) if self.docs else 1.0

    def score(self, query: str) -> list[tuple[str, float]]:
        """Return [(id, bm25_score)] sorted descending."""
        if not self.docs:
            return []
        query_tokens = self._tokenize(query)
        N = len(self.docs)
        scores: list[tuple[str, float]] = []
        for doc_id, tokens in self.docs:
            dl = len(tokens)
            tf_map: dict[str, int] = {}
            for tok in tokens:
                tf_map[tok] = tf_map.get(tok, 0) + 1
            s = 0.0
            for qt in query_tokens:
                tf = tf_map.get(qt, 0)
                df = self.df.get(qt, 0)
                if df == 0:
                    continue
                idf = math.log((N - df + 0.5) / (df + 0.5) + 1)
                tf_norm = tf * (self.k1 + 1) / (tf + self.k1 * (1 - self.b + self.b * dl / self.avgdl))
                s += idf * tf_norm
            scores.append((doc_id, s))
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores


_bm25_index: Optional[BM25Index] = None
_bm25_corpus: list[tuple[str, str]] = []  # [(material_id, search_text)]


def rebuild_bm25(corpus: list[tuple[str, str]]) -> None:
    """Rebuild the in-memory BM25 index. Call whenever materials change."""
    global _bm25_index, _bm25_corpus
    _bm25_index = BM25Index()
    _bm25_index.build(corpus)
    _bm25_corpus = corpus
    logger.info("BM25 index rebuilt with %d documents", len(corpus))


def _normalize(scores: list[tuple[str, float]]) -> dict[str, float]:
    """Min-max normalise a list of (id, score) to [0, 1]."""
    if not scores:
        return {}
    max_s = max(s for _, s in scores)
    min_s = min(s for _, s in scores)
    rng = max_s - min_s if max_s != min_s else 1.0
    return {doc_id: (s - min_s) / rng for doc_id, s in scores}


# ---------------------------------------------------------------------------
# Public search function
# ---------------------------------------------------------------------------

async def hybrid_search(
    query: str,
    limit: int = 10,
    material_lookup: Optional[dict[str, Any]] = None,
) -> list[dict]:
    """
    Perform hybrid BM25 + semantic search.

    Args:
        query:           Natural-language query in any language.
        limit:           Maximum number of results to return.
        material_lookup: Optional dict {material_id: material_dict} used to
                         attach full material data to results. If None,
                         results contain only id/score/snippet.

    Returns list of dicts sorted by relevance descending:
        [{"material_id", "score", "snippet", "material"?}, ...]
    """
    query = query.strip()
    if not query:
        return []

    # --- BM25 ---
    bm25_raw: list[tuple[str, float]] = []
    if _bm25_index and _bm25_corpus:
        bm25_raw = _bm25_index.score(query)

    bm25_norm = _normalize(bm25_raw)

    # --- Semantic ---
    query_embedding = await embedding_service.get_single_embedding(query)
    semantic_results = vector_store.search_materials(query_embedding, n_results=max(limit * 2, 20))
    semantic_norm = _normalize([(r["id"], r["score"]) for r in semantic_results])
    semantic_snippets = {r["id"]: r["document"][:300] for r in semantic_results}

    # --- Merge ---
    all_ids = set(bm25_norm.keys()) | set(semantic_norm.keys())
    combined: list[tuple[str, float]] = []
    for doc_id in all_ids:
        bm25_s = bm25_norm.get(doc_id, 0.0)
        sem_s = semantic_norm.get(doc_id, 0.0)
        final = BM25_WEIGHT * bm25_s + SEMANTIC_WEIGHT * sem_s
        combined.append((doc_id, final))

    combined.sort(key=lambda x: x[1], reverse=True)
    top = combined[:limit]

    results = []
    for doc_id, score in top:
        snippet = semantic_snippets.get(doc_id, "")
        entry: dict = {
            "material_id": doc_id,
            "score": round(score, 4),
            "snippet": snippet,
        }
        if material_lookup and doc_id in material_lookup:
            entry["material"] = material_lookup[doc_id]
        results.append(entry)

    return results
