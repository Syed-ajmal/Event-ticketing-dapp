import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from "react";

const Protected = ({ children, allowedRoles }) => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <main
        aria-busy="true"
        className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5 text-slate-900"
      >
        <div
          className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-xl shadow-slate-900/5"
          role="status"
          aria-live="polite"
        >
          <span className="relative mb-5 grid size-16 place-items-center" aria-hidden="true">
            <span className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-600" />
            <svg viewBox="0 0 24 24" fill="none" className="size-7 text-indigo-600">
              <path d="M7 3.75h7l4 4V20a.25.25 0 0 1-.25.25h-10.5A.25.25 0 0 1 7 20V3.75Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="M14 4v4h4M9.5 13l1.7 1.7 3.5-3.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="text-lg font-bold">Securing your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please wait while we update your session.
          </p>
        </div>
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default Protected;
