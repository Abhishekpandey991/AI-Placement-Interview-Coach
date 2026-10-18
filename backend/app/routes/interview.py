import json
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
import uuid
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.models.interview import Interview
from app.models.question import Question
from app.schemas.follow_up import FollowUpRequest
from app.services.interview_service import generate_follow_up_question
from app.schemas.answer import AnswerEvaluationRequest
from app.services.improvement_service import generate_improvement_plan
from pydantic import BaseModel

from app.services.interview_service import (
    create_interview,
    evaluate_answer,
    get_results,
    get_dashboard_data,
    generate_follow_up_question,
)

from app.services.resume_service import extract_resume_text_from_bytes
from app.schemas.improvement_progress import ImprovementProgressUpdate
from app.models.improvement_plan import ImprovementPlan
from app.models.answer import Answer
router = APIRouter(
    prefix="/api/interview",
    tags=["Interview"],
)

@router.post("/start")
async def start_interview(
    role: str = Form(...),
    interviewType: str = Form(...),
    difficulty: str = Form(...),
    duration: int = Form(...),
    resume: UploadFile | None = File(None),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume_text = None


    if interviewType == "Resume Based":

        if not resume:
            raise HTTPException(
                status_code=400,
                detail="Resume is required for a Resume Based interview.",
            )

        allowed_extensions = [".pdf", ".docx"]

        filename = (resume.filename or "").lower()

        if not any(
            filename.endswith(extension)
            for extension in allowed_extensions
        ):
            raise HTTPException(
                status_code=400,
                detail="Only PDF and DOCX resumes are supported.",
            )

        # Read uploaded file
        file_bytes = await resume.read()

        # Maximum file size = 5 MB
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Resume size must be less than 5MB.",
            )

        # Extract resume text
        try:
            resume_text = extract_resume_text_from_bytes(
                file_bytes,
                resume.filename,
            )

        except Exception as error:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to read resume: {str(error)}",
            )

        # Make sure text was extracted
        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the resume.",
            )

    interview = create_interview(
        db,
        current_user.id,
        role,
        interviewType,
        difficulty,
        duration,
        resume_text,
    )

    return interview


@router.post("/evaluate")
def evaluate_answer_route(
    data: AnswerEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    evaluation = evaluate_answer(
        db,
        data.question_id,
        data.answer,
        data.role,
        data.interviewType,
        data.difficulty,
        current_user.id,
    )

    return evaluation



@router.post("/follow-up")
def create_follow_up(
    data: FollowUpRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == data.interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found.",
        )

    original_question = (
        db.query(Question)
        .filter(
            Question.id == data.question_id,
            Question.interview_id == interview.id,
        )
        .first()
    )

    if not original_question:
        raise HTTPException(
            status_code=404,
            detail="Original question not found.",
        )

    try:
        follow_up_text = generate_follow_up_question(
            role=interview.role,
            interview_type=interview.interview_type,
            difficulty=interview.difficulty,
            original_question=original_question.question,
            candidate_answer=data.candidate_answer,
        )

        if not follow_up_text or not follow_up_text.strip():
            raise ValueError("Empty follow-up question returned.")

        follow_up = Question(
            id=str(uuid.uuid4()),
            interview_id=interview.id,
            question=follow_up_text.strip(),
            is_follow_up=True,
        )

        db.add(follow_up)
        db.commit()
        db.refresh(follow_up)

        return {
            "question_id": follow_up.id,
            "follow_up_question": follow_up.question,
        }

    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail=f"Failed to generate follow-up question: {str(error)}",
        )


   



@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_data(
        db,
        current_user.id,
    )


@router.get("/{interview_id}/results")
def get_interview_results(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_results(
        db,
        interview_id,
        current_user.id,
    )

    return result



@router.get("/improvement-plan/{interview_id}")
def get_improvement_plan(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return generate_improvement_plan(
            db=db,
            interview_id=interview_id,
            user_id=current_user.id,
        )
    except ValueError as error:
        message = str(error)

        if message == "Interview not found.":
            raise HTTPException(status_code=404, detail=message)

        raise HTTPException(status_code=400, detail=message)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to generate the improvement plan right now.",
        )


@router.put("/improvement-plan/{interview_id}/progress")
def update_improvement_progress(
    interview_id: str,
    data: ImprovementProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    saved_plan = (
        db.query(ImprovementPlan)
        .filter(
            ImprovementPlan.interview_id == interview_id,
            ImprovementPlan.user_id == current_user.id,
        )
        .first()
    )

    if not saved_plan:
        raise HTTPException(
            status_code=404,
            detail="Improvement plan not found.",
        )

    plan = json.loads(saved_plan.plan_json)

    valid_task_ids = set()

    for day_index, day in enumerate(plan.get("weekly_plan", [])):
        day_number = day.get("day", day_index + 1)

        for task_index, _ in enumerate(day.get("tasks", [])):
            valid_task_ids.add(
                f"day-{day_number}-task-{task_index}"
            )

    requested_ids = set(data.completed_task_ids)

    if not requested_ids.issubset(valid_task_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more task IDs are invalid.",
        )

    saved_plan.completed_tasks_json = json.dumps(
        sorted(requested_ids)
    )

    db.commit()

    return {
        "completed_task_ids": sorted(requested_ids),
        "message": "Progress saved.",
    }


@router.get("/history")
def get_completed_interview_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .all()
    )

    history = []

    for interview in interviews:
        questions = (
            db.query(Question)
            .filter(
                Question.interview_id == interview.id,
                Question.is_follow_up == False,
            )
            .all()
        )

        if not questions:
            continue

        answered_count = 0

        for question in questions:
            answers = (
                db.query(Answer)
                .filter(Answer.question_id == question.id)
                .all()
            )

            if any(
                answer.answer and answer.answer.strip()
                for answer in answers
            ):
                answered_count += 1

        if answered_count > 0:
            history.append({
                "interview_id": interview.id,
                "role": interview.role,
                "interview_type": interview.interview_type,
                "difficulty": interview.difficulty,
                "duration": interview.duration,
                "total_questions": len(questions),
                "answered_questions": answered_count,
            })

    history.sort(
        key=lambda item: item["interview_id"],
        reverse=True,
    )

    return {"interviews": history}


    