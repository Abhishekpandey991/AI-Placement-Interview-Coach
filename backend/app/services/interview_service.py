import os
import uuid
import json
from dotenv import load_dotenv
from groq import Groq
from sqlalchemy.orm import Session

from app.models.answer import Answer
from app.models.interview import Interview
from app.models.question import Question
load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def generate_with_groq(prompt):
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    return response.choices[0].message.content


def generate_questions(
    role,
    interview_type,
    difficulty,
    resume_text=None
):
    if resume_text:
        prompt = f"""
You are an expert interviewer conducting a personalized interview.

Generate exactly 10 interview questions for a candidate applying for:

Role: {role}
Interview Type: {interview_type}
Difficulty: {difficulty}

The candidate's resume is provided below:

---------------- RESUME ----------------
{resume_text}
-------------- END RESUME --------------

Requirements:

- Questions MUST be based primarily on the candidate's resume.
- Ask about projects, skills, technologies, education, experience, and achievements mentioned in the resume.
- Do not ask about technologies that are completely unrelated to the resume.
- Include a mixture of technical and project-based questions when appropriate.
- Ask questions that allow the candidate to explain their actual experience.
- Match the selected difficulty.
- Avoid duplicate questions.
- Do not invent experience or projects that are not present in the resume.
- Make questions realistic for an actual interview.
- Return ONLY the questions.
- Put each question on a separate line.
- Do not number them.
- Do not add explanations.
"""

    else:
        prompt = f"""
You are an expert technical interviewer.

Generate exactly 10 interview questions for a candidate applying for:

Role: {role}
Interview Type: {interview_type}
Difficulty: {difficulty}

Requirements:

- Questions should be relevant to the role.
- Questions should match the interview type.
- Questions should match the difficulty.
- Avoid duplicate questions.
- Return ONLY the questions.
- Put each question on a separate line.
- Do not number them.
- Do not add explanations.
"""

    response = generate_with_groq(prompt)

    questions = [
        question.strip()
        for question in response.split("\n")
        if question.strip()
    ]

    return questions[:10]


def generate_follow_up_question(
    role,
    interview_type,
    difficulty,
    original_question,
    candidate_answer,
):
    prompt = f"""
You are an expert interviewer conducting an adaptive interview.

Candidate role: {role}
Interview type: {interview_type}
Difficulty: {difficulty}

Original interview question:
{original_question}

Candidate's answer:
{candidate_answer}

Your task:
- Generate ONE relevant follow-up question.
- Ask about something specific in the candidate's answer.
- If the answer is vague, ask for clarification or a concrete example.
- If the answer is technically incorrect, probe their understanding.
- If the answer is strong, ask a deeper question.
- Keep the question relevant to the original question.
- Do not repeat the original question.
- Do not answer the question yourself.
- Return ONLY the follow-up question.
"""

    response = generate_with_groq(prompt)

    follow_up = response.strip()

    if not follow_up:
        raise ValueError(
            "Could not generate a follow-up question."
        )

    return follow_up

def create_interview(
    db: Session,
    user_id,
    role,
    interview_type,
    difficulty,
    duration,
    resume_text=None
):

    interview_id = str(uuid.uuid4())

    interview = Interview(
        id=interview_id,
        user_id=user_id,
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        duration=duration
    )

    db.add(interview)

    questions = generate_questions(
        role,
        interview_type,
        difficulty,
        resume_text
    )

    question_data = []

    for question_text in questions:

        question_id = str(uuid.uuid4())

        question = Question(
            id=question_id,
            interview_id=interview_id,
            question=question_text
        )

        db.add(question)

        question_data.append({
            "id": question_id,
            "question": question_text
        })

    db.commit()

    return {
        "interview_id": interview_id,
        "questions": question_data,
        "role": interview.role,
        "interview_type": interview.interview_type,
        "difficulty": interview.difficulty,
        "duration": interview.duration
    }


    
def evaluate_answer(
    db: Session,
    question_id,
    answer,
    role,
    interview_type,
    difficulty,
    user_id
):
    question_record = (
        db.query(Question).join(Interview)
        .filter(Question.id == question_id,
            Interview.user_id == user_id)
        .first()
    )

    if not question_record:
        raise ValueError("Question not found")

    question = question_record.question
    prompt = f"""
You are a strict technical interviewer.

Evaluate the candidate's answer ONLY based on how well it answers the question.

Role: {role}
Interview type: {interview_type}
Difficulty: {difficulty}

Question:
{question}

Candidate's answer:
{answer}


IMPORTANT SCORING RULES:

1. First determine whether the candidate's answer actually addresses the question.

2. If the answer is meaningless, random text, gibberish,
   unrelated, empty, or does not answer the question:

   - score MUST be 0
   - technical_accuracy MUST be 0
   - communication MUST be 0
   - problem_solving MUST be 0

   Clearly explain that the answer did not address the question.

3. Do NOT give points simply because the candidate entered some text.

4. A partially correct answer should receive a partial score.

5. A fully correct and well-explained answer can receive a high score.

6. The score must reflect the actual quality of the answer,
   not the effort or length.

7. Be strict like a real technical interviewer.


SCORING:

0-1  = completely wrong, meaningless, or unrelated
2-3  = very poor understanding
4-5  = partial understanding
6-7  = acceptable answer with important gaps
8-9  = good answer
10   = excellent and comprehensive answer


Return ONLY valid JSON.

The JSON MUST contain exactly these fields:

{{
    "score": 0,
    "technical_accuracy": 0,
    "communication": 0,
    "problem_solving": 0,
    "strengths": [],
    "weaknesses": [],
    "suggestions": [],
    "feedback": ""
}}


Rules:

- All scores must be integers from 0 to 10.
- If the answer does not address the question,
  all four scores should normally be 0.
- strengths must be an array of strings.
- weaknesses must be an array of strings.
- suggestions must be an array of strings.
- feedback must be a string.
- Do not include markdown.
- Do not include ```json.
"""


    response_text = generate_with_groq(prompt)
    print(response_text)
    try:
        evaluation = json.loads(response_text)
    except json.JSONDecodeError:

        raise ValueError(
            "Groq returned invalid JSON"
        )

    score_fields = [
        "score",
        "technical_accuracy",
        "communication",
        "problem_solving"
    ]

    for field in score_fields:
        value = evaluation.get(field)
        if not isinstance(value, int):
            raise ValueError(
                f"{field} must be an integer"
            )
        if value < 0 or value > 10:
            raise ValueError(
                f"{field} must be between 0 and 10"
            )

    answer_record = Answer(
        id=str(uuid.uuid4()),
        question_id=question_id,
        answer=answer,

        feedback=evaluation["feedback"],

        score=evaluation["score"],
        technical_accuracy=evaluation["technical_accuracy"],
        communication=evaluation["communication"],
        problem_solving=evaluation["problem_solving"],

        strengths=json.dumps(
            evaluation["strengths"]
        ),

        weaknesses=json.dumps(
            evaluation["weaknesses"]
        ),

        suggestions=json.dumps(
            evaluation["suggestions"]
        )
    )
    db.add(answer_record)
    db.commit()
    db.refresh(answer_record)
    
    return {
        "question_id": question_id,
        "question": question,
        "answer": answer,

        "score": evaluation["score"],
        "technical_accuracy": evaluation["technical_accuracy"],
        "communication": evaluation["communication"],
        "problem_solving": evaluation["problem_solving"],

        "strengths": evaluation["strengths"],
        "weaknesses": evaluation["weaknesses"],
        "suggestions": evaluation["suggestions"],

        "feedback": evaluation["feedback"]
    }

def get_results(
    db: Session,
    interview_id,user_id
):
    interview = (
        db.query(Interview)
        .filter(Interview.id == interview_id,
            Interview.user_id == user_id)
        .first()
    )
    if not interview:
        raise ValueError("Interview not found")
    results = []

    original_questions = [
    question
    for question in interview.questions
    if not question.is_follow_up]

    total_questions = len(original_questions)
    answered_questions = 0
    all_scores = []
    for question in interview.questions:
        answers = []
        if question.answers and not question.is_follow_up:
            answered_questions += 1
        for answer in question.answers:
            if answer.score is not None:
                all_scores.append(
                    answer.score
                )

            answers.append({
                "answer_id": answer.id,
                "answer": answer.answer,
                "score": answer.score,
                "technical_accuracy":
                    answer.technical_accuracy,
                "communication":
                    answer.communication,
                "problem_solving":
                    answer.problem_solving,
                "strengths": (
                    json.loads(answer.strengths)
                    if answer.strengths
                    else []
                ),
                "weaknesses": (
                    json.loads(answer.weaknesses)
                    if answer.weaknesses
                    else []
                ),
                "suggestions": (
                    json.loads(answer.suggestions)
                    if answer.suggestions
                    else []
                ),
                "feedback": answer.feedback
            })

        results.append({
            "question_id": question.id,
            "question": question.question,
            "is_follow_up": question.is_follow_up,
            "answers": answers,
        })

    if all_scores:
        overall_score = round(
            sum(all_scores) / len(all_scores)
        )
    else:
        overall_score = 0

        
    follow_up_questions = [
        question
        for question in interview.questions
        if question.is_follow_up
    ]

    answered_follow_up_questions = sum(
        1
        for question in follow_up_questions
        if question.answers
    )


    return {

        "interview_id": interview.id,
        "role": interview.role,
        "interview_type":
            interview.interview_type,
        "difficulty":
            interview.difficulty,
        "duration":
            interview.duration,
        "overall_score":
            overall_score,
        "total_questions":
            total_questions,
        "answered_questions":
            answered_questions,
        "questions":
            results,
        
        "follow_up_questions": len(follow_up_questions),
        "answered_follow_up_questions": answered_follow_up_questions,

    }


def get_dashboard_data(db, user_id):

    
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(Interview.id.desc())
        .all()
    )


    total_interviews = len(interviews)

    all_scores = []
    technical_scores = []
    communication_scores = []
    problem_solving_scores = []

    recent_interviews = []

    for interview in interviews:

        interview_scores = []

        questions = (
            db.query(Question)
            .filter(
                Question.interview_id == interview.id
            )
            .all()
        )

        for question in questions:

            answers = (
                db.query(Answer)
                .filter(
                    Answer.question_id == question.id
                )
                .all()
            )

            for answer in answers:

                if answer.score is not None:
                    all_scores.append(answer.score)
                    interview_scores.append(answer.score)

                if answer.technical_accuracy is not None:
                    technical_scores.append(
                        answer.technical_accuracy
                    )

                if answer.communication is not None:
                    communication_scores.append(
                        answer.communication
                    )

                if answer.problem_solving is not None:
                    problem_solving_scores.append(
                        answer.problem_solving
                    )

        # Calculate score for this interview
        interview_score = (
            round(
                sum(interview_scores)
                / len(interview_scores),
                1
            )
            if interview_scores
            else 0
        )

        recent_interviews.append({
            "interview_id": interview.id,
            "role": interview.role,
            "interview_type": interview.interview_type,
            "difficulty": interview.difficulty,
            "duration": interview.duration,
            "score": interview_score,
        })

    # Highest interview score
  
    best_score = (
        max(
            [item["score"] for item in recent_interviews]
        )
        if recent_interviews
        else 0
    )

    # Overall average
    average_score = (
        round(
            sum(all_scores) / len(all_scores),
            1
        )
        if all_scores
        else 0
    )

    # Skill averages
    technical_accuracy = (
        round(
            sum(technical_scores)
            / len(technical_scores),
            1
        )
        if technical_scores
        else 0
    )

    communication = (
        round(
            sum(communication_scores)
            / len(communication_scores),
            1
        )
        if communication_scores
        else 0
    )

    problem_solving = (
        round(
            sum(problem_solving_scores)
            / len(problem_solving_scores),
            1
        )
        if problem_solving_scores
        else 0
    )

    return {
        "total_interviews": total_interviews,
        "average_score": average_score,
        "best_score": best_score,

        "technical_accuracy": technical_accuracy,
        "communication": communication,
        "problem_solving": problem_solving,

        "recent_interviews": recent_interviews,
    }