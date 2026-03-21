import re
import logging
from rank_bm25 import BM25Okapi

logger = logging.getLogger(__name__)

STOP_WORDS_RU = {
    "и", "в", "во", "не", "что", "он", "на", "я", "с", "со", "как", "а", "то",
    "все", "она", "так", "его", "но", "да", "ты", "к", "у", "же", "вы", "за",
    "бы", "по", "только", "её", "ее", "мне", "было", "вот", "от", "меня", "ещё",
    "нет", "о", "из", "ему", "теперь", "когда", "даже", "ну", "вдруг", "ли",
    "если", "уже", "или", "ни", "быть", "был", "него", "до", "вас", "нибудь",
    "опять", "уж", "вам", "ведь", "там", "потом", "себя", "ничего", "ей", "может",
    "они", "тут", "где", "есть", "надо", "ней", "для", "мы", "тебя", "их", "чем",
    "была", "сам", "чтоб", "без", "будто", "чего", "раз", "тоже", "себе", "под",
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have",
    "has", "had", "do", "does", "did", "will", "would", "could", "should", "may",
    "might", "can", "shall", "to", "of", "in", "for", "on", "with", "at", "by",
    "from", "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then", "once",
    "this", "that", "these", "those", "it", "its",
}


def tokenize(text: str) -> list[str]:
    text = text.lower()
    tokens = re.findall(r"[a-zA-Zа-яА-ЯёЁ0-9]+", text)
    return [t for t in tokens if t not in STOP_WORDS_RU and len(t) > 1]


class BM25Index:
    """In-memory BM25 index over document chunks."""

    def __init__(self):
        self._doc_ids: list[str] = []
        self._doc_texts: list[str] = []
        self._corpus: list[list[str]] = []
        self._bm25: BM25Okapi | None = None

    def add_document(self, doc_id: str, text: str):
        if doc_id in self._doc_ids:
            return
        self._doc_ids.append(doc_id)
        self._doc_texts.append(text)
        self._corpus.append(tokenize(text))

    def remove_documents(self, doc_ids: list[str]):
        ids_set = set(doc_ids)
        filtered = [
            (did, txt, tokens)
            for did, txt, tokens in zip(self._doc_ids, self._doc_texts, self._corpus)
            if did not in ids_set
        ]
        if filtered:
            self._doc_ids, self._doc_texts, self._corpus = zip(*filtered)
            self._doc_ids = list(self._doc_ids)
            self._doc_texts = list(self._doc_texts)
            self._corpus = list(self._corpus)
        else:
            self._doc_ids = []
            self._doc_texts = []
            self._corpus = []
        self._bm25 = None

    def rebuild(self):
        if self._corpus:
            self._bm25 = BM25Okapi(self._corpus)
        else:
            self._bm25 = None
        logger.info(f"BM25 index rebuilt with {len(self._corpus)} documents")

    def search(self, query: str, top_k: int = 20) -> list[tuple[str, float]]:
        """Returns list of (chunk_id, score) sorted by score descending."""
        if not self._bm25 or not self._corpus:
            return []
        tokens = tokenize(query)
        if not tokens:
            return []
        scores = self._bm25.get_scores(tokens)
        indexed = [(self._doc_ids[i], float(scores[i])) for i in range(len(scores))]
        indexed.sort(key=lambda x: x[1], reverse=True)
        return indexed[:top_k]

    @property
    def size(self) -> int:
        return len(self._doc_ids)
