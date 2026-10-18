import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { analyzeResume } from "../services/api";

function getUserIdFromToken() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || null;
  } catch (error) {
    console.error("Failed to decode access token:", error);
    return null;
  }
}

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    try {
      const userId = getUserIdFromToken();

      if (!userId) {
        setAnalysis(null);
        return;
      }

      const analysisKey = `resume_analysis_${userId}`;
      const savedAnalysis = localStorage.getItem(analysisKey);

      if (savedAnalysis) {
        setAnalysis(JSON.parse(savedAnalysis));
      } else {
        setAnalysis(null);
      }
    } catch (error) {
      console.error("Failed to restore resume analysis:", error);
      setAnalysis(null);
    } finally {
      setRestoring(false);
    }
  }, []);

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];

    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or DOCX file.");
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  async function handleAnalyze() {
    if (!file) {
      setError("Please select your resume first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await analyzeResume(file);

      if (!data || typeof data !== "object") {
        throw new Error("Invalid analysis received from backend.");
      }

      if (
        data.resume_score === undefined ||
        data.resume_score === null
      ) {
        throw new Error(
          "Resume score was not received from backend."
        );
      }

      const userId = getUserIdFromToken();

      if (!userId) {
        throw new Error(
          "User authentication not found. Please login again."
        );
      }

      setAnalysis(data);

      const analysisKey = `resume_analysis_${userId}`;
      const filenameKey = `resume_filename_${userId}`;

      localStorage.setItem(
        analysisKey,
        JSON.stringify(data)
      );

      localStorage.setItem(
        filenameKey,
        file.name
      );
    } catch (error) {
      console.error("Resume analysis error:", error);

      setError(
        error.message || "Failed to analyze resume."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setAnalysis(null);
    setError("");

    const userId = getUserIdFromToken();

    if (userId) {
      localStorage.removeItem(
        `resume_analysis_${userId}`
      );

      localStorage.removeItem(
        `resume_filename_${userId}`
      );
    }

    const input =
      document.getElementById("resume-upload");

    if (input) {
      input.value = "";
    }
  }

  if (restoring) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>

          <p className="mt-4 text-sm text-slate-400">
            Loading resume analysis...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)] bg-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 mx-auto max-w-7xl px-3.5 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="text-xs sm:text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              ← Back to Dashboard
            </Link>

            <p className="mt-4 sm:mt-6 text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-500">
              Resume Analysis
            </p>

            <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Resume Analyzer
            </h1>

            <p className="mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base text-slate-400">
              Get AI-powered feedback on your resume and discover
              the skills you should improve before placements.
            </p>
          </div>

          {analysis && (
            <button
              onClick={handleReset}
              className="w-full sm:w-auto rounded-lg border border-slate-700 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white text-center"
            >
              Analyze Another Resume
            </button>
          )}
        </div>

        <div className="mt-4 sm:mt-6">
          <Link
            to="/resume-history"
            className="text-xs sm:text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            View Resume History →
          </Link>
        </div>

        {error && (
          <div className="mt-6 sm:mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 sm:p-4 text-xs sm:text-sm text-red-400">
            {error}
          </div>
        )}

        {!analysis && (
          <div className="mt-6 sm:mt-10">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-8 shadow-xl">
              <div className="mx-auto max-w-3xl">
                <label
                  htmlFor="resume-upload"
                  className="group flex min-h-[240px] sm:min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-4 sm:px-6 text-center transition hover:border-blue-500/60 hover:bg-slate-950"
                >
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl sm:text-4xl">
                    📄
                  </div>

                  <h2 className="mt-4 sm:mt-6 text-xl sm:text-2xl font-semibold">
                    Upload your resume
                  </h2>

                  <p className="mt-2 max-w-md text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400">
                    Upload your resume and let AI analyze your
                    skills, strengths, weaknesses, and areas for
                    improvement.
                  </p>

                  <span className="mt-4 sm:mt-6 rounded-lg bg-blue-600 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold transition group-hover:bg-blue-700">
                    Choose Resume
                  </span>

                  <p className="mt-4 text-xs text-slate-500">
                    PDF or DOCX • Maximum 5MB
                  </p>

                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {file && (
                  <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xl">
                        📄
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="ml-4 text-sm text-slate-500 transition hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={!file || loading}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Analyzing Resume..."
                    : "Analyze Resume"}
                </button>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="mt-8 sm:mt-10 space-y-5 sm:space-y-6">
            <div className="grid gap-5 sm:gap-6 lg:grid-cols-[280px_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm font-medium text-slate-400">
                  Resume Score
                </p>

                <div className="mt-4 sm:mt-5 flex items-end gap-2">
                  <span className="text-4xl sm:text-6xl font-bold text-blue-500">
                    {analysis.resume_score}
                  </span>

                  <span className="mb-1 sm:mb-2 text-xs sm:text-sm text-slate-500">
                    / 100
                  </span>
                </div>

                <div className="mt-4 sm:mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(analysis.resume_score) || 0,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500">
                  Overall resume strength
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm font-medium text-blue-400">
                  AI Summary
                </p>

                <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold">
                  Resume Overview
                </h2>

                <p className="mt-3 sm:mt-5 text-sm sm:text-base leading-6 sm:leading-7 text-slate-400">
                  {analysis.summary}
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
                {analysis.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-blue-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold">
                    ✓
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">
                      What's working
                    </p>

                    <h2 className="text-lg sm:text-xl font-bold">
                      Strengths
                    </h2>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  {analysis.strengths?.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 sm:p-4 text-xs sm:text-sm text-slate-300"
                    >
                      <span className="mr-2 text-emerald-400">
                        ✓
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold">
                    !
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">
                      What needs attention
                    </p>

                    <h2 className="text-lg sm:text-xl font-bold">
                      Weaknesses
                    </h2>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  {analysis.weaknesses?.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 sm:p-4 text-xs sm:text-sm text-slate-300"
                    >
                      <span className="mr-2 text-amber-400">
                        !
                      </span>
                      {item}
                    </div>
                  ))}
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

              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
                Skills that could strengthen your profile.
              </p>

              <div className="mt-4 sm:mt-6 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {analysis.missing_skills?.map((skill, index) => (
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
                ))}
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
                {analysis.suggestions?.map((item, index) => (
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
                ))}
              </div>
            </div>

            {analysis.project_feedback?.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm font-medium text-blue-400">
                  Project Review
                </p>

                <h2 className="mt-1 text-xl sm:text-2xl font-bold">
                  Project Feedback
                </h2>

                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  {analysis.project_feedback.map(
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

            {analysis.interview_topics?.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-7">
                <p className="text-xs sm:text-sm font-medium text-blue-400">
                  Interview Preparation
                </p>

                <h2 className="mt-1 text-xl sm:text-2xl font-bold">
                  Topics You May Be Asked About
                </h2>

                <div className="mt-4 sm:mt-6 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {analysis.interview_topics.map(
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