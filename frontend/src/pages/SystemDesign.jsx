import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";

import {
  systemDesignProblems,
  systemDesignConcepts,
} from "../data/systemDesignData";

import {
  getSystemDesignProgress,
  updateSystemDesignStatus,
} from "../services/api";

const difficultyStyle = {
  Easy: "bg-green-500/10 text-green-400",
  Medium: "bg-yellow-500/10 text-yellow-400",
  Hard: "bg-red-500/10 text-red-400",
};

// General system design practice page.
const DEFAULT_PRACTICE_URL = "https://playcloudlabs.com/practice";

function getPracticeUrl() {
  return DEFAULT_PRACTICE_URL;
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    const category = item.category || "Other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(item);
    return groups;
  }, {});
}

export default function SystemDesign() {
  const [problems, setProblems] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState([]);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("Problems");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedConcepts, setExpandedConcepts] = useState([]);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getSystemDesignProgress();

      const savedProblems = new Map(
        (data.problems || []).map((item) => [
          item.id || item.item_key || item.problem_key,
          Boolean(item.completed),
        ])
      );

      const savedConcepts = new Map(
        (data.concepts || []).map((item) => [
          item.id || item.item_key,
          Boolean(item.completed),
        ])
      );

      setProblems(
        systemDesignProblems.map((problem) => ({
          ...problem,
          completed: savedProblems.get(problem.id) ?? false,
        }))
      );

      setConcepts(
        systemDesignConcepts.map((concept) => ({
          ...concept,
          completed: savedConcepts.get(concept.id) ?? false,
        }))
      );
    } catch (err) {
      setProblems(
        systemDesignProblems.map((problem) => ({
          ...problem,
          completed: false,
        }))
      );

      setConcepts(
        systemDesignConcepts.map((concept) => ({
          ...concept,
          completed: false,
        }))
      );

      setError(
        err.message || "Unable to load saved System Design progress."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  async function toggleItem(itemType, item) {
    const key = `${itemType}:${item.id}`;

    if (savingKeys.includes(key)) return;

    const nextCompleted = !item.completed;

    const setItems =
      itemType === "problem" ? setProblems : setConcepts;

    setError("");
    setSavingKeys((current) => [...current, key]);

    // Update the UI immediately.
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, completed: nextCompleted }
          : entry
      )
    );

    try {
      await updateSystemDesignStatus(
        itemType,
        item.id,
        nextCompleted
      );
    } catch (err) {
      // Restore the previous state if saving fails.
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, completed: !nextCompleted }
            : entry
        )
      );

      setError(
        err.message || "Unable to save progress. Please try again."
      );
    } finally {
      setSavingKeys((current) =>
        current.filter((entry) => entry !== key)
      );
    }
  }

  function toggleConceptExpansion(id) {
    setExpandedConcepts((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  const completedProblems = problems.filter(
    (item) => item.completed
  ).length;

  const completedConcepts = concepts.filter(
    (item) => item.completed
  ).length;

  const totalProblems = problems.length;
  const totalConcepts = concepts.length;

  const progress = totalProblems
    ? Math.round((completedProblems / totalProblems) * 100)
    : 0;

  const filteredProblems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return problems.filter((problem) => {
      const matchesDifficulty =
        selectedDifficulty === "All" ||
        problem.difficulty === selectedDifficulty;

      const searchableText = [
        problem.title,
        problem.description,
        problem.pattern,
        problem.category,
        ...(problem.concepts || []),
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesDifficulty &&
        (!query || searchableText.includes(query))
      );
    });
  }, [problems, selectedDifficulty, search]);

  const filteredConcepts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return concepts.filter((concept) => {
      const searchableText = [
        concept.title,
        concept.description,
        concept.category,
      ]
        .join(" ")
        .toLowerCase();

      return !query || searchableText.includes(query);
    });
  }, [concepts, search]);

  const problemGroups = groupByCategory(filteredProblems);
  const conceptGroups = groupByCategory(filteredConcepts);

  const nextProblem = problems.find((item) => !item.completed);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        <Sidebar />

        <main className="min-w-0 flex-1 px-3.5 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <header className="mb-6 sm:mb-8">
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-blue-400">
                SYSTEM DESIGN
              </p>

              <h1 className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                System Design Practice
              </h1>

              <p className="mt-1.5 sm:mt-2 text-sm text-slate-400">
                Learn system design through reusable patterns,
                real-world problems, and core architectural concepts.
              </p>
            </header>

            {error && (
              <div
                role="alert"
                className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <p>{error}</p>

                <button
                  type="button"
                  onClick={loadProgress}
                  className="self-start rounded-lg border border-red-400/30 px-3 py-2 hover:bg-red-500/10 sm:self-auto"
                >
                  Retry loading progress
                </button>
              </div>
            )}

            {/* Progress summary */}
            <section className="mb-6 sm:mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Designs completed
                  </p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold truncate">
                    {completedProblems}/{totalProblems}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Designs remaining
                  </p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold truncate">
                    {totalProblems - completedProblems}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Core concepts completed
                  </p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold truncate">
                    {completedConcepts}/{totalConcepts}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Problem completion
                  </p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-blue-400 truncate">
                    {progress}%
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>

            {/* Recommended next problem */}
            {nextProblem && (
              <section className="mb-6 sm:mb-8 rounded-2xl border border-blue-900/50 bg-blue-950/20 p-4 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Recommended next practice
                </p>

                <h2 className="mt-2 text-lg sm:text-xl font-bold">
                  {nextProblem.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {nextProblem.description}
                </p>

                <a
                  href={getPracticeUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 sm:py-3 text-sm font-semibold hover:bg-blue-700 w-full sm:w-auto text-center"
                >
                  Practice this design ↗
                </a>
              </section>
            )}

            {/* Tabs */}
            <div className="mb-5 flex flex-wrap gap-2">
              {["Problems", "Core Concepts"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setSearch("");
                  }}
                  className={`rounded-lg px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "border border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {loading ? (
              <Card>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
                  Loading your System Design progress...
                </div>
              </Card>
            ) : (
              <>
                {/* Search and filters */}
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={
                      activeTab === "Problems"
                        ? "Search problems, patterns, concepts..."
                        : "Search core concepts..."
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500"
                  />

                  {activeTab === "Problems" ? (
                    <select
                      value={selectedDifficulty}
                      onChange={(event) =>
                        setSelectedDifficulty(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500"
                    >
                      {["All", "Easy", "Medium", "Hard"].map(
                        (level) => (
                          <option key={level} value={level}>
                            {level === "All"
                              ? "All difficulties"
                              : level}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-400">
                      {completedConcepts} of {totalConcepts} concepts completed
                    </div>
                  )}
                </div>

                {/* Problems */}
                {activeTab === "Problems" ? (
                  <div className="space-y-6 sm:space-y-8">
                    {Object.keys(problemGroups).length === 0 ? (
                      <Card>
                        <p className="text-slate-400">
                          No problems match your search.
                        </p>
                      </Card>
                    ) : (
                      Object.entries(problemGroups).map(
                        ([category, items]) => (
                          <section key={category}>
                            <div className="mb-4">
                              <h2 className="text-lg sm:text-xl font-bold">
                                {category}
                              </h2>

                              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                                {items.length} practice problems
                              </p>
                            </div>

                            <div className="space-y-4">
                              {items.map((problem) => {
                                const key = `problem:${problem.id}`;
                                const isSaving = savingKeys.includes(key);

                                return (
                                  <Card
                                    key={problem.id}
                                    className="p-4 sm:p-6"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(problem.completed)}
                                        disabled={isSaving}
                                        onChange={() =>
                                          toggleItem("problem", problem)
                                        }
                                        aria-label={`Mark ${problem.title} completed`}
                                        className="mt-1 h-5 w-5 shrink-0 accent-green-500"
                                      />

                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <h3
                                            className={`text-lg font-semibold ${
                                              problem.completed
                                                ? "text-slate-500 line-through"
                                                : "text-white"
                                            }`}
                                          >
                                            {problem.title}
                                          </h3>

                                          <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                              difficultyStyle[
                                                problem.difficulty
                                              ] ||
                                              "bg-slate-800 text-slate-300"
                                            }`}
                                          >
                                            {problem.difficulty}
                                          </span>
                                        </div>

                                        <p className="mt-2 text-sm leading-6 text-slate-400">
                                          {problem.description}
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {problem.pattern && (
                                            <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-blue-300">
                                              {problem.pattern}
                                            </span>
                                          )}

                                          {(problem.concepts || []).map(
                                            (concept) => (
                                              <span
                                                key={concept}
                                                className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-400"
                                              >
                                                {concept}
                                              </span>
                                            )
                                          )}
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-3">
                                          <a
                                            href={getPracticeUrl()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 w-full sm:w-auto text-center"
                                          >
                                            Practice this problem ↗
                                          </a>

                                          {problem.completed && (
                                            <span className="text-sm text-green-400">
                                              Completed
                                            </span>
                                          )}
                                        </div>

                                        {isSaving && (
                                          <p className="mt-2 text-xs text-blue-400">
                                            Saving progress...
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          </section>
                        )
                      )
                    )}
                  </div>
                ) : (
                  /* Core concepts */
                  <div className="space-y-6 sm:space-y-8">
                    {Object.keys(conceptGroups).length === 0 ? (
                      <Card>
                        <p className="text-slate-400">
                          No concepts match your search.
                        </p>
                      </Card>
                    ) : (
                      Object.entries(conceptGroups).map(
                        ([category, items]) => (
                          <section key={category}>
                            <h2 className="mb-4 text-lg sm:text-xl font-bold">
                              {category}
                            </h2>

                            <div className="grid gap-3.5 sm:gap-4 grid-cols-1 md:grid-cols-2">
                              {items.map((concept) => {
                                const key = `concept:${concept.id}`;
                                const expanded = expandedConcepts.includes(
                                  concept.id
                                );
                                const isSaving = savingKeys.includes(key);

                                return (
                                  <Card
                                    key={concept.id}
                                    className="p-4 sm:p-5"
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(concept.completed)}
                                        disabled={isSaving}
                                        onChange={() =>
                                          toggleItem("concept", concept)
                                        }
                                        aria-label={`Mark ${concept.title} completed`}
                                        className="mt-1 h-4 w-4 shrink-0 accent-green-500"
                                      />

                                      <div className="min-w-0 flex-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleConceptExpansion(concept.id)
                                          }
                                          className="flex w-full items-center justify-between gap-3 text-left"
                                        >
                                          <span
                                            className={`font-semibold ${
                                              concept.completed
                                                ? "text-slate-500 line-through"
                                                : "text-white"
                                            }`}
                                          >
                                            {concept.title}
                                          </span>

                                          <span className="text-slate-400">
                                            {expanded ? "−" : "+"}
                                          </span>
                                        </button>

                                        {expanded && (
                                          <p className="mt-3 text-sm leading-6 text-slate-400">
                                            {concept.description}
                                          </p>
                                        )}

                                        {isSaving && (
                                          <p className="mt-2 text-xs text-blue-400">
                                            Saving progress...
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          </section>
                        )
                      )
                    )}
                  </div>
                )}
              </>
            )}

            <p className="mt-8 text-xs leading-5 text-slate-500">
              Your catalog is stored in the frontend data folder.
              Completion status is saved through the backend API.
              Practice resources open in a new browser tab.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}