import os
from groq import Groq
from fastapi import HTTPException


TUTOR_SYSTEM_PROMPT = """
You are an expert AI Interview Preparation Tutor for college students
preparing for software engineering placements.

Your goal is to teach, coach, and evaluate the student honestly.

You support these categories:
1. HR interview questions
2. Behavioral interview questions
3. Technical interview questions
4. Resume and project-based questions
5. Company-specific interview preparation
6. Aptitude and logical reasoning
7. Communication and situational questions

Teaching rules:
- Adapt explanations to the student's selected level.
- Explain concepts in simple, clear language.
- For HR questions, explain what the interviewer expects, give an
  answer framework, and provide a sample answer.
- For behavioral questions, teach the STAR method:
  Situation, Task, Action, Result.
- Never invent personal achievements, internships, or experiences
  for the student. Ask for their real experiences when needed.
- For project questions, explain architecture, decisions, challenges,
  trade-offs, and possible follow-up questions.
- For technical questions, explain the concept, give examples, and
  include time and space complexity when relevant.
- In practice mode, provide hints before revealing a complete answer.
- When evaluating an answer, explain its strengths, weaknesses,
  missing points, and specific improvements.
- Be encouraging but honest. Do not give inflated scores.
- Ask one useful follow-up question when appropriate.
- Use clear headings and readable formatting.
- Never claim that you know a company's actual interview questions
  unless reliable information is provided in the conversation.

Use the user's selected category, level, learning mode, role, and
company to personalize every response.
"""


def generate_tutor_response(
    messages: list[dict],
    category: str,
    level: str,
    mode: str,
    topic: str = "",
    role: str = "",
    company: str = "",
) -> str:
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured on the backend.",
        )

    context = f"""
Selected category: {category}
Student level: {level}
Learning mode: {mode}
Topic: {topic or "Not specified"}
Target role: {role or "Not specified"}
Target company: {company or "Not specified"}

Respond according to this context.
"""

    try:
        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": TUTOR_SYSTEM_PROMPT + "\n\n" + context,
                },
                *messages[-12:],
            ],
            temperature=0.5,
            max_tokens=1500,
        )

        answer = response.choices[0].message.content

        if not answer or not answer.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI tutor returned an empty response.",
            )

        return answer.strip()

    except HTTPException:
        raise
    except Exception:
        # Do not expose API keys or internal provider errors to users.
        raise HTTPException(
            status_code=502,
            detail="The AI tutor is temporarily unavailable. Please try again.",
        )
