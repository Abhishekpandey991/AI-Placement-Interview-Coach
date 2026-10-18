from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.tutor_service import generate_tutor_response


router = APIRouter(
    prefix="/api/tutor",
    tags=["AI Interview Tutor"],
)


Category = Literal[
    "HR",
    "Behavioral",
    "Technical",
    "Resume & Projects",
    "Company Specific",
    "Aptitude",
    "Communication",
]

Level = Literal[
    "Beginner",
    "Intermediate",
    "Placement",
]

Mode = Literal[
    "Guided Learning",
    "Free Chat",
    "Practice",
]


class TutorMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=6000)


class TutorRequest(BaseModel):
    category: Category
    level: Level = "Beginner"
    mode: Mode = "Guided Learning"
    topic: str = Field(default="", max_length=200)
    role: str = Field(default="Software Engineer", max_length=150)
    company: str = Field(default="", max_length=150)
    messages: list[TutorMessage] = Field(min_length=1, max_length=20)


@router.post("/chat")
def tutor_chat(
    request: TutorRequest,
    current_user: User = Depends(get_current_user),
):
    # A client must end its conversation history with a user message.
    if request.messages[-1].role != "user":
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="The latest message must be from the user.",
        )

    messages = [
        message.model_dump()
        for message in request.messages
    ]

    answer = generate_tutor_response(
        messages=messages,
        category=request.category,
        level=request.level,
        mode=request.mode,
        topic=request.topic,
        role=request.role,
        company=request.company,
    )

    return {
        "answer": answer,
        "category": request.category,
        "mode": request.mode,
    }
