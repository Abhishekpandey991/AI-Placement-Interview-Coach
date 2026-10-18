
from pydantic import BaseModel, Field


class FollowUpRequest(BaseModel):
    interview_id: str = Field(min_length=1)
    question_id: str = Field(min_length=1)
    candidate_answer: str = Field(min_length=1)
