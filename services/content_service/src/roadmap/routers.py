from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.roadmap.models import RoadmapTrack

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.get("/")
async def get_tracks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RoadmapTrack))
    tracks = result.scalars().all()
    out = []
    for t in tracks:
        out.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "emoji": t.emoji,
            "color": t.color,
            "nodes": [
                {
                    "id": n.id,
                    "title": n.title,
                    "description": n.description,
                    "category": n.category,
                    "difficulty": n.difficulty,
                    "skills": n.skills,
                    "materialIds": n.material_ids,
                    "dependencies": n.dependencies,
                    "estimatedHours": n.estimated_hours,
                    "status": n.status,
                    "progress": n.progress,
                }
                for n in t.nodes
            ],
        })
    return out
