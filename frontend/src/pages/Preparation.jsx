import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";

import {
  getImprovementPlan,
  saveImprovementProgress,
  getCompletedInterviewHistory,
} from "../services/api";

export default function Preparation() {
  const location = useLocation();

  const initialInterviewId = String(
    location.state?.interviewId ||
      localStorage.getItem("current_interview_id") ||
      ""
  ).trim();

  const [selectedInterviewId, setSelectedInterviewId] =
    useState(initialInterviewId);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [data, setData] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingTasks, setSavingTasks] = useState(false);

  // Load completed interview history.
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setHistoryLoading(true);
        setHistoryError("");

        const interviews = await getCompletedInterviewHistory();

        if (cancelled) return;

        const list = Array.isArray(interviews)
          ? interviews
          : interviews.interviews || [];

        setHistory(list);

        const selectedExists = list.some(
          (item) =>
            String(item.interview_id) === selectedInterviewId
        );

        if (selectedExists) {
          localStorage.setItem(
            "current_interview_id",
            selectedInterviewId
          );
        } else if (list.length > 0) {
          const firstId = String(list[0].interview_id);

          setSelectedInterviewId(firstId);
          localStorage.setItem("current_interview_id", firstId);
        } else {
          setSelectedInterviewId("");
          localStorage.removeItem("current_interview_id");
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(
            err.message || "Unable to load interview history."
          );
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load the improvement plan for the selected interview.
  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setData(null);
      setCompletedTasks({});
      setError("");

      if (!selectedInterviewId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await getImprovementPlan(
          selectedInterviewId
        );

        if (cancelled) return;

        setData(response);

        const restoredTasks = {};

        (response.completed_task_ids || []).forEach((taskId) => {
          restoredTasks[taskId] = true;
        });

        setCompletedTasks(restoredTasks);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load your improvement plan."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [selectedInterviewId]);

  function handleInterviewChange(event) {
    const id = event.target.value;

    setSelectedInterviewId(id);
    localStorage.setItem("current_interview_id", id);

    setData(null);
    setCompletedTasks({});
    setError("");
  }

  async function toggleTask(day, taskIndex) {
    if (!selectedInterviewId || savingTasks) return;

    const interviewIdForSave = selectedInterviewId;
    const key = `day-${day}-task-${taskIndex}`;
    const previousTasks = { ...completedTasks };

    const nextTasks = {
      ...previousTasks,
      [key]: !previousTasks[key],
    };

    setCompletedTasks(nextTasks);
    setError("");
    setSavingTasks(true);

    const completedTaskIds = Object.entries(nextTasks)
      .filter(([, checked]) => checked)
      .map(([taskId]) => taskId);

    try {
      await saveImprovementProgress(
        interviewIdForSave,
        completedTaskIds
      );
    } catch (err) {
      // Roll back only if the user is still viewing this interview.
      if (interviewIdForSave === selectedInterviewId) {
        setCompletedTasks(previousTasks);
        setError(
          `Unable to save task progress: ${
            err.message || "Please try again."
          }`
        );
      }
    } finally {
      setSavingTasks(false);
    }
  }

  const plan = data?.plan;
  const weeklyPlan = plan?.weekly_plan || [];

  const totalTasks = weeklyPlan.reduce(
    (total, day) => total + (day.tasks?.length || 0),
    0
  );

  const completedCount = weeklyPlan.reduce(
    (total, day, dayIndex) => {
      const dayNumber = day.day ?? dayIndex + 1;

      return (
        total +
        (day.tasks || []).filter((_, taskIndex) =>
          Boolean(
            completedTasks[
              `day-${dayNumber}-task-${taskIndex}`
            ]
          )
        ).length
      );
    },
    0
  );

  const progress =
    totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        <Sidebar />

        <main className="min-w-0 flex-1 px-3.5 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 sm:mb-8">
              <p className="text-xs sm:text-sm font-semibold text-blue-500">
                PERSONALIZED PREPARATION
              </p>

              <h1 className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                Your Improvement Plan
              </h1>

              <p className="mt-1.5 sm:mt-2 text-sm text-slate-400">
                A seven-day roadmap generated from your interview
                evaluation.
              </p>
            </div>

            {/* Interview history selector */}
            <Card className="mb-6">
              <label
                htmlFor="interview-history"
                className="mb-2 block font-semibold"
              >
                Choose an Interview
              </label>

              {historyLoading ? (
                <p className="text-sm text-slate-400">
                  Loading interview history...
                </p>
              ) : history.length > 0 ? (
                <select
                  id="interview-history"
                  value={selectedInterviewId}
                  onChange={handleInterviewChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  {history.map((item) => (
                    <option
                      key={item.interview_id}
                      value={item.interview_id}
                    >
                      {item.role} · {item.interview_type} ·{" "}
                      {item.difficulty} ·{" "}
                      {item.answered_questions}/
                      {item.total_questions} answered
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-400">
                  No completed interviews are available yet.
                  Complete an interview to see it here.
                </p>
              )}

              {historyError && (
                <p className="mt-2 text-sm text-red-400">
                  {historyError}
                </p>
              )}
            </Card>

            {loading && (
              <Card>
                <p className="animate-pulse text-slate-300">
                  Generating your improvement plan...
                </p>
              </Card>
            )}

            {!loading && error && !plan && (
              <Card>
                <h2 className="text-lg font-bold text-red-400">
                  Unable to load plan
                </h2>

                <p className="mt-2 text-slate-300">{error}</p>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setSelectedInterviewId((current) => {
                        // Changing the selection triggers a reload.
                        // For the same ID, reload the page data directly.
                        if (!current) return current;
                        return current;
                      });
                      window.location.reload();
                    }}
                    className="w-full sm:w-auto rounded-lg bg-blue-600 px-5 py-2.5 font-semibold hover:bg-blue-700 text-center"
                  >
                    Try Again
                  </button>

                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto rounded-lg border border-slate-700 px-5 py-2.5 hover:bg-slate-800 text-center"
                  >
                    Dashboard
                  </Link>
                </div>
              </Card>
            )}

            {!loading && !error && !plan && !historyLoading && (
              <Card>
                <h2 className="text-lg font-bold">
                  No improvement plan selected
                </h2>
                <p className="mt-2 text-slate-400">
                  Select an interview above to view its preparation
                  plan.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-5 inline-block rounded-lg border border-slate-700 px-5 py-2.5 hover:bg-slate-800"
                >
                  Back to Dashboard
                </Link>
              </Card>
            )}

            {!loading && !error && plan && (
              <>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                    {data.role || "Interview"}
                  </span>

                  <span className="text-sm text-slate-500">
                    Interview ID: {data.interview_id}
                  </span>
                </div>

                <div
                  className={`mb-6 rounded-xl border p-4 ${
                    data.plan_type === "general"
                      ? "border-blue-500/30 bg-blue-500/10"
                      : data.plan_type === "preliminary"
                        ? "border-yellow-500/30 bg-yellow-500/10"
                        : "border-emerald-500/30 bg-emerald-500/10"
                  }`}
                >
                  <h2 className="font-semibold">
                    {data.plan_type === "general"
                      ? "General Preparation Plan"
                      : data.plan_type === "preliminary"
                        ? "Preliminary Improvement Plan"
                        : "Personalized Improvement Plan"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {data.assessment_note}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Evaluated answers: {data.evaluated_answers}
                  </p>
                </div>

                <Card className="mb-6">
                  <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl sm:text-2xl">
                      💡
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl font-bold">
                        AI Performance Summary
                      </h2>
                      <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed sm:leading-7 text-slate-300">
                        {plan.summary}
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="mb-8 grid gap-5 md:grid-cols-2">
                  <Card>
                    <h2 className="text-lg font-bold text-emerald-400">
                      Your Strengths
                    </h2>

                    {plan.strengths?.length ? (
                      <ul className="mt-4 space-y-3">
                        {plan.strengths.map((strength, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-slate-300"
                          >
                            <span className="text-emerald-400">
                              ✓
                            </span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        No clear strengths were identified in this
                        evaluation. Use the daily tasks below to build
                        and demonstrate your skills.
                      </p>
                    )}
                  </Card>

                  <Card>
                    <h2 className="text-lg font-bold text-orange-400">
                      Areas to Improve
                    </h2>

                    <div className="mt-4 space-y-4">
                      {plan.weak_areas?.length ? (
                        plan.weak_areas.map((area, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-slate-800 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="font-semibold">
                                {area.skill}
                              </h3>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  area.priority === "High"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-yellow-500/10 text-yellow-400"
                                }`}
                              >
                                {area.priority} Priority
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {area.reason}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">
                          No specific weak areas were returned.
                        </p>
                      )}
                    </div>
                  </Card>
                </div>

                <Card className="mb-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        Your Weekly Progress
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {completedCount} of {totalTasks} tasks
                        completed
                      </p>
                    </div>

                    <span className="text-2xl font-bold text-blue-400">
                      {progress}%
                    </span>
                  </div>

                  <div className="mt-5">
                    <ProgressBar value={progress} />
                  </div>

                  {savingTasks && (
                    <p className="mt-3 text-xs text-slate-400">
                      Saving progress...
                    </p>
                  )}
                </Card>

                <section className="mb-8">
                  <h2 className="mb-5 text-2xl font-bold">
                    Your 7-Day Roadmap
                  </h2>

                  {weeklyPlan.length ? (
                    <div className="space-y-5">
                      {weeklyPlan.map((day, dayIndex) => {
                        const dayNumber = day.day ?? dayIndex + 1;

                        return (
                          <Card key={dayNumber}>
                            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 font-bold text-blue-300 text-sm sm:text-base">
                                {dayNumber}
                              </div>

                              <div className="min-w-0 flex-1 w-full">
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                                  Day {dayNumber}
                                </p>

                                <h3 className="mt-1 text-base sm:text-lg font-bold">
                                  {day.topic}
                                </h3>

                                <div className="mt-5">
                                  <h4 className="mb-3 text-sm font-semibold text-slate-300">
                                    Tasks
                                  </h4>

                                  <div className="space-y-3">
                                    {(day.tasks || []).map(
                                      (task, taskIndex) => {
                                        const key =
                                          `day-${dayNumber}-task-${taskIndex}`;

                                        const checked = Boolean(
                                          completedTasks[key]
                                        );

                                        return (
                                          <label
                                            key={key}
                                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 p-3 transition hover:bg-slate-800/50"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              disabled={savingTasks}
                                              onChange={() =>
                                                toggleTask(
                                                  dayNumber,
                                                  taskIndex
                                                )
                                              }
                                              className="mt-1 h-4 w-4 accent-blue-500"
                                            />

                                            <span
                                              className={`text-sm leading-6 ${
                                                checked
                                                  ? "text-slate-500 line-through"
                                                  : "text-slate-300"
                                              }`}
                                            >
                                              {task}
                                            </span>
                                          </label>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>

                                <div className="mt-5 rounded-lg border border-emerald-900/50 bg-emerald-500/5 p-4">
                                  <p className="text-sm font-semibold text-emerald-400">
                                    Goal
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-slate-300">
                                    {day.goal}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <p className="text-slate-400">
                        No daily tasks were included in this plan.
                      </p>
                    </Card>
                  )}
                </section>

                <Card className="mb-8">
                  <h2 className="text-xl font-bold">
                    Tips for Your Next Interview
                  </h2>

                  <ul className="mt-4 space-y-3">
                    {(plan.next_interview_tips || []).map(
                      (tip, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <span className="font-bold text-blue-400">
                            {index + 1}.
                          </span>
                          <span className="leading-6">{tip}</span>
                        </li>
                      )
                    )}
                  </ul>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/interview/setup"
                    className="w-full sm:w-auto text-center rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
                  >
                    Practice Another Interview
                  </Link>

                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto text-center rounded-lg border border-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-800"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </>
            )}

            {!loading && error && plan && (
              <p className="mt-4 text-sm text-red-400">{error}</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
