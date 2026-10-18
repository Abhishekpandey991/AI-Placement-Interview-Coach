from sqlalchemy import Column, String
from app.database.connection import Base

class User(Base):
  __tablename__ = "users"
  id = Column(String, primary_key=True)
  name = Column(String, nullable=False)
  email = Column(String, unique=True, nullable=False)
  password = Column(String, nullable=False)

