import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.tasks.models import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])

PISTON_URL = os.getenv("PISTON_URL", "http://piston:2000")

# Piston language mapping: frontend value → (language, version)
LANGUAGE_MAP = {
    "python": ("python", "3.10.0"),
    "javascript": ("javascript", "18.15.0"),
    "go": ("go", "1.16.2"),
    "java": ("java", "15.0.2"),
    "cpp": ("c++", "10.2.0"),
}


def _task_to_dict(task: Task) -> dict:
    """Convert task to dict, hiding correct_option_id from client."""
    d = {c.name: getattr(task, c.name) for c in task.__table__.columns}
    d.pop("correct_option_id", None)
    return d


@router.get("/")
async def get_tasks(
    difficulty: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Task).order_by(Task.created_at.desc())
    if difficulty:
        query = query.where(Task.difficulty == difficulty)
    if category:
        query = query.where(Task.category == category)
    result = await db.execute(query)
    return [_task_to_dict(t) for t in result.scalars().all()]


@router.get("/{task_id}")
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_to_dict(task)


class CheckAnswerRequest(BaseModel):
    answer_id: str


@router.post("/{task_id}/check")
async def check_answer(
    task_id: str,
    body: CheckAnswerRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.is_theory:
        raise HTTPException(status_code=400, detail="Not a theory task")

    correct = body.answer_id == task.correct_option_id
    return {
        "correct": correct,
        "correct_option_id": task.correct_option_id,
        "explanation": task.explanation or "",
    }


class RunCodeRequest(BaseModel):
    code: str
    language: str = "python"
    test_index: int = 0


class SubmitCodeRequest(BaseModel):
    code: str
    language: str = "python"


async def _execute_code(code: str, language: str, stdin: str = "") -> dict:
    """Execute code via Piston API and return run result."""
    lang_info = LANGUAGE_MAP.get(language)
    if not lang_info:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    lang_name, lang_version = lang_info
    ext_map = {"python": "py", "javascript": "js", "go": "go", "java": "java", "c++": "cpp"}

    payload = {
        "language": lang_name,
        "version": lang_version,
        "files": [{"name": f"solution.{ext_map.get(lang_name, 'txt')}", "content": code}],
        "stdin": stdin,
        "run_timeout": 10000,       # 10s max
        "compile_timeout": 15000,   # 15s compile
        "run_memory_limit": 256_000_000,  # 256MB
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(f"{PISTON_URL}/api/v2/execute", json=payload)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Code execution service unavailable")
        return resp.json()


@router.post("/{task_id}/run")
async def run_code(
    task_id: str,
    body: RunCodeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Run code against a single visible test case."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    examples = task.examples or []
    if body.test_index >= len(examples):
        raise HTTPException(status_code=400, detail="Test case index out of range")

    test = examples[body.test_index]
    stdin = test.get("input", "")

    try:
        piston_result = await _execute_code(body.code, body.language, stdin)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Code execution failed")

    run_data = piston_result.get("run", {})
    compile_data = piston_result.get("compile", {})

    stdout = (run_data.get("stdout") or "").rstrip("\n")
    stderr = run_data.get("stderr") or compile_data.get("stderr") or ""
    exit_code = run_data.get("code", -1)
    expected = test.get("output", "").rstrip("\n")
    passed = stdout == expected and exit_code == 0

    return {
        "stdout": stdout,
        "stderr": stderr,
        "exit_code": exit_code,
        "expected": expected,
        "passed": passed,
        "compile_error": compile_data.get("stderr") or "",
    }


@router.post("/{task_id}/submit")
async def submit_code(
    task_id: str,
    body: SubmitCodeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Run code against all test cases (visible + hidden) and return results."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    all_tests = (task.examples or []) + (task.hidden_tests or [])
    if not all_tests:
        raise HTTPException(status_code=400, detail="No test cases for this task")

    results = []
    all_passed = True

    for i, test in enumerate(all_tests):
        stdin = test.get("input", "")
        try:
            piston_result = await _execute_code(body.code, body.language, stdin)
        except HTTPException:
            raise
        except Exception:
            results.append({"test": i + 1, "passed": False, "error": "Execution failed"})
            all_passed = False
            continue

        run_data = piston_result.get("run", {})
        compile_data = piston_result.get("compile", {})

        stdout = (run_data.get("stdout") or "").rstrip("\n")
        stderr = run_data.get("stderr") or compile_data.get("stderr") or ""
        exit_code = run_data.get("code", -1)
        expected = test.get("output", "").rstrip("\n")
        passed = stdout == expected and exit_code == 0

        is_hidden = i >= len(task.examples or [])

        test_result = {
            "test": i + 1,
            "passed": passed,
            "hidden": is_hidden,
        }
        if not is_hidden:
            test_result["stdout"] = stdout
            test_result["expected"] = expected
        if stderr:
            test_result["stderr"] = stderr

        results.append(test_result)
        if not passed:
            all_passed = False

    return {
        "all_passed": all_passed,
        "total": len(all_tests),
        "passed_count": sum(1 for r in results if r["passed"]),
        "results": results,
    }
