
import { NavLink } from "react-router-dom";

const links = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "▦",
  },
  {
    name: "Interviews",
    path: "/interview/setup",
    icon: "◉",
  },
  {
    name: "Resume Analyzer",
    path: "/resume-analyzer",
    icon: "▤",
  },
  {
    name: "Resume History",
    path: "/resume-history",
    icon: "◷",
  },
  {
    name: "Preparation",
    path: "/preparation",
    icon: "✦",
  },
  {
    name: "DSA Practice",
    path: "/dsa",
    icon: "⌘",
  },
  {
    name: "System Design",
    path: "/system-design",
    icon: "◇",
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: "▥",
  },
  {
    name: "AI Placement Mentor",
    path: "/mentor",
    icon: "✧",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-full shrink-0 border-b border-slate-800/80 bg-slate-950 p-2.5 sm:p-4 lg:min-h-[calc(100vh-65px)] lg:w-64 lg:border-b-0 lg:border-r lg:p-5">
      {/* Workspace Header */}
      <div className="mb-5 hidden rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900 to-slate-950 p-4 lg:mb-8 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-xl text-blue-400 ring-1 ring-blue-500/20">
            ✦
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-white">
              Your Workspace
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Placement preparation
            </p>
          </div>
        </div>

        <div className="mt-4 h-px bg-slate-800" />

        <p className="mt-3 text-xs leading-5 text-slate-400">
          Build skills. Practice interviews. Get placement ready.
        </p>
      </div>

      {/* Navigation Label */}
      <div className="mb-3 hidden px-3 lg:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Navigation
        </p>
      </div>

      {/* Navigation Links */}
      <nav
        aria-label="Main navigation"
        className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 sm:gap-2 lg:flex-col lg:gap-1.5 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0"
      >
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/dashboard"}
            className={({ isActive }) =>
              `group relative flex shrink-0 items-center gap-2 sm:gap-3 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-200 sm:px-3.5 sm:py-2.5 sm:text-sm lg:w-full lg:py-3 ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 ring-1 ring-inset ring-blue-500/25"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active Indicator */}
                {isActive && (
                  <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-blue-400 lg:bottom-2 lg:top-2 lg:w-1" />
                )}

                {/* Icon */}
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-sm sm:text-base lg:text-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-slate-900 text-slate-400 group-hover:bg-slate-800 group-hover:text-white"
                  }`}
                >
                  {link.icon}
                </span>

                {/* Link Label */}
                <span className="lg:truncate">
                  {link.name}
                </span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="ml-auto hidden h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400 lg:block" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Desktop Footer */}
      <div className="mt-8 hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 lg:block">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="text-xs font-medium text-slate-300">
            Keep moving forward
          </p>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Every practice session brings you closer to your goal.
        </p>
      </div>
    </aside>
  );
}
