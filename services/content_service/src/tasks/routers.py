import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func as sa_func
from src.db import get_db
from src.tasks.models import Task, ThinkingAnalysis
from src.utils import get_current_user_id

router = APIRouter(prefix="/tasks", tags=["tasks"])

PISTON_URL = os.getenv("PISTON_URL", "http://piston:2000")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "google/gemma-2-9b-it:free")

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


# ── GrowGrade GET routes (must be before /{task_id}) ─────────

@router.get("/growgrade/history")
async def get_thinking_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get user's thinking analysis history."""
    result = await db.execute(
        select(ThinkingAnalysis)
        .where(ThinkingAnalysis.user_id == user_id)
        .order_by(desc(ThinkingAnalysis.created_at))
        .limit(50)
    )
    analyses = result.scalars().all()
    return [
        {
            "id": a.id,
            "task_id": a.task_id,
            "task_title": a.task_title,
            "task_difficulty": a.task_difficulty,
            "language": a.language,
            "time_spent_seconds": a.time_spent_seconds,
            "thinking_score": a.thinking_score,
            "thinking_level": a.thinking_level,
            "summary": a.summary,
            "strengths": a.strengths,
            "weaknesses": a.weaknesses,
            "patterns": a.patterns,
            "recommendations": a.recommendations,
            "cognitive_metrics": a.cognitive_metrics,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]


@router.get("/growgrade/summary")
async def get_thinking_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """GrowGrade: AI-generated summary of user's thinking patterns for profile/mentors."""
    result = await db.execute(
        select(ThinkingAnalysis)
        .where(ThinkingAnalysis.user_id == user_id)
        .order_by(desc(ThinkingAnalysis.created_at))
        .limit(20)
    )
    analyses = result.scalars().all()

    if not analyses:
        return {
            "total_analyses": 0,
            "avg_score": 0,
            "dominant_level": "N/A",
            "avg_metrics": {},
            "top_strengths": [],
            "top_weaknesses": [],
            "all_patterns": [],
            "ai_summary": None,
        }

    total = len(analyses)
    avg_score = sum(a.thinking_score for a in analyses) / total

    level_counts: dict[str, int] = {}
    for a in analyses:
        level_counts[a.thinking_level] = level_counts.get(a.thinking_level, 0) + 1
    dominant_level = max(level_counts, key=level_counts.get)  # type: ignore

    metric_keys = ["problem_decomposition", "hypothesis_testing", "abstraction_level", "debugging_approach", "time_management"]
    avg_metrics = {}
    for key in metric_keys:
        vals = [a.cognitive_metrics.get(key, 0) for a in analyses if a.cognitive_metrics]
        avg_metrics[key] = round(sum(vals) / len(vals), 1) if vals else 0

    from collections import Counter
    all_strengths = Counter(s for a in analyses for s in (a.strengths or []))
    all_weaknesses = Counter(w for a in analyses for w in (a.weaknesses or []))
    all_patterns = Counter(p for a in analyses for p in (a.patterns or []))

    ai_summary = None
    if total >= 2 and OPENROUTER_API_KEY:
        summaries_text = "\n".join(
            f"- Задача '{a.task_title}' ({a.task_difficulty}): оценка {a.thinking_score}/10, уровень {a.thinking_level}. {a.summary}"
            for a in analyses[:10]
        )
        prompt = f"""Проанализируй историю когнитивного развития разработчика на платформе GrowGrade.

Количество анализов: {total}
Средняя оценка мышления: {avg_score:.1f}/10
Преобладающий уровень: {dominant_level}
Средние когнитивные метрики: {avg_metrics}
Частые сильные стороны: {[s for s, _ in all_strengths.most_common(5)]}
Частые слабые стороны: {[w for w, _ in all_weaknesses.most_common(5)]}
Паттерны мышления: {[p for p, _ in all_patterns.most_common(5)]}

Последние анализы:
{summaries_text}

Напиши краткое саммари (3-5 предложений) о когнитивном профиле разработчика:
1. Общий уровень и стиль мышления
2. Ключевые зоны роста
3. Рекомендация для ментора: на чём сфокусировать работу

Отвечай на русском, кратко и по делу."""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": LLM_MODEL,
                        "messages": [
                            {"role": "system", "content": "Ты — AI-аналитик когнитивного развития на платформе GrowGrade."},
                            {"role": "user", "content": prompt},
                        ],
                        "max_tokens": 500,
                        "temperature": 0.4,
                    },
                )
                resp.raise_for_status()
                ai_summary = resp.json()["choices"][0]["message"]["content"]
        except Exception:
            pass

    return {
        "total_analyses": total,
        "avg_score": round(avg_score, 1),
        "dominant_level": dominant_level,
        "avg_metrics": avg_metrics,
        "top_strengths": [s for s, _ in all_strengths.most_common(5)],
        "top_weaknesses": [w for w, _ in all_weaknesses.most_common(5)],
        "all_patterns": [p for p, _ in all_patterns.most_common(8)],
        "ai_summary": ai_summary,
    }


@router.get("/growgrade/user/{target_user_id}/summary")
async def get_user_thinking_summary(
    target_user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Public summary of a user's thinking profile (for mentors to see)."""
    result = await db.execute(
        select(ThinkingAnalysis)
        .where(ThinkingAnalysis.user_id == target_user_id)
        .order_by(desc(ThinkingAnalysis.created_at))
        .limit(20)
    )
    analyses = result.scalars().all()

    if not analyses:
        return {"total_analyses": 0, "avg_score": 0, "dominant_level": "N/A", "avg_metrics": {}}

    total = len(analyses)
    avg_score = sum(a.thinking_score for a in analyses) / total
    level_counts: dict[str, int] = {}
    for a in analyses:
        level_counts[a.thinking_level] = level_counts.get(a.thinking_level, 0) + 1
    dominant_level = max(level_counts, key=level_counts.get)  # type: ignore

    metric_keys = ["problem_decomposition", "hypothesis_testing", "abstraction_level", "debugging_approach", "time_management"]
    avg_metrics = {}
    for key in metric_keys:
        vals = [a.cognitive_metrics.get(key, 0) for a in analyses if a.cognitive_metrics]
        avg_metrics[key] = round(sum(vals) / len(vals), 1) if vals else 0

    from collections import Counter
    all_patterns = Counter(p for a in analyses for p in (a.patterns or []))

    return {
        "total_analyses": total,
        "avg_score": round(avg_score, 1),
        "dominant_level": dominant_level,
        "avg_metrics": avg_metrics,
        "all_patterns": [p for p, _ in all_patterns.most_common(8)],
    }


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


class ReviewCodeRequest(BaseModel):
    code: str
    language: str = "python"


@router.post("/{task_id}/review")
async def review_code(
    task_id: str,
    body: ReviewCodeRequest,
    db: AsyncSession = Depends(get_db),
):
    """AI code review using OpenRouter LLM."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="AI review unavailable: no API key")

    prompt = f"""Ты — опытный Senior-разработчик и ментор. Проанализируй решение задачи и дай краткий, полезный фидбек.

Задача: {task.title}
Описание: {task.description}
Сложность: {task.difficulty}
Язык: {body.language}

Код решения:
```{body.language}
{body.code}
```

Дай фидбек в формате:
1. **Сложность алгоритма**: O(?) по времени и памяти
2. **Что хорошо**: 1-2 пункта
3. **Что улучшить**: 1-2 конкретных совета с примерами кода
4. **Оценка**: число от 1 до 10

Отвечай кратко, по делу, на русском. Максимум 300 слов."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": "Ты — AI-ментор на образовательной платформе для IT-специалистов."},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 800,
                    "temperature": 0.5,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            review = data["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI review failed: {str(e)}")

    return {"review": review}


class AnalyzeThinkingRequest(BaseModel):
    code: str
    language: str = "python"
    thinking_log: str
    time_spent_seconds: int = 0


@router.post("/{task_id}/analyze-thinking")
async def analyze_thinking(
    task_id: str,
    body: AnalyzeThinkingRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """GrowGrade: AI analysis of developer's thinking process."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="AI analysis unavailable: no API key")

    minutes = body.time_spent_seconds // 60
    seconds = body.time_spent_seconds % 60
    time_str = f"{minutes} мин {seconds} сек" if minutes else f"{seconds} сек"

    prompt = f"""Ты — AI-наставник на платформе GrowGrade. Твоя задача — проанализировать ПРОЦЕСС МЫШЛЕНИЯ разработчика при решении задачи, а не только код.

Задача: {task.title}
Описание: {task.description}
Сложность: {task.difficulty}
Язык: {body.language}
Время решения: {time_str}

Код решения:
```{body.language}
{body.code}
```

Лог мышления (записи разработчика о ходе решения):
---
{body.thinking_log}
---

Проанализируй и ответь СТРОГО в следующем JSON-формате (без markdown-обёрток):
{{
  "thinking_score": <число от 1 до 10>,
  "thinking_level": "<Junior / Middle / Senior>",
  "summary": "<2-3 предложения общей оценки процесса мышления>",
  "strengths": ["<сильная сторона 1>", "<сильная сторона 2>"],
  "weaknesses": ["<слабая сторона 1>", "<слабая сторона 2>"],
  "patterns": ["<паттерн мышления 1>", "<паттерн мышления 2>"],
  "recommendations": ["<рекомендация 1>", "<рекомендация 2>"],
  "cognitive_metrics": {{
    "problem_decomposition": <1-10>,
    "hypothesis_testing": <1-10>,
    "abstraction_level": <1-10>,
    "debugging_approach": <1-10>,
    "time_management": <1-10>
  }}
}}

Оценивай по критериям:
- Декомпозиция задачи: разбивает ли на подзадачи?
- Проверка гипотез: тестирует ли идеи перед реализацией?
- Уровень абстракции: мыслит паттернами или копипастит?
- Подход к отладке: системный или хаотичный?
- Управление временем: соотношение времени к сложности задачи

Отвечай ТОЛЬКО валидным JSON, без дополнительного текста."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": "Ты — AI-аналитик когнитивных процессов разработчиков на платформе GrowGrade. Отвечай только валидным JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 1200,
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data["choices"][0]["message"]["content"]

            # Try to parse JSON from response
            import json as json_mod
            # Strip markdown code fences if present
            clean = raw.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                clean = clean.strip()

            try:
                analysis = json_mod.loads(clean)
            except json_mod.JSONDecodeError:
                # If JSON parsing fails, return raw text as summary
                analysis = {
                    "thinking_score": 5,
                    "thinking_level": "Middle",
                    "summary": raw[:500],
                    "strengths": [],
                    "weaknesses": [],
                    "patterns": [],
                    "recommendations": [],
                    "cognitive_metrics": {
                        "problem_decomposition": 5,
                        "hypothesis_testing": 5,
                        "abstraction_level": 5,
                        "debugging_approach": 5,
                        "time_management": 5,
                    },
                }

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)}")

    # Save to DB
    record = ThinkingAnalysis(
        user_id=user_id,
        task_id=task_id,
        task_title=task.title,
        task_difficulty=task.difficulty,
        language=body.language,
        time_spent_seconds=body.time_spent_seconds,
        thinking_log=body.thinking_log[:10000],
        code=body.code[:10000],
        thinking_score=analysis.get("thinking_score", 0),
        thinking_level=analysis.get("thinking_level", ""),
        summary=analysis.get("summary", ""),
        strengths=analysis.get("strengths", []),
        weaknesses=analysis.get("weaknesses", []),
        patterns=analysis.get("patterns", []),
        recommendations=analysis.get("recommendations", []),
        cognitive_metrics=analysis.get("cognitive_metrics", {}),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return {"analysis": analysis, "analysis_id": record.id}
