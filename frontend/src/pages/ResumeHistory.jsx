
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  getResumeHistory,
  getResumeAnalysisById,
} from "../services/api";

export default function ResumeHistory() {
  const [history, setHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getResumeHistory();
        setHistory(data.history || []);
      } catch (error) {
        console.error(error);
        setError(
          error.message || "Failed to load resume history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  async function handleViewAnalysis(id) {
    try {
      setAnalysisLoading(true);
      setAnalysisError("");
      setSelectedAnalysis(null);

      const data = await getResumeAnalysisById(id);

      setSelectedAnalysis(data);

      setTimeout(() => {
        document
          .getElementById("resume-analysis-details")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (error) {
      console.error(error);

      setAnalysisError(
        error.message || "Failed to load resume analysis."
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

  function closeAnalysis() {
    setSelectedAnalysis(null);
    setAnalysisError("");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)] bg-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 mx-auto max-w-6xl px-3.5 py-6 sm:px-6 sm:py-10">
        <Link
          to="/dashboard"
          className="text-xs sm:text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-500">
            Resume Analyzer
          </p>

          <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-bold">
            Resume History
          </h1>

          <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-slate-400">
            View your previous resume analyses and scores.
          </p>
        </div>

        {loading && (
          <div className="mt-8 sm:mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8 sm:p-10 text-center">
            <p className="text-sm text-slate-400">
              Loading resume history...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 sm:mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 sm:p-4 text-xs sm:text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="mt-8 sm:mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl sm:text-3xl">
              📄
            </div>

            <h2 className="mt-4 sm:mt-5 text-lg sm:text-xl font-bold">
              No resume analyses yet
            </h2>

            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400">
              Upload your resume to get your first AI analysis.
            </p>

            <Link
              to="/resume-analyzer"
              className="mt-5 sm:mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold transition hover:bg-blue-700"
            >
              Analyze Resume
            </Link>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="mt-6 sm:mt-10 grid gap-4 sm:gap-5">
            {history.map((resume) => (
              <div
                key={resume.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 transition hover:border-slate-700"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg sm:text-xl">
                      📄
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-white text-sm sm:text-base">
                        {resume.filename}
                      </h2>

                      <p className="mt-0.5 sm:mt-1 text-xs text-slate-500">
                        {resume.created_at
                          ? new Date(
                              resume.created_at
                            ).toLocaleString()
                          : "Date unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-slate-800/80 pt-3 sm:border-t-0 sm:pt-0">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        Resume Score
                      </p>

                      <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-bold text-blue-500">
                        {resume.resume_score}
                        <span className="text-xs sm:text-sm text-slate-500">
                          /100
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        handleViewAnalysis(resume.id)
                      }
                      className="rounded-lg border border-slate-700 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      View Analysis
                    </button>
                  </div>
                </div>

                <p className="mt-4 sm:mt-5 border-t border-slate-800 pt-3.5 sm:pt-5 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400">
                  {resume.summary}
                </p>
              </div>
            ))}
          </div>
        )}

        {analysisLoading && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>

            <p className="mt-4 text-sm text-slate-400">
              Loading analysis...
            </p>
          </div>
        )}

        {analysisError && (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {analysisError}
          </div>
        )}

        {selectedAnalysis && (
          <div
            id="resume-analysis-details"
            className="mt-8 sm:mt-10 space-y-5 sm:space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-500">
                  Saved Analysis
                </p>

                <h2 className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                  {selectedAnalysis.filename}
                </h2>

                {selectedAnalysis.created_at && (
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                    {new Date(
                      selectedAnalysis.created_at
                    ).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                onClick={closeAnalysis}
                className="self-start sm:self-auto rounded-lg border border-slate-700 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 sm:gap-6 lg:grid-cols-[280px_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm font-medium text-slate-400">
                  Resume Score
                </p>

                <div className="mt-4 sm:mt-5 flex items-end gap-2">
                  <span className="text-4xl sm:text-6xl font-bold text-blue-500">
                    {selectedAnalysis.resume_score}
                  </span>

                  <span className="mb-1 sm:mb-2 text-xs sm:text-sm text-slate-500">
                    / 100
                  </span>
                </div>

                <div className="mt-4 sm:mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selectedAnalysis.resume_score
                          ) || 0,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm font-medium text-blue-400">
                  AI Summary
                </p>

                <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold">
                  Resume Overview
                </h2>

                <p className="mt-3 sm:mt-5 text-sm sm:text-base leading-6 sm:leading-7 text-slate-400">
                  {selectedAnalysis.summary}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
              <p className="text-xs sm:text-sm font-medium text-blue-400">
                Technical Profile
              </p>

              <h2 className="mt-1 text-xl sm:text-2xl font-bold">
                Your Skills
              </h2>

              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
                {selectedAnalysis.skills?.map(
                  (skill, index) => (
                    <span
                      key={index}
                      className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-blue-400"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm text-slate-400">
                  What's working
                </p>

                <h2 className="mt-1 text-lg sm:text-xl font-bold">
                  Strengths
                </h2>

                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  {selectedAnalysis.strengths?.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-3 sm:p-4 text-xs sm:text-sm text-slate-300"
                      >
                        <span className="mr-2 text-emerald-400">
                          ✓
                        </span>
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm text-slate-400">
                  What needs attention
                </p>

                <h2 className="mt-1 text-lg sm:text-xl font-bold">
                  Weaknesses
                </h2>

                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  {selectedAnalysis.weaknesses?.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-3 sm:p-4 text-xs sm:text-sm text-slate-300"
                      >
                        <span className="mr-2 text-amber-400">
                          !
                        </span>
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
              <p className="text-xs sm:text-sm font-medium text-blue-400">
                Skill Gap
              </p>

              <h2 className="mt-1 text-xl sm:text-2xl font-bold">
                Recommended Skills
              </h2>

              <div className="mt-4 sm:mt-6 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {selectedAnalysis.missing_skills?.map(
                  (skill, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4"
                    >
                      <p className="text-sm sm:text-base font-medium text-white">
                        {skill}
                      </p>

                      <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">
                        Recommended for your profile
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
              <p className="text-xs sm:text-sm font-medium text-blue-400">
                AI Recommendations
              </p>

              <h2 className="mt-1 text-xl sm:text-2xl font-bold">
                How to Improve Your Resume
              </h2>

              <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                {selectedAnalysis.suggestions?.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 sm:gap-4 rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4"
                    >
                      <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs sm:text-sm font-semibold text-blue-400">
                        {index + 1}
                      </div>

                      <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-slate-300">
                        {item}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {selectedAnalysis.project_feedback?.length >
              0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm font-medium text-blue-400">
                  Project Review
                </p>

                <h2 className="mt-1 text-xl sm:text-2xl font-bold">
                  Project Feedback
                </h2>

                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  {selectedAnalysis.project_feedback.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-300"
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {selectedAnalysis.interview_topics?.length >
              0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm font-medium text-blue-400">
                  Interview Preparation
                </p>

                <h2 className="mt-1 text-xl sm:text-2xl font-bold">
                  Topics You May Be Asked About
                </h2>

                <div className="mt-4 sm:mt-6 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedAnalysis.interview_topics.map(
                    (topic, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-300"
                      >
                        {topic}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
