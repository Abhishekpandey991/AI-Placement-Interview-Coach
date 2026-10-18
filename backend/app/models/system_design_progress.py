
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)

from app.database.connection import Base


class SystemDesignProgress(Base):
    __tablename__ = "system_design_progress"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "item_type",
            "item_key",
            name="uq_system_design_user_item",
        ),
    )

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

    item_type = Column(String(20), nullable=False)
    item_key = Column(String(150), nullable=False)

    completed = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
