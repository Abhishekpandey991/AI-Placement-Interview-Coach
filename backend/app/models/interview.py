from sqlalchemy import Column,String,Integer,ForeignKey
from sqlalchemy.orm import relationship

from app.database.connection import Base

class Interview(Base):
  __tablename__="interviews"
  id=Column(String,primary_key=True)
  user_id=Column(String,ForeignKey("users.id"),nullable=False)
  role=Column(String,nullable=False)
  interview_type = Column(String, nullable=False)
  difficulty = Column(String, nullable=False)
  duration = Column(Integer, nullable=False)

  questions=relationship(
    "Question",
    back_populates="interview",
    cascade="all, delete-orphan",
  )
  


