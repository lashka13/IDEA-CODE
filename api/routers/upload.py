import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from models.user import User
from services.auth import get_current_user
from config import get_settings

router = APIRouter(prefix="/upload", tags=["upload"])
settings = get_settings()


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type:
        raise HTTPException(status_code=400, detail="No content type")

    allowed_types = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "video/mp4", "video/webm",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    # Read file
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Generate unique filename
    ext = os.path.splitext(file.filename or "file")[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/uploads/{filename}", "filename": filename}
