"""Expand user queries so RU terms match EN-heavy catalog text (BM25 + embeddings)."""

import re

# Substring in query (lowercased full string) → English term appended to the query
_PHRASE_EN: list[tuple[str, str]] = [
    ("пайтон", "python"),
    ("питон", "python"),
    ("джаваскрипт", "javascript"),
    ("джава", "java"),
    ("реакт", "react"),
    ("тайпскрипт", "typescript"),
    ("докер", "docker"),
    ("кубернетес", "kubernetes"),
    ("кубер", "kubernetes"),
    ("флаттер", "flutter"),
    ("дарт", "dart"),
    ("пандас", "pandas"),
    ("нумпай", "numpy"),
    ("скиллит", "scikit-learn"),
    ("машинное обучение", "machine learning"),
    ("дата сайнс", "data science"),
    ("датасаенс", "data science"),
]

# Whole-token match (after lowercasing) → English synonym appended
_TOKEN_EN: dict[str, str] = {
    "питон": "python",
    "пайтон": "python",
    "js": "javascript",
    "ts": "typescript",
    "k8s": "kubernetes",
    "ml": "machine learning",
    "ds": "data science",
}


def expand_search_query(q: str) -> str:
    q = (q or "").strip()
    if not q:
        return q

    lower = q.lower()
    extra: list[str] = []

    for phrase, en in sorted(_PHRASE_EN, key=lambda x: -len(x[0])):
        if phrase in lower:
            extra.append(en)

    for tok in re.findall(r"[a-zA-Zа-яА-ЯёЁ0-9]+", lower):
        en = _TOKEN_EN.get(tok)
        if en:
            extra.append(en)

    seen: set[str] = set()
    uniq: list[str] = []
    for e in extra:
        key = e.lower()
        if key not in seen:
            seen.add(key)
            uniq.append(e)

    if not uniq:
        return q
    return f"{q} {' '.join(uniq)}"

