"""
PDF parsing and chunking service.
Uses PyMuPDF (fitz) to extract text from PDFs,
then splits into overlapping chunks for embedding.
"""
import os
import re
from typing import Optional

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False


CHUNK_SIZE = 500        # approximate characters per chunk
CHUNK_OVERLAP = 100     # characters of overlap between chunks


def extract_text_from_pdf(file_path: str) -> Optional[str]:
    """Extract all text from a PDF file. Returns None if file not found or not a PDF."""
    if not PYMUPDF_AVAILABLE:
        return None
    if not os.path.exists(file_path):
        return None
    if not file_path.lower().endswith(".pdf"):
        return None

    try:
        doc = fitz.open(file_path)
        texts = []
        for page in doc:
            texts.append(page.get_text())
        doc.close()
        return "\n".join(texts)
    except Exception:
        return None


def split_into_chunks(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks by character count, respecting sentence boundaries."""
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end >= len(text):
            chunks.append(text[start:])
            break

        # Try to break at a sentence boundary (. ! ?)
        boundary = max(
            text.rfind(". ", start, end),
            text.rfind("! ", start, end),
            text.rfind("? ", start, end),
            text.rfind("\n", start, end),
        )
        if boundary > start + chunk_size // 2:
            end = boundary + 1

        chunks.append(text[start:end].strip())
        start = end - overlap

    return [c for c in chunks if len(c.strip()) > 20]


def parse_pdf_to_chunks(file_path: str) -> list[str]:
    """Extract text from PDF and split into chunks ready for embedding."""
    text = extract_text_from_pdf(file_path)
    if not text:
        return []
    return split_into_chunks(text)
