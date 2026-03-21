import logging
import os

# Before importing chromadb (telemetry hooks run at import time).
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

import httpx
import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings
from chromadb.config import Settings as ChromaSettings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "document_chunks"


class OpenRouterEmbedder(EmbeddingFunction[Documents]):
    """Calls OpenRouter /v1/embeddings (OpenAI-compatible) for embeddings."""

    def __init__(self, api_key: str, model: str = "openai/text-embedding-3-small"):
        self._api_key = api_key
        self._model = model
        self._url = "https://openrouter.ai/api/v1/embeddings"

    def __call__(self, input: Documents) -> Embeddings:
        if not input:
            return []

        batch_size = 32
        all_embeddings: Embeddings = []

        for start in range(0, len(input), batch_size):
            batch = input[start:start + batch_size]
            try:
                resp = httpx.post(
                    self._url,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                    json={"input": batch, "model": self._model},
                    timeout=60.0,
                )
                resp.raise_for_status()
                data = resp.json()
                batch_embs = [item["embedding"] for item in data["data"]]
                all_embeddings.extend(batch_embs)
            except Exception as e:
                logger.error(f"OpenRouter embedding failed: {e}")
                dim = 1536
                all_embeddings.extend([[0.0] * dim for _ in batch])

        return all_embeddings


class VectorIndex:
    """ChromaDB-backed vector search using OpenRouter API for embeddings."""

    def __init__(self, persist_dir: str, hf_api_key: str = "", model_name: str = "",
                 openrouter_api_key: str = ""):
        # model_name must be an OpenRouter embedding model id, e.g. openai/text-embedding-3-small
        emb_model = (model_name or "").strip() or "openai/text-embedding-3-small"
        self._embedder = OpenRouterEmbedder(api_key=openrouter_api_key, model=emb_model)

        self._client = chromadb.Client(ChromaSettings(
            anonymized_telemetry=False,
            is_persistent=True,
            persist_directory=persist_dir,
        ))
        try:
            self._client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass

        self._collection = self._client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
            embedding_function=self._embedder,
        )
        logger.info(f"ChromaDB collection '{COLLECTION_NAME}' ready (OpenRouter API embeddings)")

    def add_document(self, chunk_id: str, text: str, metadata: dict | None = None):
        existing = self._collection.get(ids=[chunk_id])
        if existing and existing["ids"]:
            return
        self._collection.add(
            ids=[chunk_id],
            documents=[text],
            metadatas=[metadata or {}],
        )

    def add_documents_batch(self, chunk_ids: list[str], texts: list[str],
                            metadatas: list[dict] | None = None):
        if not chunk_ids:
            return
        existing = self._collection.get(ids=chunk_ids)
        existing_set = set(existing["ids"]) if existing and existing["ids"] else set()
        new_ids = []
        new_texts = []
        new_metas = []
        for i, cid in enumerate(chunk_ids):
            if cid not in existing_set:
                new_ids.append(cid)
                new_texts.append(texts[i])
                new_metas.append(metadatas[i] if metadatas else {})

        if not new_ids:
            return

        batch_size = 32
        for start in range(0, len(new_ids), batch_size):
            end = start + batch_size
            self._collection.add(
                ids=new_ids[start:end],
                documents=new_texts[start:end],
                metadatas=new_metas[start:end],
            )

    def search(self, query: str, top_k: int = 20) -> list[tuple[str, float, str]]:
        """Returns list of (chunk_id, distance, text) sorted by relevance."""
        if self._collection.count() == 0:
            return []
        results = self._collection.query(
            query_texts=[query],
            n_results=min(top_k, self._collection.count()),
            include=["documents", "distances"],
        )
        if not results or not results["ids"] or not results["ids"][0]:
            return []

        output = []
        for i, chunk_id in enumerate(results["ids"][0]):
            distance = results["distances"][0][i] if results["distances"] else 0.0
            text = results["documents"][0][i] if results["documents"] else ""
            output.append((chunk_id, float(distance), text))
        return output

    def delete_documents(self, chunk_ids: list[str]):
        if chunk_ids:
            try:
                self._collection.delete(ids=chunk_ids)
            except Exception as e:
                logger.warning(f"Failed to delete from ChromaDB: {e}")

    @property
    def count(self) -> int:
        return self._collection.count()
