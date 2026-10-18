import json
import uuid

from groq import Groq

from app.core.config import settings
from app.models.answer import Answer
from app.models.interview import Interview
from app.models.question import Question
from app.models.improvement_plan import ImprovementPlan

client = Groq(api_key=settings.GROQ_API_KEY)


def generate_improvement_plan(db, interview_id: str, user_id: str):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == user_id,
        )
        .first()
    )

    if not interview:
        raise ValueError("Interview not found.")

    saved_plan = (
        db.query(ImprovementPlan)
        .filter(
            ImprovementPlan.interview_id == interview_id,
            ImprovementPlan.user_id == user_id,
        )
        .first()
    )

    if saved_plan:
        return {
            "interview_id": saved_plan.interview_id,
            "role": interview.role,
            "plan_type": saved_plan.plan_type,
            "assessment_note": saved_plan.assessment_note,
            "evaluated_answers": saved_plan.evaluated_answers,
            "plan": json.loads(saved_plan.plan_json),
            "completed_task_ids": json.loads(
                saved_plan.completed_tasks_json
            ),
        }

    questions = (
        db.query(Question)
        .filter(Question.interview_id == interview.id)
        .all()
    )

    evaluations = []

    for question in questions:
        answers = (
            db.query(Answer)
            .filter(Answer.question_id == question.id)
            .all()
        )

        for answer in answers:
            if not answer.answer or not answer.answer.strip():
                continue

            if answer.score is None:
                continue

            evaluations.append({
                "question": question.question,
                "is_follow_up": question.is_follow_up,
                "candidate_answer": answer.answer,
                "score": answer.score,
                "technical_accuracy": answer.technical_accuracy,
                "communication": answer.communication,
                "problem_solving": answer.problem_solving,
                "strengths": answer.strengths,
                "weaknesses": answer.weaknesses,
                "suggestions": answer.suggestions,
                "feedback": answer.feedback,
            })

    evaluated_count = len(evaluations)

    if evaluated_count == 0:
        plan_type = "general"
        assessment_note = (
            "No evaluated nonblank answers are available. "
            "This is a general preparation plan, not an "
            "assessment of the candidate's performance."
        )

        evidence = """
No evaluated answers are available.

Create a general preparation plan using only the interview
role, interview type, and difficulty.

Do not claim the candidate has any particular strengths
or weaknesses. Return empty strengths and weak_areas arrays.
Do not invent performance scores or evaluation data.
Recommend practical activities relevant to the role.
Explain that no answers were available for performance assessment.
"""

    elif evaluated_count < 3:
        plan_type = "preliminary"
        assessment_note = (
            "This plan uses limited interview evidence. "
            "Recommendations may change as more answers are evaluated."
        )

        evidence = f"""
Evaluated answers:
{json.dumps(evaluations, default=str)}

Create a preliminary plan based on this evidence.
Distinguish observed weaknesses from skills that have not
been assessed. Do not generalize limited evidence or invent
candidate strengths, weaknesses, or scores.
Include general role-related practice where appropriate.
"""

    else:
        plan_type = "personalized"
        assessment_note = (
            "This plan uses the candidate's evaluated interview answers."
        )

        evidence = f"""
Evaluated answers:
{json.dumps(evaluations, default=str)}

Create a personalized preparation plan based on the evidence.
Prioritize weaknesses supported by the evaluations.
Recognize demonstrated strengths only when supported.
Do not make unsupported claims about untested skills.
"""

    prompt = f"""
You are an expert AI interview coach.

Create a practical seven-day preparation plan.

Interview role: {interview.role}
Interview type: {interview.interview_type}
Difficulty: {interview.difficulty}

Assessment mode: {plan_type}

Evidence:
{evidence}

Return ONLY valid JSON in this structure:

{{
  "summary": "Honest performance summary or general preparation overview",
  "strengths": [],
  "weak_areas": [],
  "weekly_plan": [
    {{
      "day": 1,
      "topic": "Topic",
      "tasks": ["Task 1", "Task 2"],
      "goal": "Measurable expected outcome"
    }}
  ],
  "next_interview_tips": [
    "Actionable tip 1",
    "Actionable tip 2"
  ]
}}

Rules:
- Return exactly seven days in weekly_plan.
- Every day must include day, topic, tasks, and goal.
- Make tasks practical and relevant to the role.
- Match the interview type and difficulty.
- strengths must be an array of strings.
- weak_areas must be an array of objects with skill, reason,
  and priority fields when evidence supports specific weaknesses.
- For general plans, strengths and weak_areas must both be empty.
- Never invent candidate performance data or scores.
- Return valid JSON only, without Markdown fences.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an evidence-based interview coach. "
                    "Never fabricate candidate performance data. "
                    "Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.3,
    )

    content = response.choices[0].message.content

    if not content:
        raise ValueError("The AI returned an empty improvement plan.")

    content = content.strip()

    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        content = content.rsplit("```", 1)[0].strip()

    try:
        plan = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(
            "The AI returned an invalid improvement plan."
        ) from exc

    weekly_plan = plan.get("weekly_plan")

    if not isinstance(weekly_plan, list) or len(weekly_plan) != 7:
        raise ValueError(
            "The AI did not return a valid seven-day plan."
        )

    if plan_type == "general":
        plan["strengths"] = []
        plan["weak_areas"] = []

    saved_plan = ImprovementPlan(
        id=str(uuid.uuid4()),
        interview_id=interview.id,
        user_id=user_id,
        plan_json=json.dumps(plan),
        plan_type=plan_type,
        assessment_note=assessment_note,
        evaluated_answers=evaluated_count,
        completed_tasks_json="[]",
    )

    try:
        db.add(saved_plan)
        db.commit()
        db.refresh(saved_plan)
    except Exception:
        db.rollback()
        raise

    return {
        "interview_id": interview.id,
        "role": interview.role,
        "plan_type": saved_plan.plan_type,
        "assessment_note": saved_plan.assessment_note,
        "evaluated_answers": saved_plan.evaluated_answers,
        "plan": json.loads(saved_plan.plan_json),
        "completed_task_ids": json.loads(
            saved_plan.completed_tasks_json
        ),
    }