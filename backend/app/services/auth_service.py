import uuid
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.user import User

pwd_context=CryptContext(
  schemes=["bcrypt"],
  deprecated="auto"
)


def register_user(db:Session,name,email,password):
  existing_user=(db.query(User).filter(User.email==email).first())

  if existing_user:
    raise ValueError("Email already registered")

  hashed_password=pwd_context.hash(password)

  user=User(
    id=str(uuid.uuid4()),
    name=name,
    email=email,
    password=hashed_password
  )
  db.add(user)
  db.commit()
  db.refresh(user)
  return user

def authenticate_user(db:Session,email,password):
  user=(db.query(User).filter(User.email==email).first())

  if not user:
    return None

  if not pwd_context.verify(password,user.password):
    return None

  return user
