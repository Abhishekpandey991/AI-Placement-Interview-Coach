
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.sql import func
import uuid

from app.database.connection import Base


class DSAProblem(Base):
    __tablename__ = "dsa_problems"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    title = Column(String, nullable=False)
    topic = Column(String, nullable=False, index=True)
    difficulty = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Not Started")

    needs_revision = Column(Boolean, nullable=False, default=False)
    revision_date = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
