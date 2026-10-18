
import uuid
from datetime import datetime, timezone
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.dsa_progress import DSAProgress
from app.models.dsa_problem import DSAProblem
from app.models.user import User

from app.models.system_design_progress import SystemDesignProgress

router = APIRouter(prefix="/api/progress", tags=["Progress"])


class DSAProgressUpdate(BaseModel):
    # Retained for compatibility with existing frontend requests.
    problems_attempted: int = Field(ge=0)
    problems_solved: int = Field(ge=0)
    study_minutes: int = Field(default=0, ge=0)
    confidence: float = Field(default=0, ge=0, le=10)


class DSAProblemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    topic: str = Field(min_length=1, max_length=100)
    difficulty: str
    status: str = "Not Started"


class DSAProblemStatusUpdate(BaseModel):
    status: str


class DSAProblemRevisionUpdate(BaseModel):
    needs_revision: bool


VALID_DIFFICULTIES = {"Easy", "Medium", "Hard"}
VALID_STATUSES = {
    "Not Started",
    "Attempted",
    "Solved Independently",
}


@router.get("/dsa")
def get_dsa_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress_records = (
        db.query(DSAProgress)
        .filter(DSAProgress.user_id == current_user.id)
        .all()
    )

    problems = (
        db.query(DSAProblem)
        .filter(DSAProblem.user_id == current_user.id)
        .all()
    )

    progress_by_topic = {
        record.topic.strip().lower(): record
        for record in progress_records
    }

    topic_names = {record.topic for record in progress_records}
    topic_names.update(problem.topic for problem in problems)

    counts = defaultdict(lambda: {"attempted": 0, "solved": 0})

    for problem in problems:
        key = problem.topic.strip().lower()

        if problem.status in {"Attempted", "Solved Independently"}:
            counts[key]["attempted"] += 1

        if problem.status == "Solved Independently":
            counts[key]["solved"] += 1

    topics = []

    for topic_name in sorted(topic_names):
        key = topic_name.strip().lower()
        record = progress_by_topic.get(key)
        attempted = counts[key]["attempted"]
        solved = counts[key]["solved"]

        topics.append({
            "topic": topic_name,
            "problems_attempted": attempted,
            "problems_solved": solved,
            "study_minutes": record.study_minutes if record else 0,
            "confidence": record.confidence if record else 0,
            "accuracy": round(solved / attempted * 100, 1)
            if attempted else 0,
            "updated_at": record.updated_at if record else None,
        })

    return {"topics": topics}


@router.put("/dsa/{topic}")
def update_dsa_progress(
    topic: str,
    data: DSAProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic = topic.strip()

    if not topic or len(topic) > 100:
        raise HTTPException(status_code=400, detail="Invalid topic.")

    if data.problems_solved > data.problems_attempted:
        raise HTTPException(
            status_code=400,
            detail="Solved problems cannot exceed attempted problems.",
        )

    record = (
        db.query(DSAProgress)
        .filter(
            DSAProgress.user_id == current_user.id,
            DSAProgress.topic == topic,
        )
        .first()
    )

    if record is None:
        record = DSAProgress(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            topic=topic,
            problems_attempted=data.problems_attempted,
            problems_solved=data.problems_solved,
            study_minutes=data.study_minutes,
            confidence=data.confidence,
        )
        db.add(record)
    else:
        # Keep the legacy fields for compatibility.
        # The GET endpoint calculates question counts from problem records.
        record.problems_attempted = data.problems_attempted
        record.problems_solved = data.problems_solved
        record.study_minutes = data.study_minutes
        record.confidence = data.confidence

    db.commit()
    db.refresh(record)

    return {"message": "DSA progress saved.", "topic": record.topic}


@router.get("/dsa/problems")
def list_dsa_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problems = (
        db.query(DSAProblem)
        .filter(DSAProblem.user_id == current_user.id)
        .order_by(DSAProblem.created_at.desc())
        .all()
    )

    return {
        "problems": [
            {
                "id": p.id,
                "title": p.title,
                "topic": p.topic,
                "difficulty": p.difficulty,
                "status": p.status,
                "needs_revision": getattr(p, "needs_revision", False),
                "revision_date": (
                    p.revision_date.isoformat()
                    if getattr(p, "revision_date", None)
                    else None
                ),
            }
            for p in problems
        ]
    }


@router.post("/dsa/problems")
def create_dsa_problem(
    data: DSAProblemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = data.title.strip()
    topic = data.topic.strip()

    if not title or not topic:
        raise HTTPException(
            status_code=400,
            detail="Title and topic are required.",
        )

    if data.difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be Easy, Medium, or Hard.",
        )

    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid problem status.",
        )

    existing = (
        db.query(DSAProblem)
        .filter(
            DSAProblem.user_id == current_user.id,
            DSAProblem.title.ilike(title),
            DSAProblem.topic.ilike(topic),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This problem is already saved for this topic.",
        )

    problem = DSAProblem(
        user_id=current_user.id,
        title=title,
        topic=topic,
        difficulty=data.difficulty,
        status=data.status,
    )

    db.add(problem)
    db.commit()
    db.refresh(problem)

    return {
        "id": problem.id,
        "title": problem.title,
        "topic": problem.topic,
        "difficulty": problem.difficulty,
        "status": problem.status,
        "needs_revision": getattr(problem, "needs_revision", False),
        "revision_date": None,
    }


@router.patch("/dsa/problems/{problem_id}")
def update_dsa_problem_status(
    problem_id: str,
    data: DSAProblemStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid problem status.",
        )

    problem = (
        db.query(DSAProblem)
        .filter(
            DSAProblem.id == problem_id,
            DSAProblem.user_id == current_user.id,
        )
        .first()
    )

    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found.")

    problem.status = data.status
    db.commit()
    db.refresh(problem)

    return {
        "id": problem.id,
        "status": problem.status,
        "message": "Problem status updated.",
    }


@router.patch("/dsa/problems/{problem_id}/revision")
def update_dsa_problem_revision(
    problem_id: str,
    data: DSAProblemRevisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problem = (
        db.query(DSAProblem)
        .filter(
            DSAProblem.id == problem_id,
            DSAProblem.user_id == current_user.id,
        )
        .first()
    )

    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found.")

    problem.needs_revision = data.needs_revision
    problem.revision_date = (
        datetime.now(timezone.utc) if data.needs_revision else None
    )

    db.commit()
    db.refresh(problem)

    return {
        "id": problem.id,
        "needs_revision": problem.needs_revision,
        "revision_date": (
            problem.revision_date.isoformat()
            if problem.revision_date else None
        ),
    }



class SystemDesignStatusUpdate(BaseModel):
    completed: bool


@router.get("/system-design")
def get_system_design_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(SystemDesignProgress)
        .filter(SystemDesignProgress.user_id == current_user.id)
        .all()
    )

    problems = []
    concepts = []

    for record in records:
        item = {
            "id": record.item_key,
            "completed": record.completed,
        }

        if record.item_type == "problem":
            problems.append(item)
        elif record.item_type == "concept":
            concepts.append(item)

    return {
        "problems": problems,
        "concepts": concepts,
    }


@router.patch("/system-design/{item_type}/{item_key}")
def update_system_design_progress(
    item_type: str,
    item_key: str,
    data: SystemDesignStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if item_type not in {"problem", "concept"}:
        raise HTTPException(
            status_code=400,
            detail="Item type must be 'problem' or 'concept'.",
        )

    item_key = item_key.strip()

    if not item_key:
        raise HTTPException(
            status_code=400,
            detail="Item key cannot be empty.",
        )

    record = (
        db.query(SystemDesignProgress)
        .filter(
            SystemDesignProgress.user_id == current_user.id,
            SystemDesignProgress.item_type == item_type,
            SystemDesignProgress.item_key == item_key,
        )
        .first()
    )

    if record is None:
        record = SystemDesignProgress(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            item_type=item_type,
            item_key=item_key,
            completed=data.completed,
        )
        db.add(record)
    else:
        record.completed = data.completed

    try:
        db.commit()
        db.refresh(record)
    except Exception:
        db.rollback()
        import traceback
        traceback.print_exc()
        print("System Design save failed:", repr(exec))
        raise HTTPException(
            status_code=500,
            detail="Could not save System Design progress.",
        )

    return {
        "message": "System Design progress saved.",
        "item_type": record.item_type,
        "item_key": record.item_key,
        "completed": record.completed,
    }


 
