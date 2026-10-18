import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";

import { getDashboardData } from "../services/api";

function formatScore(score) {
  return `${(Number(score || 0) * 10).toFixed(0)}%`;
}

function MetricCard({ title, value, subtitle }) {
  return (
    <Card>
      <p className="text-xs sm:text-sm text-slate-400">{title}</p>
      <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold truncate">{value}</p>
      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">{subtitle}</p>
    </Card>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const result = await getDashboardData();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load performance analytics.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const interviews = data?.recent_interviews || [];

  const skills = data
    ? [
        {
          name: "Technical Knowledge",
          score: Number(data.technical_accuracy || 0) * 10,
        },
        {
          name: "Problem Solving",
          score: Number(data.problem_solving || 0) * 10,
        },
        {
          name: "Communication",
          score: Number(data.communication || 0) * 10,
        },
      ]
    : [];

  const averageScore = Number(data?.average_score || 0);
  const bestScore = Number(data?.best_score || 0);

  const weakestSkill =
    skills.length > 0
      ? [...skills].sort((a, b) => a.score - b.score)[0]
      : null;

  const scoreTrend = [...interviews].reverse();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        <Sidebar />

        <main className="min-w-0 flex-1 px-3.5 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 sm:mb-10">
              <p className="text-xs sm:text-sm font-semibold text-blue-500">
                ANALYTICS
              </p>

              <h1 className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                Performance Overview
              </h1>

              <p className="mt-1.5 sm:mt-2 text-sm text-slate-400">
                Track your interview performance and identify areas to improve.
              </p>
            </div>

            {loading && (
              <Card>
                <p className="animate-pulse text-slate-300">
                  Loading your performance analytics...
                </p>
              </Card>
            )}

            {!loading && error && (
              <Card>
                <h2 className="text-lg font-bold text-red-400">
                  Unable to load analytics
                </h2>

                <p className="mt-2 text-slate-300">{error}</p>

                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold hover:bg-blue-700"
                >
                  Try Again
                </button>
              </Card>
            )}

            {!loading && !error && data && (
              <>
                <div className="grid gap-3.5 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Interviews Created"
                    value={data.total_interviews ?? 0}
                    subtitle="Total interviews in your account"
                  />

                  <MetricCard
                    title="Average Score"
                    value={formatScore(averageScore)}
                    subtitle="Across evaluated answers"
                  />

                  <MetricCard
                    title="Best Interview Score"
                    value={formatScore(bestScore)}
                    subtitle="Highest interview average"
                  />

                  <MetricCard
                    title="Interviews With Scores"
                    value={
                      interviews.filter(
                        (item) => Number(item.score) > 0,
                      ).length
                    }
                    subtitle="Scored interviews in recent history"
                  />
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <Card>
                    <h2 className="text-xl font-bold">
                      Skill Analysis
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Average scores from your saved answer evaluations.
                    </p>

                    <div className="mt-6 space-y-6">
                      {skills.map((skill) => (
                        <div key={skill.name}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm font-medium">
                              {skill.name}
                            </span>

                            <span className="text-sm text-slate-400">
                              {skill.score.toFixed(0)}%
                            </span>
                          </div>

                          <ProgressBar
                            value={Math.max(
                              0,
                              Math.min(100, skill.score),
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <h2 className="text-xl font-bold">
                      AI Insights
                    </h2>

                    {weakestSkill && interviews.length > 0 ? (
                      <div className="mt-6 rounded-xl border border-blue-900/50 bg-blue-950/20 p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xl">
                            💡
                          </div>

                          <div>
                            <h3 className="font-semibold text-blue-400">
                              Focus Area: {weakestSkill.name}
                            </h3>

                            <p className="mt-2 text-sm leading-relaxed text-slate-400">
                              Your current average for this skill is{" "}
                              {weakestSkill.score.toFixed(0)}%.
                              Practice targeted questions, review your
                              feedback, and track the result in your next
                              interview.
                            </p>

                            <Link
                              to="/interview/setup"
                              className="mt-4 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300"
                            >
                              Practice another interview →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-xl border border-slate-800 p-5">
                        <h3 className="font-semibold text-slate-200">
                          Build your performance profile
                        </h3>

                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                          Complete and evaluate interview answers to
                          generate meaningful skill insights.
                        </p>

                        <Link
                          to="/interview/setup"
                          className="mt-4 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300"
                        >
                          Start an interview →
                        </Link>
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-5">
                      <h3 className="font-semibold text-emerald-400">
                        Keep improving
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        Review your interview feedback and follow your
                        seven-day improvement plan. Compare future
                        scores to see how your preparation is progressing.
                      </p>

                      <Link
                        to="/preparation"
                        className="mt-3 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        View preparation plan →
                      </Link>
                    </div>
                  </Card>
                </div>

                <Card className="mt-8">
                  <h2 className="text-xl font-bold">
                    Interview Score Trend
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Average score per interview. Each bar represents
                    one interview in the available history.
                  </p>

                  {scoreTrend.length > 0 ? (
                    <div className="mt-6 space-y-5">
                      {scoreTrend.map((interview, index) => {
                        const score = Math.max(
                          0,
                          Math.min(
                            100,
                            Number(interview.score || 0) * 10,
                          ),
                        );

                        return (
                          <div
                            key={interview.interview_id}
                            className="min-w-0"
                          >
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <span className="truncate text-sm text-slate-300">
                                {interview.role || "Interview"} ·{" "}
                                {index + 1}
                              </span>

                              <span className="shrink-0 text-sm font-semibold text-blue-400">
                                {score.toFixed(0)}%
                              </span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-slate-400">
                      Your score trend will appear after you complete
                      and evaluate interview answers.
                    </p>
                  )}
                </Card>

                <div className="mt-10">
                  <h2 className="mb-6 text-xl font-bold">
                    Interview History
                  </h2>

                  {interviews.length > 0 ? (
                    <div className="space-y-4">
                      {[...interviews].reverse().map((interview) => (
                        <Card
                          key={interview.interview_id}
                          className="p-4 sm:p-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg">
                                {interview.role}
                              </h3>

                              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                {interview.interview_type} ·{" "}
                                {interview.difficulty} ·{" "}
                                {interview.duration} minutes
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                              <div>
                                <p className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-500">
                                  Score
                                </p>

                                <p className="text-lg sm:text-xl font-bold">
                                  {formatScore(interview.score)}
                                </p>
                              </div>

                              <Link
                                to="/results"
                                state={{
                                  interviewId: interview.interview_id,
                                }}
                                className="rounded-lg bg-slate-800 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium transition hover:bg-slate-700 shrink-0"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <h3 className="font-semibold">
                        No interview history yet
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        Your interview scores and history will appear
                        here once you start practicing.
                      </p>

                      <Link
                        to="/interview/setup"
                        className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-semibold hover:bg-blue-700"
                      >
                        Start your first interview
                      </Link>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
