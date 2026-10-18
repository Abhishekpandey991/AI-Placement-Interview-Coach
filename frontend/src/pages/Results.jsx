import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";

import { getInterviewResults } from "../services/api";

export default function Results() {
  const location = useLocation();
  const interviewId =
    location.state?.interviewId ||
    localStorage.getItem("current_interview_id");

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        if (!interviewId) {
          throw new Error("Interview ID not found");
        }

        console.log("Interview ID:", interviewId);

        const data = await getInterviewResults(interviewId);

        console.log("Interview results:", data);

        setResults(data);
      } catch (error) {
        console.error("Results error:", error);

        setError(
          error.message || "Failed to load interview results"
        );
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [interviewId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
          <Sidebar />

          <main className="flex flex-1 items-center justify-center p-6">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

              <p className="mt-5 text-slate-400">
                Loading your interview results...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
          <Sidebar />

          <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
            <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl">
                !
              </div>

              <h1 className="mt-5 text-2xl font-bold">
                Unable to load results
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {error}
              </p>

              <Link
                to="/dashboard"
                className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // -----------------------------
  // No results
  // -----------------------------

  if (!results) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <div className="flex min-h-[calc(100vh-81px)]">
          <Sidebar />

          <main className="flex flex-1 items-center justify-center">
            <p className="text-slate-400">
              Results not found.
            </p>
          </main>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Safe data
  // -----------------------------
 
  // Safe data
  const questions = results.questions || [];

  const originalQuestions = questions.filter(
    (question) => !question.is_follow_up
  );

  const followUpQuestionItems = questions.filter(
    (question) => question.is_follow_up
  );

  const overallScore = Number(results.overall_score ?? 0);

  const totalQuestions =
    results.total_questions ?? originalQuestions.length;

  const answeredQuestions =
    results.answered_questions ??
    originalQuestions.filter(
      (question) => question.answers?.length > 0
    ).length;

  const followUpQuestions =
    results.follow_up_questions ?? followUpQuestionItems.length;

  const answeredFollowUpQuestions =
    results.answered_follow_up_questions ??
    followUpQuestionItems.filter(
      (question) => question.answers?.length > 0
    ).length;

  const completion =
    totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;


  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        <Sidebar />

        <main className="min-w-0 flex-1 px-3.5 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">

          {/* =========================
              HEADER
          ========================= */}

          <section className="mb-6 sm:mb-10">

            <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-end md:justify-between">

              <div>

                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-500">
                  Interview Results
                </p>

                <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                  Interview Complete 🎉
                </h1>

                <p className="mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base text-slate-400">
                  Review your performance, understand your
                  weaknesses, and use the AI feedback to improve
                  your next interview.
                </p>

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 sm:px-5 sm:py-4">

                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500">
                  Interview ID
                </p>

                <p className="mt-0.5 sm:mt-1 max-w-56 truncate text-xs sm:text-sm text-slate-300">
                  {interviewId}
                </p>

              </div>

            </div>

          </section>


          {/* =========================
              INTERVIEW INFORMATION
          ========================= */}

          <Card className="mb-6 sm:mb-8">

            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">

              <InfoItem
                label="Role"
                value={results.role || "N/A"}
              />

              <InfoItem
                label="Interview Type"
                value={results.interview_type || "N/A"}
              />

              <InfoItem
                label="Difficulty"
                value={results.difficulty || "N/A"}
              />

              <InfoItem
                label="Duration"
                value={`${results.duration ?? 0} minutes`}
              />

            </div>

          </Card>


          {/* =========================
              SCORE CARDS
          ========================= */}

          
    <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label="Overall Score"
        value={`${overallScore}/10`}
        description="AI evaluation across answered questions"
        highlight
      />

      <StatCard
        label="Original Questions"
        value={totalQuestions}
        description="Total original questions"
      />

      <StatCard
        label="Original Questions Answered"
        value={`${answeredQuestions}/${totalQuestions}`}
        description="Original interview progress"
      />

      <StatCard
        label="Completion"
        value={`${completion}%`}
        description="Original question completion"
      />

      <StatCard
        label="Follow-up Questions"
        value={followUpQuestions}
        description="Adaptive questions generated"
      />

      <StatCard
        label="Follow-ups Answered"
        value={`${answeredFollowUpQuestions}/${followUpQuestions}`}
        description="Adaptive follow-up progress"
      />
    </div>


          {/* =========================
              OVERALL PERFORMANCE
          ========================= */}

          <Card className="mb-10">

            <div className="grid gap-8 md:grid-cols-[1fr_220px] md:items-center">

              <div>

                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Overall Performance
                </p>

                <div className="mt-3 flex items-end gap-2">

                  <span className="text-6xl font-bold tracking-tight text-blue-500">
                    {overallScore}
                  </span>

                  <span className="mb-2 text-2xl text-slate-500">
                    /10
                  </span>

                </div>

                <p className="mt-3 text-sm text-slate-400">
                  Your overall interview score based on AI evaluation.
                </p>


                {/* Progress */}

                <div className="mt-6">

                  <div className="mb-2 flex justify-between text-sm">

                    <span className="text-slate-400">
                      Performance
                    </span>

                    <span className="font-semibold text-slate-300">
                      {overallScore * 10}%
                    </span>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(
                          overallScore * 10,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              </div>


              {/* Score circle */}

              <div className="flex justify-center">

                <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-blue-500/20">

                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-500/10">

                    <div className="text-center">

                      <p className="text-3xl font-bold text-blue-400">
                        {overallScore}
                      </p>

                      <p className="text-xs text-slate-500">
                        OUT OF 10
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </Card>


          {/* =========================
              QUESTION ANALYSIS
          ========================= */}

          <div>

            <div className="mb-6">

              <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
                Detailed Analysis
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Question Analysis
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Review every answer and the AI's evaluation.
              </p>

            </div>


            <div className="space-y-6">

              {questions.map((item, index) => {

                const answers = item.answers || [];

                return (
                  <Card
                    key={
                      item.question_id ||
                      index
                    }
                  >

                    {/* Question Header */}

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                      <div>

                        
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      item.is_follow_up
                        ? "bg-purple-500/10 text-purple-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {item.is_follow_up
                      ? `Follow-up ${questions
                          .slice(0, index + 1)
                          .filter((question) => question.is_follow_up).length}`
                      : `Question ${questions
                          .slice(0, index + 1)
                          .filter((question) => !question.is_follow_up).length}`}
                  </span>


                        <h3 className="mt-4 text-lg font-semibold leading-7 text-white">
                          {item.question}
                        </h3>

                      </div>


                      {answers.length > 0 && (

                        <div className="shrink-0 rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-3 text-center">

                          <p className="text-xs text-slate-400">
                            Score
                          </p>

                          <p className="mt-1 text-2xl font-bold text-blue-400">
                            {answers[0].score ?? 0}
                            <span className="text-sm text-slate-500">
                              /10
                            </span>
                          </p>

                        </div>

                      )}

                    </div>


                    {/* No Answer */}

                    {answers.length === 0 ? (

                      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">

                        <p className="text-sm text-slate-500">
                          No answer was submitted for this question.
                        </p>

                      </div>

                    ) : (

                      answers.map(
                        (answer, answerIndex) => (

                          <div
                            key={
                              answer.answer_id ||
                              answerIndex
                            }
                            className="mt-8"
                          >

                            {/* Your Answer */}

                            <div>

                              <p className="text-sm font-semibold text-slate-300">
                                Your Answer
                              </p>

                              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-5">

                                <p className="whitespace-pre-line leading-7 text-slate-300">
                                  {answer.answer ||
                                    "No answer provided."}
                                </p>

                              </div>

                            </div>


                            {/* Score Breakdown */}

                            <div className="mt-7">

                              <p className="text-sm font-semibold text-slate-300">
                                Score Breakdown
                              </p>

                              <div className="mt-3 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-3">

                                <Score
                                  label="Technical Accuracy"
                                  value={
                                    answer.technical_accuracy
                                  }
                                />

                                <Score
                                  label="Communication"
                                  value={
                                    answer.communication
                                  }
                                />

                                <Score
                                  label="Problem Solving"
                                  value={
                                    answer.problem_solving
                                  }
                                />

                              </div>

                            </div>


                            {/* Strengths */}

                            <FeedbackSection
                              title="Strengths"
                              icon="✓"
                              type="success"
                              items={
                                answer.strengths || []
                              }
                            />


                            {/* Weaknesses */}

                            <FeedbackSection
                              title="Areas to Improve"
                              icon="!"
                              type="danger"
                              items={
                                answer.weaknesses || []
                              }
                            />


                            {/* Suggestions */}

                            <FeedbackSection
                              title="Suggestions"
                              icon="→"
                              type="info"
                              items={
                                answer.suggestions || []
                              }
                            />


                            {/* AI Feedback */}

                            <div className="mt-7 rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                                  🤖
                                </div>

                                <div>

                                  <p className="font-semibold text-purple-400">
                                    AI Feedback
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    Personalized evaluation
                                  </p>

                                </div>

                              </div>

                              <p className="mt-4 whitespace-pre-line leading-7 text-slate-300">
                                {answer.feedback ||
                                  "No feedback available."}
                              </p>

                            </div>

                          </div>

                        )
                      )

                    )}

                  </Card>
                );

              })}

            </div>

          </div>


          {/* =========================
              ACTIONS
          ========================= */}

          <div className="mt-8 sm:mt-10 flex flex-col gap-2.5 sm:gap-3 sm:flex-row">

            <Link
              to="/interview/setup"
              className="w-full sm:w-auto rounded-xl bg-blue-600 px-5 py-2.5 sm:px-6 sm:py-3 text-center text-sm sm:text-base font-semibold transition hover:bg-blue-700"
            >
              Practice Again
            </Link>

            <Link
              to="/preparation"
              className="w-full sm:w-auto rounded-xl border border-slate-700 px-5 py-2.5 sm:px-6 sm:py-3 text-center text-sm sm:text-base font-semibold transition hover:bg-slate-800"
            >
              View Preparation Plan
            </Link>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto rounded-xl border border-slate-700 px-5 py-2.5 sm:px-6 sm:py-3 text-center text-sm sm:text-base font-semibold transition hover:bg-slate-800"
            >
              Dashboard
            </Link>

          </div>

        </main>

      </div>
    </div>
  );
}


/* =====================================================
   INFO ITEM
===================================================== */

function InfoItem({ label, value }) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-200">
        {value}
      </p>

    </div>
  );
}


/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  label,
  value,
  description,
  highlight = false,
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight
          ? "border-blue-500/20 bg-blue-500/5"
          : "border-slate-800 bg-slate-900"
      }`}
    >

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${
          highlight
            ? "text-blue-500"
            : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}


/* =====================================================
   SCORE COMPONENT
===================================================== */

function Score({ label, value }) {

  const score = Number(value ?? 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between">

        <p className="text-xl font-bold text-slate-200">
          {score}/10
        </p>

        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-800">

          <div
            className="h-full rounded-full bg-blue-500"
            style={{
              width: `${Math.min(
                score * 10,
                100
              )}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   FEEDBACK SECTION
===================================================== */

function FeedbackSection({
  title,
  icon,
  items,
  type,
}) {

  if (!items || items.length === 0) {
    return null;
  }

  const styles = {
    success: {
      border: "border-green-500/20",
      bg: "bg-green-500/5",
      icon: "bg-green-500/10 text-green-400",
      title: "text-green-400",
    },

    danger: {
      border: "border-red-500/20",
      bg: "bg-red-500/5",
      icon: "bg-red-500/10 text-red-400",
      title: "text-red-400",
    },

    info: {
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
      icon: "bg-blue-500/10 text-blue-400",
      title: "text-blue-400",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`mt-7 rounded-xl border ${style.border} ${style.bg} p-5`}
    >

      <div className="flex items-center gap-3">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${style.icon}`}
        >
          {icon}
        </div>

        <p className={`font-semibold ${style.title}`}>
          {title}
        </p>

      </div>

      <ul className="mt-4 space-y-3">

        {items.map((item, index) => (

          <li
            key={index}
            className="flex gap-3 text-sm leading-6 text-slate-300"
          >

            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />

            <span>{item}</span>

          </li>

        ))}

      </ul>

    </div>
  );
}
