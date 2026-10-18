
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.interview import Interview
from app.services.chat_service import generate_mentor_response
from app.services.interview_service import get_results


router = APIRouter(
    prefix="/api/chat",
    tags=["AI Placement Mentor"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=6000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(
        min_length=1,
        max_length=20,
    )


def get_user_interview_context(
    db: Session,
    user_id: str,
) -> str:
    """Build mentor context using only this user's interview records."""

    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .all()
    )

    # Keep context compact so chat requests stay manageable.
    context_parts = []

    # Use the most recent five records returned by the query.
    for interview in interviews[-5:]:
        try:
            result = get_results(
                db,
                interview.id,
                user_id,
            )
        except ValueError:
            # Ignore unavailable results rather than breaking chat.
            continue

        question_parts = []

        for question in result.get("questions", []):
            for answer in question.get("answers", []):
                question_parts.append({
                    "question": question.get("question", ""),
                    "answer": answer.get("answer", ""),
                    "score": answer.get("score"),
                    "technical_accuracy": answer.get(
                        "technical_accuracy"
                    ),
                    "communication": answer.get("communication"),
                    "problem_solving": answer.get("problem_solving"),
                    "strengths": answer.get("strengths", []),
                    "weaknesses": answer.get("weaknesses", []),
                    "suggestions": answer.get("suggestions", []),
                    "feedback": answer.get("feedback", ""),
                })

        context_parts.append({
            "role": result.get("role"),
            "interview_type": result.get("interview_type"),
            "difficulty": result.get("difficulty"),
            "duration": result.get("duration"),
            "overall_score": result.get("overall_score"),
            "total_questions": result.get("total_questions"),
            "answered_questions": result.get("answered_questions"),
            "answers": question_parts[:15],
        })

    if not context_parts:
        return (
            "No interview results are currently available for this user. "
            "Do not claim to know their interview performance. "
            "Offer general placement guidance instead."
        )

    import json

    return json.dumps(context_parts, ensure_ascii=False)


@router.post("")
def chat_with_mentor(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = [
        message.model_dump()
        for message in request.messages
    ]

    if messages[-1]["role"] != "user":
        raise HTTPException(
            status_code=400,
            detail="The latest message must be from the user.",
        )

    interview_context = get_user_interview_context(
        db,
        str(current_user.id),
    )

    answer = generate_mentor_response(
        messages,
        interview_context=interview_context,
    )

    return {"answer": answer}
