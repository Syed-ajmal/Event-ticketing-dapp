import { useState } from "react";
import { Link } from "react-router";
import Footer from "../../../components/Footer.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { useWallet } from "../../wallet/hooks/useWallet.js";
import { useCreator } from "../hooks/useCreator.js";

const CreateRequest = () => {
  const { walletAddress } = useWallet();
  const { handleRequest, request, loading, error } = useCreator();
  const [orgName, setOrgName] = useState("");
  const [message, setMessage] = useState("");

  const submitHandler = async (event) => {
    event.preventDefault();

    if (!walletAddress) {
      return;
    }

    await handleRequest({ orgName, message });
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />

      <section className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-[#111936] px-6 py-14 sm:py-20">
        <div className="absolute -right-24 -top-36 -z-10 size-[32rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 -z-10 size-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="w-full max-w-xl rounded-2xl border border-white/60 bg-white p-6 shadow-2xl sm:p-9">
          {request ? (
            <div className="py-4 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-600" aria-hidden="true">
                ✓
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-emerald-600">
                Request submitted
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Thanks, {request.orgName}
              </h1>
              <p className="mt-3 leading-7 text-slate-600">
                Your creator request is <span className="font-semibold">{request.status}</span> and waiting for admin review.
              </p>
              <Link
                to="/"
                className="mt-7 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Return home
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7 text-center">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">
                  Creator access
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Request creator access
                </h1>
                <p className="mt-3 leading-6 text-slate-500">
                  Tell us about your organization and the events you plan to host.
                </p>
              </div>

              {!walletAddress && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Link a wallet before submitting a creator request. You can connect one from the navbar.
                </div>
              )}

              {error && (
                <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
                  {error}
                </p>
              )}

              <form className="flex flex-col gap-5" onSubmit={submitHandler}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="orgName" className="text-sm font-semibold text-slate-700">
                    Organization name
                  </label>
                  <input
                    id="orgName"
                    name="orgName"
                    type="text"
                    required
                    maxLength={200}
                    value={orgName}
                    onChange={(event) => setOrgName(event.target.value)}
                    placeholder="Your organization or event brand"
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                    Tell us about your events
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    maxLength={1000}
                    rows={5}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Describe the events you organize and why you need creator access."
                    className="resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <span className="text-right text-xs text-slate-400">
                    {message.length}/1000
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !walletAddress}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-lg shadow-indigo-950/15 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Submitting…" : "Submit request"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default CreateRequest;
