import json
import os
import re

from pypdf import PdfReader
from docx import Document
from groq import Groq
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def extract_pdf_text(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"
    return text


def extract_docx_text(file_path):
    document = Document(file_path)
    text = ""
    for paragraph in document.paragraphs:
        paragraph_text = paragraph.text.strip()

        if paragraph_text:
            text += paragraph_text + "\n"
    return text


def extract_resume_text(file_path, filename):
    extension = os.path.splitext(filename)[1].lower()
    if extension == ".pdf":
        return extract_pdf_text(file_path)
    elif extension == ".docx":
        return extract_docx_text(file_path)
    else:
        raise ValueError(
            "Unsupported file format. Please upload PDF or DOCX."
        )


def calculate_resume_score(resume_text):
    text = resume_text.lower()
    score = 0

    education_keywords = [
        "education",
        "b.tech",
        "btech",
        "bachelor",
        "b.sc",
        "bca",
        "m.tech",
        "mca",
        "computer science",
        "university",
        "college"
    ]

    education_found = any(
        keyword in text
        for keyword in education_keywords
    )
    if education_found:
        score += 10

    technical_skills = [
        "python",
        "java",
        "javascript",
        "typescript",
        "c++",
        "c",
        "sql",
        "html",
        "css",
        "react",
        "node",
        "express",
        "fastapi",
        "django",
        "mongodb",
        "mysql",
        "postgresql",
        "git",
        "github",
        "docker",
        "aws",
        "machine learning",
        "scikit-learn",
        "tensorflow",
        "pytorch",
        "pandas",
        "numpy",
        "rest api",
        "api"
    ]

    found_skills = [
        skill
        for skill in technical_skills
        if skill in text
    ]

    skill_count = len(found_skills)

    if skill_count >= 10:
        score += 20

    elif skill_count >= 7:
        score += 16

    elif skill_count >= 4:
        score += 12

    elif skill_count >= 2:
        score += 8

    elif skill_count >= 1:
        score += 4

    project_keywords = [
        "project",
        "projects",
        "developed",
        "built",
        "implemented",
        "application",
        "web app",
        "website",
        "system"
    ]

    project_evidence = sum(
        1
        for keyword in project_keywords
        if keyword in text
    )

    if project_evidence >= 6:
        score += 25

    elif project_evidence >= 4:
        score += 20

    elif project_evidence >= 2:
        score += 15

    elif project_evidence >= 1:
        score += 10

    experience_keywords = [
        "experience",
        "internship",
        "intern",
        "software engineer",
        "developer",
        "worked at",
        "employment"
    ]

    experience_found = sum(
        1
        for keyword in experience_keywords
        if keyword in text
    )

    if experience_found >= 3:
        score += 15

    elif experience_found >= 2:
        score += 12

    elif experience_found >= 1:
        score += 8

    structure_keywords = [
        "education",
        "skills",
        "projects",
        "experience",
        "certifications",
        "achievements",
        "summary"
    ]

    sections_found = sum(
        1
        for section in structure_keywords
        if section in text
    )

    if sections_found >= 6:
        score += 10

    elif sections_found >= 5:
        score += 8

    elif sections_found >= 3:
        score += 6

    elif sections_found >= 1:
        score += 4

    achievement_keywords = [
        "achievement",
        "achievements",
        "hackathon",
        "leetcode",
        "codeforces",
        "coding",
        "competitive programming",
        "award",
        "winner",
        "rank",
        "solved",
        "certification"
    ]

    achievement_count = sum(
        1
        for keyword in achievement_keywords
        if keyword in text
    )

    if achievement_count >= 4:
        score += 10

    elif achievement_count >= 2:
        score += 7

    elif achievement_count >= 1:
        score += 4

    software_keywords = [
        "software",
        "developer",
        "programming",
        "backend",
        "frontend",
        "full stack",
        "fullstack",
        "web development",
        "api",
        "database",
        "data structures",
        "algorithms"
    ]

    relevance_count = sum(
        1
        for keyword in software_keywords
        if keyword in text
    )

    if relevance_count >= 6:
        score += 10

    elif relevance_count >= 4:
        score += 8

    elif relevance_count >= 2:
        score += 6

    elif relevance_count >= 1:
        score += 3


    return min(score, 100)

def analyze_resume(resume_text):
    prompt = f"""
You are an expert technical recruiter and resume reviewer.
Analyze the following resume for a software engineering candidate.
IMPORTANT:
Do NOT calculate a resume score.
The resume score is calculated separately by the backend.
Return ONLY valid JSON.
Do NOT return markdown.
Do NOT return ```json.
Do NOT return explanations outside JSON.
Use EXACTLY this structure:
{{
    "summary": "",
    "skills": [],
    "strengths": [],
    "weaknesses": [],
    "missing_skills": [],
    "suggestions": [],
    "project_feedback": [],
    "interview_topics": []
}}

RULES:

1. summary:
   - One short sentence.
   - Describe the candidate based only on the resume.

2. skills:
   - Maximum 5 items.
   - Only include skills explicitly present in the resume.

3. strengths:
   - Maximum 3 items.
   - Mention specific strengths supported by the resume.

4. weaknesses:
   - Maximum 3 items.
   - Identify realistic weaknesses visible from the resume.

5. missing_skills:
   - Maximum 3 items.
   - Suggest useful software engineering skills that could improve the candidate.

6. suggestions:
   - Maximum 3 items.
   - Give practical resume improvement suggestions.

7. project_feedback:
   - Maximum 3 items.
   - Discuss only projects actually present in the resume.

8. interview_topics:
   - Maximum 5 items.
   - Topics must be based on technologies and projects present in the resume.

9. Do not invent:
   - projects
   - jobs
   - internships
   - technologies
   - education
   - achievements

10. Keep the response concise.

RESUME:

{resume_text}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    content = response.choices[0].message.content

    if not content:
        raise ValueError("Groq returned an empty response.")

    content = content.strip()

    # Remove markdown if model accidentally returns it
    if content.startswith("```json"):
        content = content[7:].strip()

    elif content.startswith("```"):
        content = content[3:].strip()

    if content.endswith("```"):
        content = content[:-3].strip()

    try:
        analysis = json.loads(content)

    except json.JSONDecodeError as error:

        print("JSON parsing failed:", error)
        print("Raw response:", content)

        raise ValueError(
            "Groq returned invalid JSON."
        )

    required_fields = [
        "summary",
        "skills",
        "strengths",
        "weaknesses",
        "missing_skills",
        "suggestions",
        "project_feedback",
        "interview_topics"
    ]

    for field in required_fields:

        if field not in analysis:

            raise ValueError(
                f"Missing field in AI response: {field}"
            )

    return analysis


def calculate_resume_score(resume_text):
    text = resume_text.lower()
    score = 0
    # Technical skills
    skills = [
        "python",
        "java",
        "javascript",
        "react",
        "fastapi",
        "node",
        "express",
        "mongodb",
        "mysql",
        "machine learning",
        "generative ai",
        "langchain",
        "docker",
        "git",
    ]

    skills_found = sum(
        1 for skill in skills
        if skill in text
    )

    score += min(skills_found * 3, 30)

    # Projects
    project_keywords = [
        "project",
        "github",
        "api",
        "machine learning",
        "fastapi",
    ]

    projects_found = sum(
        1 for keyword in project_keywords
        if keyword in text
    )

    score += min(projects_found * 4, 20)

    # Education
    if any(word in text for word in [
        "b.tech",
        "btech",
        "bachelor",
        "computer science"
    ]):
        score += 10

    # Experience
    if any(word in text for word in [
        "internship",
        "intern",
        "experience"
    ]):
        score += 15

    # Deployment
    if any(word in text for word in [
        "render",
        "aws",
        "azure",
        "vercel",
        "deployment",
        "deployed"
    ]):
        score += 10

    # GitHub
    if "github" in text:
        score += 5

    return min(score, 100)

def get_resume_analysis(resume_text):
    analysis = analyze_resume(resume_text)
    resume_score = calculate_resume_score(resume_text)
    analysis["resume_score"] = resume_score
    return analysis



from io import BytesIO


def extract_resume_text_from_bytes(file_bytes, filename):
    extension = os.path.splitext(filename)[1].lower()

    if extension == ".pdf":
        reader = PdfReader(BytesIO(file_bytes))

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        return text

    elif extension == ".docx":
        document = Document(BytesIO(file_bytes))

        text = ""

        for paragraph in document.paragraphs:
            paragraph_text = paragraph.text.strip()

            if paragraph_text:
                text += paragraph_text + "\n"

        return text

    else:
        raise ValueError(
            "Unsupported file format. Please upload PDF or DOCX."
        )