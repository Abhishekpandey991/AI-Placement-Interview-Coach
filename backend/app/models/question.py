from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base
from sqlalchemy import Boolean, Column

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True)
    interview_id = Column(
        String,
        ForeignKey("interviews.id"),
        nullable=False
    )

    question = Column(Text, nullable=False)
    is_follow_up = Column(
    Boolean,
    default=False,
    nullable=False,
    server_default="0",
)

    interview = relationship(
        "Interview",
        back_populates="questions"
    )

    answers = relationship(
        "Answer",
        back_populates="question",
        cascade="all, delete-orphan"
    )