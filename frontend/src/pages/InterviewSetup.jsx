import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import { startInterview } from "../services/api";

export default function InterviewSetup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("Frontend Developer");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(30);

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResumeChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setResume(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF or DOCX file.");
      setResume(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume size must be less than 5MB.");
      setResume(null);
      return;
    }

    setError("");
    setResume(file);
  };

const handleStartInterview = async () => {
  setError("");

  if (interviewType === "Resume Based" && !resume) {
    setError("Please upload your resume for a resume-based interview.");
    return;
  }

  try {
    setLoading(true);
    const data = await startInterview({
      role,
      interviewType,
      difficulty,
      duration: Number(duration),
      resume,
    });

    if (!data?.interview_id) {
      throw new Error(
        "Interview started, but no interview ID was returned."
      );
    }

    localStorage.setItem(
      "current_interview_id",
      data.interview_id.trim()
    );
    navigate("/interview", {
      state: {
        role,
        interviewType,
        difficulty,
        duration,
        questions: data.questions,
        interviewId: data.interview_id.trim(),
      },
    });
  } catch (error) {
    console.error("Failed to start interview:", error);
    setError(error.message || "Failed to start interview.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        <Sidebar />

        <main className="min-w-0 flex-1 px-3.5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

          {/* Header */}
          <div className="mb-6 sm:mb-10">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-500">
              AI INTERVIEW
            </p>

            <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-bold">
              Set Up Your Interview
            </h1>

            <p className="mt-1.5 sm:mt-2 max-w-2xl text-sm sm:text-base text-slate-400">
              Customize your interview based on the role you are preparing
              for.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <Card>

              {/* Role */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Target Role
                </label>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>Full Stack Developer</option>
                  <option>Software Engineer</option>
                  <option>Data Scientist</option>
                  <option>Machine Learning Engineer</option>
                </select>
              </div>

              {/* Interview Type */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Interview Type
                </label>

                <div className="grid gap-3 sm:grid-cols-2">

                  {[
                    "Technical",
                    "Behavioral",
                    "System Design",
                    "HR",
                    "Resume Based",
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setInterviewType(type);
                        setError("");
                      }}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        interviewType === type
                          ? "border-blue-500 bg-blue-600/10 text-blue-400"
                          : "border-slate-700 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {type}
                    </button>
                  ))}

                </div>
              </div>

              {/* Resume Upload */}
              {interviewType === "Resume Based" && (
                <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Upload Your Resume
                  </label>

                  <p className="mb-4 text-sm text-slate-500">
                    The AI will analyze your resume and generate interview
                    questions based on your skills, projects and experience.
                  </p>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950 px-6 py-8 transition hover:border-blue-500">

                    <span className="text-3xl">
                      📄
                    </span>

                    <span className="mt-3 text-sm font-medium text-slate-300">
                      {resume
                        ? resume.name
                        : "Click to upload your resume"}
                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      PDF or DOCX • Maximum 5MB
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleResumeChange}
                      className="hidden"
                    />
                  </label>

                  {resume && (
                    <p className="mt-3 text-sm text-green-400">
                      ✓ Resume selected successfully
                    </p>
                  )}

                </div>
              )}

              {/* Difficulty */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Difficulty
                </label>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">

                  {["Easy", "Medium", "Hard"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`rounded-lg border px-2.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition text-center ${
                        difficulty === level
                          ? "border-blue-500 bg-blue-600/10 text-blue-400"
                          : "border-slate-700 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {level}
                    </button>
                  ))}

                </div>
              </div>

              {/* Duration */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Interview Duration
                </label>

                <select
                  value={duration}
                  onChange={(e) =>
                    setDuration(Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Summary */}
              <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-5">

                <p className="text-sm text-slate-500">
                  Interview Summary
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-slate-500">
                      Role
                    </p>

                    <p className="mt-1 font-medium">
                      {role}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Type
                    </p>

                    <p className="mt-1 font-medium">
                      {interviewType}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Difficulty
                    </p>

                    <p className="mt-1 font-medium">
                      {difficulty}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Duration
                    </p>

                    <p className="mt-1 font-medium">
                      {duration} minutes
                    </p>
                  </div>

                </div>

                {interviewType === "Resume Based" && (
                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-500">
                      Resume
                    </p>

                    <p className="mt-1 font-medium text-blue-400">
                      {resume
                        ? resume.name
                        : "No resume selected"}
                    </p>
                  </div>
                )}

              </div>

              {/* Start */}
              <button
                type="button"
                onClick={handleStartInterview}
                disabled={loading}
                className="mt-8 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Preparing Your Interview..."
                  : "Start AI Interview"}
              </button>

            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}