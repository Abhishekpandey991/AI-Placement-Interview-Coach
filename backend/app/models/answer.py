from sqlalchemy import Column, String, Text, Integer,ForeignKey
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True)

    question_id = Column(String,ForeignKey("questions.id"), nullable=False)

    answer = Column(Text, nullable=False)

    score = Column(Integer, nullable=True)
    technical_accuracy = Column(Integer, nullable=True)
    communication = Column(Integer, nullable=True)
    problem_solving = Column(Integer, nullable=True)

    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)

    feedback = Column(Text, nullable=True)

    question = relationship(
        "Question",
        back_populates="answers"
    )