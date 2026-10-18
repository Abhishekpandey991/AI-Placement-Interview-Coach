
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import Base, engine

# Import all models before creating tables
from app.models import Interview, Question, Answer
from app.models.dsa_progress import DSAProgress
from app.models.dsa_problem import DSAProblem

from app.routes.interview import router as interview_router
from app.routes.auth import router as auth_router
from app.routes.resume import router as resume_router
from app.routes.progress import router as progress_router
from app.models.system_design_progress import SystemDesignProgress
from app.routes.chat import router as chat_router
from app.routes.tutor import router as tutor_router
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Placement Interview Coach API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router)
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(progress_router)
app.include_router(chat_router)
app.include_router(tutor_router)

@app.get("/")
def root():
    return {
        "message": "AI Placement Interview Coach API is running"
    }
