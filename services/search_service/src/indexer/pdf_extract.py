"""Extract plain text from PDF bytes (for RAG indexing)."""
import io
import logging

from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text_from_pdf_bytes(data: bytes) -> str:
    if not data:
        return ""
    try:
        reader = PdfReader(io.BytesIO(data))
        parts: list[str] = []
        for page in reader.pages:
            t = page.extract_text() or ""
            t = t.strip()
            if t:
                parts.append(t)
        return "\n\n".join(parts)
    except Exception as e:
        logger.warning(f"PDF text extraction failed: {e}")
        return ""
