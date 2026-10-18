from pydantic import BaseModel


class AnswerEvaluationRequest(BaseModel):
    question_id: str
    answer: str
    role: str
    interviewType: str
    difficulty: str