import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime
from app.database.connection import Base


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    user_id = Column(
        String,
        nullable=False,
        index=True
    )
    filename = Column(
        String,
        nullable=False
    )
    resume_score = Column(
        Integer,
        nullable=False
    )
    summary = Column(
        Text,
        nullable=True
    )
    skills = Column(
        Text,
        nullable=True
    )
    strengths = Column(
        Text,
        nullable=True
    )
    weaknesses = Column(
        Text,
        nullable=True
    )
    missing_skills = Column(
        Text,
        nullable=True
    )

    suggestions = Column(
        Text,
        nullable=True
    )

    project_feedback = Column(
        Text,
        nullable=True
    )

    interview_topics = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )