import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
  getDSAProblems,
  createDSAProblem,
  updateDSAProblemStatus,
  updateDSAProblemRevision,
} from "../services/api";

import {
  dsaPatternCatalog,
  dsaTopicOrder,
} from "../data/dsaPatternCatalog";

const normalizeTopic = (topic = "") => {
  const value = topic.toLowerCase().trim();

  const aliases = {
    array: "arrays",
    string: "strings",
    "binary tree": "binary trees",
    graph: "graphs",
    stack: "stacks and queues",
    queue: "stacks and queues",
    heap: "heaps",
  };

  return aliases[value] || value;
};

const groupProblemsByPattern = (problems) => {
  const groups = {};

  for (const problem of problems) {
    const topic = problem.topic || "Other";
    const pattern = problem.pattern || "General";

    if (!groups[topic]) groups[topic] = {};
    if (!groups[topic][pattern]) groups[topic][pattern] = [];

    groups[topic][pattern].push(problem);
  }

  return groups;
};

export default function Dsa() {
  const [savedProblems, setSavedProblems] = useState([]);
  const [topic, setTopic] = useState("All Topics");
  const [difficulty, setDifficulty] = useState("All");
  const [view, setView] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  async function loadProblems() {
    try {
      const data = await getDSAProblems();

      setSavedProblems(
        Array.isArray(data.problems) ? data.problems : []
      );
    } catch (err) {
      setError(err.message || "Could not load DSA problems.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProblems();
  }, []);

  const topicOptions = useMemo(() => {
    const topics = [
      ...dsaTopicOrder,
      ...dsaPatternCatalog.map((problem) => problem.topic),
      ...savedProblems.map((problem) => problem.topic),
    ];

    return [
      "All Topics",
      ...new Set(topics.filter(Boolean)),
    ];
  }, [savedProblems]);

  // Display all catalog questions, plus saved custom questions.
  const allProblems = useMemo(() => {
    const combined = [...dsaPatternCatalog];

    for (const saved of savedProblems) {
      const exists = combined.some(
        (problem) =>
          problem.title.trim().toLowerCase() ===
            saved.title.trim().toLowerCase() &&
          normalizeTopic(problem.topic) ===
            normalizeTopic(saved.topic)
      );

      if (!exists) {
        combined.push({
          id: `custom-${saved.id}`,
          title: saved.title,
          topic: saved.topic || "Other",
          pattern: saved.pattern || "Custom Problems",
          difficulty: saved.difficulty || "Medium",
          url: saved.url || null,
          custom: true,
        });
      }
    }

    return combined;
  }, [savedProblems]);

  // Match database records by title and topic.
  function findSaved(problem) {
    return savedProblems.find(
      (saved) =>
        saved.title.trim().toLowerCase() ===
          problem.title.trim().toLowerCase() &&
        normalizeTopic(saved.topic) ===
          normalizeTopic(problem.topic)
    );
  }

  function isSolved(problem) {
    const saved = findSaved(problem);

    return (
      saved?.status === "Solved Independently" ||
      saved?.status === "Completed" ||
      saved?.status === "Solved"
    );
  }

  function needsRevision(problem) {
    return Boolean(findSaved(problem)?.needs_revision);
  }

  const filteredProblems = useMemo(() => {
    return allProblems.filter((problem) => {
      if (
        topic !== "All Topics" &&
        normalizeTopic(problem.topic) !== normalizeTopic(topic)
      ) {
        return false;
      }

      if (
        difficulty !== "All" &&
        problem.difficulty !== difficulty
      ) {
        return false;
      }

      const query = search.trim().toLowerCase();

      if (
        query &&
        !problem.title.toLowerCase().includes(query) &&
        !problem.topic.toLowerCase().includes(query) &&
        !(problem.pattern || "").toLowerCase().includes(query)
      ) {
        return false;
      }

      if (view === "Revision" && !needsRevision(problem)) {
        return false;
      }

      if (view === "Unsolved" && isSolved(problem)) {
        return false;
      }

      if (view === "Solved" && !isSolved(problem)) {
        return false;
      }

      return true;
    });
  }, [
    allProblems,
    topic,
    difficulty,
    search,
    view,
    savedProblems,
  ]);

  const groupedProblems = useMemo(
    () => groupProblemsByPattern(filteredProblems),
    [filteredProblems]
  );

  const solvedCount = allProblems.filter(isSolved).length;
  const revisionCount = allProblems.filter(needsRevision).length;

  const progress = allProblems.length
    ? Math.round((solvedCount / allProblems.length) * 100)
    : 0;

  async function toggleSolved(problem, checked) {
    const key = `${problem.topic}:${problem.title}`;

    try {
      setBusyKey(key);
      setError("");

      const saved = findSaved(problem);
      const status = checked
        ? "Solved Independently"
        : "Not Started";

      if (saved) {
        await updateDSAProblemStatus(saved.id, status);

        setSavedProblems((previous) =>
          previous.map((item) =>
            item.id === saved.id
              ? { ...item, status }
              : item
          )
        );
      } else {
        await createDSAProblem({
          title: problem.title,
          topic: problem.topic,
          difficulty: problem.difficulty,
          status,
        });

        await loadProblems();
      }
    } catch (err) {
      setError(err.message || "Could not update solved status.");
    } finally {
      setBusyKey("");
    }
  }

  async function toggleRevision(problem, checked) {
    const key = `${problem.topic}:${problem.title}:revision`;

    try {
      setBusyKey(key);
      setError("");

      let saved = findSaved(problem);

      // A catalog question must have a database record before
      // its revision status can be saved.
      if (!saved) {
        await createDSAProblem({
          title: problem.title,
          topic: problem.topic,
          difficulty: problem.difficulty,
          status: "Not Started",
        });

        const data = await getDSAProblems();
        const updated = Array.isArray(data.problems)
          ? data.problems
          : [];

        saved = updated.find(
          (item) =>
            item.title.trim().toLowerCase() ===
              problem.title.trim().toLowerCase() &&
            normalizeTopic(item.topic) ===
              normalizeTopic(problem.topic)
        );

        if (!saved) {
          throw new Error("Problem record could not be loaded.");
        }

        setSavedProblems(updated);
      }

      await updateDSAProblemRevision(saved.id, checked);

      setSavedProblems((previous) =>
        previous.map((item) =>
          item.id === saved.id
            ? { ...item, needs_revision: checked }
            : item
        )
      );
    } catch (err) {
      setError(
        err.message || "Could not update revision checklist."
      );
    } finally {
      setBusyKey("");
    }
  }

  const orderedTopics = [
    ...dsaTopicOrder.filter((name) => groupedProblems[name]),
    ...Object.keys(groupedProblems).filter(
      (name) => !dsaTopicOrder.includes(name)
    ),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        <Sidebar />

        <main className="min-w-0 flex-1 px-3.5 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <header className="mb-5 sm:mb-7">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-400">
                DSA PRACTICE
              </p>

              <h1 className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                My DSA Checklist
              </h1>

              <p className="mt-1.5 sm:mt-2 text-sm text-slate-400">
                Practise by topic and pattern. Track solved questions
                and maintain a separate revision checklist.
              </p>
            </header>

            {error && (
              <div className="mb-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
                {error}

                <button
                  onClick={() => setError("")}
                  className="ml-3 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Progress summary */}
            <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Solved independently
                  </p>

                  <p className="mt-1 text-2xl sm:text-3xl font-bold truncate">
                    {loading
                      ? "..."
                      : `${solvedCount} / ${allProblems.length}`}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Needs revision
                  </p>

                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-amber-400">
                    {revisionCount}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs sm:text-sm text-slate-400">
                    Overall progress
                  </p>

                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-blue-400">
                    {progress}%
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Progress is based on the current catalog and saved
                custom questions.
              </p>
            </section>

            {/* Search and filters */}
            <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search problem, topic or pattern..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500"
                aria-label="Filter by topic"
              >
                {topicOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500"
                aria-label="Filter by difficulty"
              >
                {["All", "Easy", "Medium", "Hard"].map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All difficulties" : item}
                  </option>
                ))}
              </select>
            </section>

            {/* View filters */}
            <div className="mb-5 flex flex-wrap gap-2">
              {[
                ["All", "All Problems"],
                ["Unsolved", "To Practise"],
                ["Solved", "Solved"],
                ["Revision", `Revision (${revisionCount})`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setView(value)}
                  className={`rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition ${
                    view === value
                      ? "bg-blue-600 text-white"
                      : "border border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Topic -> Pattern -> Problems */}
            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                Loading problems...
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                No problems found. Try another filter.
              </div>
            ) : (
              <div className="space-y-6">
                {orderedTopics.map((topicName) => {
                  const patterns = groupedProblems[topicName];
                  const topicProblems = Object.values(patterns).flat();
                  const topicSolved = topicProblems.filter(isSolved).length;

                  return (
                    <section
                      key={topicName}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                    >
                      <div className="border-b border-slate-800 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-bold text-white">
                              {topicName}
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                              {topicSolved} of {topicProblems.length} solved
                            </p>
                          </div>

                          <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all"
                              style={{
                                width: `${
                                  topicProblems.length
                                    ? (topicSolved / topicProblems.length) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 p-3 sm:p-4">
                        {Object.entries(patterns).map(
                          ([patternName, problems]) => {
                            const patternSolved =
                              problems.filter(isSolved).length;

                            return (
                              <details
                                key={`${topicName}-${patternName}`}
                                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60"
                              >
                                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-800/50">
                                  <div>
                                    <h3 className="font-semibold text-slate-100">
                                      {patternName}
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {problems.length} problems
                                    </p>
                                  </div>

                                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                    {patternSolved}/{problems.length} solved
                                  </span>
                                </summary>

                                <div className="divide-y divide-slate-800">
                                  {problems.map((problem, index) => {
                                    const solved = isSolved(problem);
                                    const revision = needsRevision(problem);
                                    const key = `${problem.topic}:${problem.title}`;

                                    const busy =
                                      busyKey === key ||
                                      busyKey === `${key}:revision`;

                                    return (
                                      <div
                                        key={key}
                                        className="flex flex-col gap-3 p-3.5 sm:p-4 sm:flex-row sm:items-center justify-between"
                                      >
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                          <input
                                            type="checkbox"
                                            checked={solved}
                                            disabled={busy}
                                            onChange={(event) =>
                                              toggleSolved(
                                                problem,
                                                event.target.checked
                                              )
                                            }
                                            className="mt-0.5 sm:mt-1 h-5 w-5 shrink-0 accent-green-500"
                                            aria-label={`Solved ${problem.title}`}
                                          />

                                          <div className="min-w-0 flex-1">
                                            <p
                                              className={`font-medium text-sm sm:text-base ${
                                                solved
                                                  ? "text-slate-500 line-through"
                                                  : "text-white"
                                              }`}
                                            >
                                              {index + 1}. {problem.title}
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                              <span
                                                className={`rounded-full px-2 py-0.5 sm:py-1 ${
                                                  problem.difficulty === "Easy"
                                                    ? "bg-green-500/10 text-green-400"
                                                    : problem.difficulty === "Medium"
                                                    ? "bg-yellow-500/10 text-yellow-400"
                                                    : "bg-red-500/10 text-red-400"
                                                }`}
                                              >
                                                {problem.difficulty}
                                              </span>

                                              {busy && (
                                                <span className="text-blue-400">
                                                  Saving...
                                                </span>
                                              )}
                                            </div>

                                            <label className="mt-2.5 sm:mt-3 inline-flex cursor-pointer items-center gap-2 text-xs sm:text-sm text-amber-300">
                                              <input
                                                type="checkbox"
                                                checked={revision}
                                                disabled={busy}
                                                onChange={(event) =>
                                                  toggleRevision(
                                                    problem,
                                                    event.target.checked
                                                  )
                                                }
                                                className="h-4 w-4 accent-amber-500"
                                              />
                                              Revise later
                                            </label>
                                          </div>
                                        </div>

                                        {problem.url ? (
                                          <a
                                            href={problem.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="self-start sm:self-center rounded-lg border border-slate-700 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-300 hover:border-blue-500 hover:text-white shrink-0 ml-8 sm:ml-0"
                                          >
                                            Solve ↗
                                          </a>
                                        ) : (
                                          <span className="self-start sm:self-center text-xs text-slate-500 shrink-0 ml-8 sm:ml-0">
                                            Custom
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </details>
                            );
                          }
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">
              Solved and revision states are saved to your account.
              You can mark a solved problem for revision without
              unchecking its solved status.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
