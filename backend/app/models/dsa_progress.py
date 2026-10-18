
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.database.connection import Base


class DSAProgress(Base):
    __tablename__ = "dsa_progress"

    id = Column(String, primary_key=True, index=True)

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    topic = Column(String, nullable=False)
    problems_attempted = Column(Integer, default=0, nullable=False)
    problems_solved = Column(Integer, default=0, nullable=False)
    study_minutes = Column(Integer, default=0, nullable=False)
    confidence = Column(Float, default=0, nullable=False)

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
