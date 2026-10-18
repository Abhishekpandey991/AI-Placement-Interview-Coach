
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Hero Section */}
        <section className="max-w-3xl">
          <p className="mb-3 text-xs sm:text-sm font-semibold tracking-wide text-blue-500 sm:text-base">
            AI-POWERED PLACEMENT PREPARATION
          </p>

          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Prepare for your
            <span className="text-blue-500">
              {" "}dream interview.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
            Practice personalized technical and behavioral interviews,
            discover your weaknesses, and build a preparation plan
            designed around your skills.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Start Preparing
            </Link>

            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-700 px-6 py-3 text-center font-semibold transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Login
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section
          aria-label="Platform features"
          className="mt-16 grid grid-cols-1 gap-5 sm:mt-20 sm:grid-cols-2 sm:gap-6 lg:mt-24 lg:grid-cols-3"
        >
          {/* Feature 1 */}
          <article className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500/50 sm:p-6">
            <div className="text-3xl" aria-hidden="true">
              🤖
            </div>

            <h2 className="mt-4 text-lg font-semibold sm:text-xl">
              AI Interviews
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
              Practice realistic technical and behavioral interviews
              with an AI interviewer.
            </p>
          </article>

          {/* Feature 2 */}
          <article className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500/50 sm:p-6">
            <div className="text-3xl" aria-hidden="true">
              📊
            </div>

            <h2 className="mt-4 text-lg font-semibold sm:text-xl">
              Skill Analysis
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
              Understand your strengths and identify the areas
              where you need improvement.
            </p>
          </article>

          {/* Feature 3 */}
          <article className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500/50 sm:p-6">
            <div className="text-3xl" aria-hidden="true">
              🎯
            </div>

            <h2 className="mt-4 text-lg font-semibold sm:text-xl">
              Personalized Preparation
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
              Get a preparation plan based on your interview
              performance and weaknesses.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
