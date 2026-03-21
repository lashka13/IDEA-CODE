"""Hybrid retrieval: BM25 (keyword) + semantic (embeddings), fused with RRF.

- BM25: `BM25Index.search()` in `src/indexer/bm25_index.py` (in-memory rank_bm25).
- Semantic: `VectorIndex.search()` → ChromaDB query; embeddings from OpenRouter
  `/v1/embeddings` in `src/indexer/vector_index.py` (`OpenRouterEmbedder`).
- Fusion: `hybrid_search()` below → `reciprocal_rank_fusion` (RRF).

HTTP entry: `GET /api/search/` in `src/search/routers.py`.
"""
from src.indexer.bm25_index import BM25Index
from src.indexer.vector_index import VectorIndex


def reciprocal_rank_fusion(
    rankings: list[list[tuple[str, float]]],
    k: int = 60,
) -> list[tuple[str, float]]:
    """Combine multiple ranked lists using Reciprocal Rank Fusion."""
    scores: dict[str, float] = {}
    for ranking in rankings:
        for rank, (doc_id, _) in enumerate(ranking):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
    result = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return result


def hybrid_search(
    query: str,
    bm25_index: BM25Index,
    vector_index: VectorIndex,
    top_k: int = 10,
) -> list[dict]:
    """Run hybrid BM25 + semantic search with RRF fusion."""
    fetch_k = top_k * 5

    bm25_results = bm25_index.search(query, top_k=fetch_k)

    # Filter BM25 to only include chunks with non-zero scores
    bm25_results = [(cid, score) for cid, score in bm25_results if score > 0.0]

    semantic_raw = vector_index.search(query, top_k=fetch_k)

    # Cosine distance → similarity (lower distance = more relevant)
    semantic_results = [
        (chunk_id, 1.0 - distance) for chunk_id, distance, _ in semantic_raw
    ]
    semantic_text_map = {chunk_id: text for chunk_id, _, text in semantic_raw}

    rankings = []
    if bm25_results:
        rankings.append(bm25_results)
    if semantic_results:
        rankings.append(semantic_results)

    if not rankings:
        return []

    fused = reciprocal_rank_fusion(rankings)

    results = []
    for chunk_id, score in fused[:top_k]:
        text = semantic_text_map.get(chunk_id, "")
        results.append({
            "chunk_id": chunk_id,
            "score": round(score, 6),
            "text": text,
        })

    return results
