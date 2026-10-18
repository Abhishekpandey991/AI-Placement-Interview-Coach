import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(formData);

      console.log("Login successful:", data);

      // Save JWT token
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // Update AuthContext
      login(data.user);

      // Go to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <Navbar />

      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-8 sm:px-6 sm:py-12">

        <div className="w-full max-w-md">

          {/* Heading */}

          <div className="mb-6 sm:mb-8 text-center">

            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Sign in to continue your interview preparation.
            </p>

          </div>


          {/* Login Card */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-8 shadow-xl">

            {/* Error */}

            {error && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}


            <form onSubmit={handleSubmit}>

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

              </div>


              {/* Password */}

              <div className="mt-5">

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

              </div>


              {/* Login Button */}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Logging in..."
                  : "Login"
                }
              </button>

            </form>


            {/* Register */}

            <p className="mt-6 text-center text-sm text-slate-400">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-medium text-blue-500 hover:text-blue-400"
              >
                Create one
              </Link>

            </p>

          </div>

        </div>

      </main>

    </div>
  );
}

