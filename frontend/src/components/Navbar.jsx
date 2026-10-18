
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link
          to="/"
          className="shrink-0 text-lg font-bold text-white sm:text-2xl"
        >
          AI<span className="text-blue-500">Coach</span>
        </Link>

        {/* Navigation */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="whitespace-nowrap text-xs text-slate-300 transition hover:text-white sm:text-sm md:text-base"
              >
                Dashboard
              </Link>

              <span className="hidden max-w-40 truncate text-xs text-slate-400 sm:text-sm md:block">
                Hi, {user.name}
              </span>

              <button
                type="button"
                onClick={logout}
                className="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="whitespace-nowrap text-xs text-slate-300 transition hover:text-white sm:text-sm md:text-base"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="shrink-0 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 sm:px-5 sm:py-2 sm:text-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
