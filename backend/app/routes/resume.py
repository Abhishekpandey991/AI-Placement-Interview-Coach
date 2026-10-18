import json
import os
import tempfile

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.resume_analysis import ResumeAnalysis
from app.services.resume_service import (
    extract_resume_text,
    get_resume_analysis,
)

router = APIRouter(
    prefix="/api/resume",
    tags=["Resume Analyzer"],
)


@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_extensions = [".pdf", ".docx"]

    filename = file.filename or ""
    extension = os.path.splitext(filename)[1].lower()

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Please upload a resume.",
        )

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported.",
        )

    contents = await file.read()

    max_size = 5 * 1024 * 1024

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Resume must be smaller than 5MB.",
        )

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded resume is empty.",
        )

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            delete=False,
            suffix=extension,
        ) as temp_file:
            temp_file.write(contents)
            temp_file.flush()
            temp_path = temp_file.name

        resume_text = extract_resume_text(
            temp_path,
            filename,
        )

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the resume.",
            )

        resume_text = resume_text[:30000]

        analysis = get_resume_analysis(resume_text)

        resume_record = ResumeAnalysis(
            id=None,
            user_id=current_user.id,
            filename=filename,
            resume_score=analysis["resume_score"],
            summary=analysis.get("summary", ""),
            skills=json.dumps(analysis.get("skills", [])),
            strengths=json.dumps(analysis.get("strengths", [])),
            weaknesses=json.dumps(analysis.get("weaknesses", [])),
            missing_skills=json.dumps(
                analysis.get("missing_skills", [])
            ),
            suggestions=json.dumps(
                analysis.get("suggestions", [])
            ),
            project_feedback=json.dumps(
                analysis.get("project_feedback", [])
            ),
            interview_topics=json.dumps(
                analysis.get("interview_topics", [])
            ),
        )

        db.add(resume_record)
        db.commit()
        db.refresh(resume_record)

        return {
            "message": "Resume analyzed successfully.",
            "analysis_id": resume_record.id,
            "user_id": current_user.id,
            "filename": filename,
            "analysis": analysis,
        }

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()
        print("Resume analysis error:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to analyze resume.",
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/history")
def get_resume_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(ResumeAnalysis)
        .filter(
            ResumeAnalysis.user_id == current_user.id
        )
        .order_by(
            ResumeAnalysis.created_at.desc()
        )
        .all()
    )
    history = []

    for record in records:

        history.append({
            "id": record.id,

            "filename": record.filename,

            "resume_score": record.resume_score,

            "summary": record.summary,

            "created_at": record.created_at.isoformat()
            if record.created_at
            else None,
        })

    return {
        "history": history
    }

@router.get("/analysis/{analysis_id}")
def get_resume_analysis_by_id(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(ResumeAnalysis)
        .filter(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == current_user.id,
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Resume analysis not found.",
        )

    return {
        "id": record.id,
        "filename": record.filename,
        "resume_score": record.resume_score,
        "summary": record.summary,
        "skills": json.loads(record.skills or "[]"),
        "strengths": json.loads(record.strengths or "[]"),
        "weaknesses": json.loads(record.weaknesses or "[]"),
        "missing_skills": json.loads(record.missing_skills or "[]"),
        "suggestions": json.loads(record.suggestions or "[]"),
        "project_feedback": json.loads(
            record.project_feedback or "[]"
        ),
        "interview_topics": json.loads(
            record.interview_topics or "[]"
        ),
        "created_at": (
            record.created_at.isoformat()
            if record.created_at
            else None
        ),
    }