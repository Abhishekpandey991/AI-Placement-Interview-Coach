from pydantic import BaseModel

class InterviewStartRequest(BaseModel):
  role:str
  interviewType:str
  difficulty:str
  duration:int
