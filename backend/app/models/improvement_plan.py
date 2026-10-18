from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)

from app.database.connection import Base


class ImprovementPlan(Base):
    __tablename__ = "improvement_plans"

    id = Column(String, primary_key=True)
    interview_id = Column(
        String,
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )


    plan_json = Column(Text, nullable=False)
    plan_type = Column(String, nullable=False)
    assessment_note = Column(Text, nullable=False)
    evaluated_answers = Column(Integer, nullable=False, default=0)

  
    completed_tasks_json = Column(Text, nullable=False, default="[]")

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )