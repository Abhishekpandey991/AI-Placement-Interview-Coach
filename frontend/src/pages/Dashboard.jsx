import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import SkillCard from "../components/SkillCard";

import { getDashboardData, getDSAProgress } from "../services/api";
export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [dsaProgress, setDsaProgress] = useState([]);
  const [dsaLoading, setDsaLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // New state to control dashboard visibility
  const [showDashboard, setShowDashboard] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardData();

        console.log("Dashboard data:", data);
        console.log("Dashboard skill values:", {
          technical_accuracy: data.technical_accuracy,
          problem_solving: data.problem_solving,
          communication: data.communication,
          average_score: data.average_score,
        });

        setDashboard(data);
      } catch (error) {
        console.error("Dashboard error:", error);
        setError(error.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);


  useEffect(() => {
    async function loadDSAProgress() {
      try {
        const data = await getDSAProgress();
        setDsaProgress(data.topics || []);
      } catch (error) {
        console.error("Failed to load DSA progress:", error);
      } finally {
        setDsaLoading(false);
      }
    }

    loadDSAProgress();
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>

            <p className="mt-4 text-slate-400">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const dsaAttempted = dsaProgress.reduce(
    (total, topic) => total + Number(topic.problems_attempted || 0),
    0
  );

  const dsaSolved = dsaProgress.reduce(
    (total, topic) => total + Number(topic.problems_solved || 0),
    0
  );

  const dsaAccuracy = dsaAttempted
    ? Math.round((dsaSolved / dsaAttempted) * 100)
    : 0;
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-slate-900 p-8 text-center">
            <div className="text-4xl">⚠️</div>

            <h1 className="mt-4 text-xl font-bold">
              Failed to load dashboard
            </h1>

            <p className="mt-2 text-slate-400">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }



  const totalInterviews =
    dashboard?.total_interviews ?? 0;

  const averageScore =
    dashboard?.average_score ?? 0;


  const recentInterviews = (
    dashboard?.recent_interviews ??
    dashboard?.interview_history ??
    []
  )
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at || b.createdAt || b.date || 0) -
        new Date(a.created_at || a.createdAt || a.date || 0)
    )
    .slice(0, 5);


  const bestScore =
    dashboard?.best_score ??
    (recentInterviews.length > 0
      ? Math.max(
        ...recentInterviews.map(
          (interview) => interview.score ?? 0
        )
      )
      : 0);

  const technicalAccuracy =
    dashboard?.technical_accuracy ?? 0;

  const communication =
    dashboard?.communication ?? 0;

  const problemSolving =
    dashboard?.problem_solving ?? 0;

  const interviewPerformance = Math.min(
    100,
    Math.max(0, Math.round(Number(averageScore || 0) * 10))
  );
  const placementReadiness = interviewPerformance;
  return (
    <div className="min-h-screen bg-slate-950 text-white">


      <Navbar />

      {/* Conditionally render dashboard content */}
      {showDashboard ? (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">

          <Sidebar />

          <main className="min-w-0 flex-1 px-3.5 py-6 sm:px-6 sm:py-8 lg:px-10">

            <div className="mx-auto max-w-7xl">

              <div className="mb-6 sm:mb-8 flex flex-col justify-between gap-4 sm:gap-6 md:flex-row md:items-center">

                <div>

                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-blue-500">
                    Dashboard
                  </p>

                  <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                    Welcome back 👋
                  </h1>

                  <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-400">
                    Here's your interview preparation overview.
                  </p>

                </div>

                <Link
                  to="/interview/setup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 text-center"
                >
                  <span className="text-lg">
                    +
                  </span>

                  Start Interview
                </Link>

              </div>


              {/* =========================
                STATISTICS
            ========================= */}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {/* Total Interviews */}

                <Card>
                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm text-slate-400">
                        Total Interviews
                      </p>

                      <p className="mt-3 text-4xl font-bold">
                        {totalInterviews}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Completed sessions
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                      🎤
                    </div>

                  </div>
                </Card>


                {/* Average Score */}

                <Card>
                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm text-slate-400">
                        Average Score
                      </p>

                      <p className="mt-3 text-4xl font-bold text-blue-500">
                        {Number(averageScore).toFixed(1)}

                        <span className="ml-1 text-xl text-slate-500">
                          /10
                        </span>
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Across all interviews
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                      📊
                    </div>

                  </div>
                </Card>


                {/* Best Score */}

                <Card>
                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm text-slate-400">
                        Best Score
                      </p>

                      <p className="mt-3 text-4xl font-bold text-green-500">
                        {Number(bestScore).toFixed(1)}

                        <span className="ml-1 text-xl text-slate-500">
                          /10
                        </span>
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Your highest score
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-2xl">
                      🏆
                    </div>

                  </div>
                </Card>

              </div>


              {/* =========================
                PLACEMENT READINESS
            ========================= */}

              <Card className="mt-6 overflow-hidden">

                <div className="flex flex-col gap-6">

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-sm font-medium text-slate-400">
                        Placement Readiness
                      </p>

                      <div className="mt-2 flex items-baseline gap-3">

                        <p className="text-4xl font-bold">
                          {placementReadiness}%
                        </p>

                        <span className="text-sm text-slate-500">
                          overall readiness
                        </span>

                      </div>

                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                      🎯
                    </div>

                  </div>


                  {/* Progress */}

                  <div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-700"
                        style={{
                          width: `${placementReadiness}%`,
                        }}
                      />

                    </div>

                    <div className="mt-3 flex items-center justify-between">

                      <p className="text-sm text-slate-500">
                        Keep practicing to improve your performance.
                      </p>

                      <span className="text-sm font-semibold text-blue-400">
                        {placementReadiness}%
                      </span>

                    </div>

                  </div>

                </div>

              </Card>


              {/* =========================
                YOUR SKILLS
            ========================= */}

              <section className="mt-10">

                <div className="mb-5">

                  <h2 className="text-2xl font-bold">
                    Your Skills
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your current preparation across key areas.
                  </p>

                </div>


                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                  <SkillCard
                    name="Technical"
                    score={Math.round(
                      technicalAccuracy * 10
                    )}
                  />

                  <SkillCard
                    name="Communication"
                    score={Math.round(
                      communication * 10
                    )}
                  />

                  <SkillCard
                    name="Problem Solving"
                    score={Math.round(
                      problemSolving * 10
                    )}
                  />


                  <Card>
                    <p className="text-sm text-slate-400">
                      DSA Practice
                    </p>

                    {dsaLoading ? (
                      <p className="mt-3 text-sm text-slate-400">
                        Loading progress...
                      </p>
                    ) : (
                      <>
                        <p className="mt-3 text-xl font-bold">
                          {dsaSolved} / {dsaAttempted}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          Problems solved / attempted
                        </p>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${dsaAccuracy}%` }}
                          />
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          Solving accuracy: {dsaAccuracy}%
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {dsaProgress.length} topics tracked
                        </p>
                      </>
                    )}

                    <Link
                      to="/dsa"
                      className="mt-4 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Manage DSA progress →
                    </Link>
                  </Card>

                </div>

              </section>


              {/* =========================
                RECENT INTERVIEWS
            ========================= */}

              <section className="mt-10">

                <div className="mb-5 flex items-end justify-between">

                  <div>

                    <h2 className="text-2xl font-bold">
                      Recent Interviews
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Review your latest interview practice sessions.
                    </p>

                  </div>

                  {recentInterviews.length > 0 && (
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                      {recentInterviews.length} sessions
                    </span>
                  )}

                </div>


                {recentInterviews.length === 0 ? (

                  /* EMPTY STATE */

                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                      🎤
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      No interviews yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                      Start your first AI interview and your results will appear here.
                    </p>

                    <Link
                      to="/interview/setup"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-700"
                    >
                      Start Your First Interview
                      <span>→</span>
                    </Link>

                  </div>

                ) : (

                  /* INTERVIEW LIST */

                  <div className="space-y-4">

                    {recentInterviews.map((interview, index) => {

                      const score =
                        Number(interview.score ?? 0);

                      return (
                        <div
                          key={
                            interview.interview_id ||
                            index
                          }
                          className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900"
                        >

                          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">

                            {/* LEFT */}

                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl sm:text-2xl">
                                💼
                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h3 className="truncate text-base sm:text-lg font-semibold">
                                    {interview.role}
                                  </h3>

                                  <span className="rounded-full bg-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium text-slate-400">
                                    {interview.interview_type}
                                  </span>

                                </div>

                                <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">

                                  <span>
                                    {interview.difficulty}
                                  </span>

                                  <span className="text-slate-700">
                                    •
                                  </span>

                                  <span>
                                    {interview.duration} min
                                  </span>

                                </div>

                              </div>

                            </div>


                            {/* RIGHT */}

                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-slate-800 pt-3.5 lg:border-t-0 lg:pt-0">

                              <div>

                                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500">
                                  Score
                                </p>

                                <p
                                  className={`mt-0.5 sm:mt-1 text-xl sm:text-2xl font-bold ${score >= 7
                                      ? "text-green-400"
                                      : score >= 4
                                        ? "text-yellow-400"
                                        : "text-blue-400"
                                    }`}
                                >
                                  {score.toFixed(1)}

                                  <span className="ml-1 text-xs sm:text-sm font-medium text-slate-500">
                                    /10
                                  </span>
                                </p>

                              </div>


                              <Link
                                to="/results"
                                state={{
                                  interviewId:
                                    interview.interview_id,
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-300 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400"
                              >
                                View Results

                                <span className="transition-transform group-hover:translate-x-0.5">
                                  →
                                </span>
                              </Link>

                            </div>

                          </div>

                        </div>
                      );
                    })}

                  </div>

                )}

              </section>


              {/* AREAS TO IMPROVE */}
              <section className="mt-10">
                <Card>
                  <h2 className="text-2xl font-bold">
                    Areas to Improve
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Based on your saved interview evaluations.
                  </p>

                  {[
                    {
                      name: "Technical Knowledge",
                      score: Number(technicalAccuracy || 0) * 10,
                    },
                    {
                      name: "Problem Solving",
                      score: Number(problemSolving || 0) * 10,
                    },
                    {
                      name: "Communication",
                      score: Number(communication || 0) * 10,
                    },
                  ]
                    .sort((a, b) => a.score - b.score)
                    .map((skill) => (
                      <div key={skill.name} className="mt-6">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-300">
                            {skill.name}
                          </span>

                          <span className="text-sm text-slate-400">
                            {skill.score.toFixed(0)}%
                          </span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${skill.score < 50
                                ? "bg-red-500"
                                : skill.score < 70
                                  ? "bg-yellow-500"
                                  : "bg-emerald-500"
                              }`}
                            style={{
                              width: `${Math.max(0, Math.min(100, skill.score))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                  {Number(dashboard?.total_interviews || 0) === 0 && (
                    <p className="mt-5 text-sm text-slate-400">
                      Complete an interview to start identifying areas to improve.
                    </p>
                  )}
                </Card>
              </section>



              {/* =========================
                FINAL CTA
            ========================= */}

              <section className="mt-8 sm:mt-10 mb-8">

                <div className="rounded-2xl border border-blue-900/40 bg-linear-to-r from-blue-950/40 to-slate-900 p-5 sm:p-8">

                  <div className="flex flex-col items-start justify-between gap-5 sm:gap-6 md:flex-row md:items-center">

                    <div>

                      <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-400">
                        Keep improving
                      </p>

                      <h2 className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold">
                        Ready for another interview?
                      </h2>

                      <p className="mt-1.5 sm:mt-2 max-w-xl text-sm sm:text-base text-slate-400">
                        Practice regularly and use AI feedback to improve your answers.
                      </p>

                    </div>

                    <Link
                      to="/interview/setup"
                      className="w-full sm:w-auto shrink-0 rounded-xl bg-blue-600 px-5 py-3 sm:px-6 sm:py-3 text-center text-sm sm:text-base font-semibold transition hover:bg-blue-700"
                    >
                      Practice Now →
                    </Link>

                  </div>

                </div>

              </section>

            </div>

          </main>

        </div>

      ) : null}

    </div>
  );
}