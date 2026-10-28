import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { useAuth } from "../hooks/useAuth.js";

const Login = () => {
  const { handleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await handleLogin({ email, password });
      if (success) {
        navigate(location.state?.from || "/", { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />

      <section className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-[#111936] px-6 py-16 sm:py-20">
        <div className="absolute -right-24 -top-36 -z-10 size-[32rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 -z-10 size-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl sm:p-9">
          <div className="mb-8 text-center">
            
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Log in to TicketApp</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to find your events and manage your tickets.</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={submitHandler}>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-live="polite"
                className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-lg shadow-indigo-950/15 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-[.99] disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? "Logging in…" : "Log in"}
              </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link className="font-semibold text-indigo-600 transition hover:text-indigo-500" to="/register">
              Register
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Login;
