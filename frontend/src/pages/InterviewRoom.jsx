import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  evaluateAnswer,
  generateFollowUp,
} from "../services/api";
import InterviewMediaControls from "../components/InterviewMediaControls";
import TutorAvatar from "./TutorAvatar";

export default function InterviewRoom() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    questions = [],
    interviewId,
    role,
    interviewType,
    difficulty,
  } = location.state || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [followUp, setFollowUp] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const currentQuestion = questions[currentIndex];
  const displayedQuestion = showFollowUp
    ? followUp
    : currentQuestion;

  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  function finishInterview() {
    navigate("/results", {
      state: { interviewId },
    });
  }

  function moveToNextOriginalQuestion() {
    setFollowUp(null);
    setShowFollowUp(false);
    setAnswer("");
    setError("");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
    } else {
      finishInterview();
    }
  }

  async function handleSubmit() {
    if (!answer.trim()) {
      setError("Please enter or speak your answer.");
      return;
    }

    if (!displayedQuestion?.id) {
      setError(
        "Question ID is missing. Please restart the interview."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const submittedAnswer = answer.trim();

      await evaluateAnswer({
        question_id: displayedQuestion.id,
        answer: submittedAnswer,
        role,
        interviewType,
        difficulty,
      });

      if (showFollowUp) {
        moveToNextOriginalQuestion();
        return;
      }

      const result = await generateFollowUp({
        interview_id: interviewId,
        question_id: currentQuestion.id,
        candidate_answer: submittedAnswer,
      });

      if (
        result?.question_id &&
        result?.follow_up_question
      ) {
        setFollowUp({
          id: result.question_id,
          question: result.follow_up_question,
        });

        setShowFollowUp(true);
        setAnswer("");
        setError("");
      } else {
        moveToNextOriginalQuestion();
      }
    } catch (err) {
      console.error("Interview submission error:", err);
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    if (loading) return;

    setError("");
    setAnswer("");
    moveToNextOriginalQuestion();
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <div className="text-4xl">⚠️</div>

          <h1 className="mt-4 text-2xl font-bold">
            No interview questions found
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your interview session could not be loaded.
            Please start the interview again.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm sm:text-base font-bold">
              AI
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm sm:text-base font-bold">
                Interview Studio
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {interviewType || "Placement"} interview
              </p>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-200">
              {role || "Candidate"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {difficulty || "Practice"} difficulty
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            disabled={loading}
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Exit
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-7 lg:px-8">
        {/* Interview progress */}
        <section className="mb-4 sm:mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-3.5 sm:p-5">
          <div className="mb-2.5 sm:mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm font-semibold">
                Interview progress
              </p>

              <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">
                Question {currentIndex + 1} of {questions.length}
                {showFollowUp ? " · Follow-up question" : ""}
              </p>
            </div>

            <span className="text-xs sm:text-sm font-bold text-blue-400">
              {Math.round(progress)}%
            </span>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Main layout */}
        <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* LEFT SIDEBAR */}
          <aside className="order-2 lg:order-1 space-y-4 sm:space-y-5 lg:sticky lg:top-24">
            {/* AI tutor */}
            <TutorAvatar
              question={displayedQuestion?.question || ""}
            />

            {/* Candidate camera and microphone */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    Your interview setup
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Camera and microphone
                  </p>
                </div>

                <span className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Media
                </span>
              </div>

              <div className="p-3 sm:p-4">
                <InterviewMediaControls
                  question=""
                  disabled={loading}
                  onTranscript={(text) => {
                    setAnswer((previous) =>
                      previous
                        ? `${previous} ${text}`
                        : text
                    );
                    setError("");
                  }}
                />
              </div>
            </section>

            {/* Session details */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-sm font-semibold">
                Session details
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Interview type
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {interviewType || "Placement"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Target role
                  </p>
                  <p className="mt-1 wrap-break-word text-sm font-medium">
                    {role || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Difficulty
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {difficulty || "Not specified"}
                  </p>
                </div>
              </div>
            </section>

            {/* Interview tip */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm font-semibold text-blue-300">
                Interview tip
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Speak clearly, explain your reasoning, and use
                specific examples from your projects when possible.
              </p>
            </div>
          </aside>

          {/* RIGHT PANEL */}
          <section className="order-1 lg:order-2 min-w-0 space-y-4 sm:space-y-5">
            {/* Question card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-7">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-base sm:text-lg font-bold text-blue-400">
                  {showFollowUp ? "↳" : currentIndex + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-blue-400">
                    {showFollowUp
                      ? "AI follow-up question"
                      : "Interview question"}
                  </p>

                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400">
                    {showFollowUp
                      ? "Let's explore your answer in more detail."
                      : "Take a moment to think, then explain your answer clearly."}
                  </p>
                </div>

                <span className="hidden shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 sm:block">
                  {showFollowUp
                    ? "Follow-up"
                    : `Q${currentIndex + 1}`}
                </span>
              </div>

              <h2 className="mt-4 sm:mt-7 text-lg sm:text-2xl font-semibold leading-relaxed text-white">
                {displayedQuestion?.question}
              </h2>

              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3 border-t border-slate-800 pt-3.5 sm:pt-5">
                <span className="text-[11px] sm:text-xs text-slate-500">
                  Audio interviewer
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400">
                  Use the AI tutor to replay the question.
                </span>
              </div>
            </div>

            {/* Answer editor */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    Your answer
                  </h2>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-400">
                    Type your response or dictate it using the microphone.
                  </p>
                </div>

                <span className="rounded-lg bg-slate-800 px-2.5 py-1 sm:px-3 sm:py-2 text-xs text-slate-400">
                  {answer.length} characters
                </span>
              </div>

              <label htmlFor="answer" className="sr-only">
                Your interview answer
              </label>

              <textarea
                id="answer"
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                rows={7}
                placeholder="Write your answer here, or use the microphone to dictate it. Review the transcript before submitting..."
                className="mt-4 sm:mt-5 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3.5 sm:p-5 text-sm leading-6 sm:leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {error && (
                <div
                  role="alert"
                  className="mt-3.5 sm:mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 sm:p-4 text-xs sm:text-sm text-red-300"
                >
                  <span className="mr-2">⚠️</span>
                  {error}
                </div>
              )}

              {/* Submit actions */}
              <div className="mt-5 sm:mt-6 flex flex-col gap-3.5 sm:gap-4 border-t border-slate-800 pt-4 sm:pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] sm:text-xs leading-5 text-slate-500">
                  {showFollowUp
                    ? "Submit your follow-up answer to continue."
                    : "Your answer will be evaluated. A follow-up may be generated."}
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={loading}
                    className="w-full sm:w-auto rounded-xl border border-slate-700 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 text-center"
                  >
                    {showFollowUp
                      ? "Skip follow-up"
                      : currentIndex === questions.length - 1
                        ? "Skip & finish"
                        : "Skip question"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !answer.trim()}
                    className="w-full sm:w-auto rounded-xl bg-blue-600 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 text-center"
                  >
                    {loading
                      ? "Evaluating answer..."
                      : showFollowUp
                        ? "Submit follow-up →"
                        : "Submit answer →"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
