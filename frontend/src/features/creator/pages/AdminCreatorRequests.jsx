import { useCallback, useEffect, useState } from "react";
import Footer from "../../../components/Footer.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { useCreatorApproval } from "../hooks/useCreatorApproval.js";
import { getPendingCreatorRequests } from "../services/creator.api.js";

const AdminCreatorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const { handleApproveRequest, approvingRequestId, error: approvalError } =
    useCreatorApproval();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await getPendingCreatorRequests();
      setRequests(data.requests ?? []);
    } catch (err) {
      setLoadError(
        err.response?.data?.message || "Could not load creator requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const approveRequest = async (requestId) => {
    const result = await handleApproveRequest(requestId);

    if (result) {
      setRequests((currentRequests) =>
        currentRequests.filter((request) => request._id !== requestId),
      );
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />

      <section className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-600">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Creator requests
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Review creator applications and approve access using your admin wallet.
              </p>
            </div>
            <button
              type="button"
              onClick={loadRequests}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {approvalError && (
            <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
              {approvalError}
            </p>
          )}

          {loadError && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
              <p>{loadError}</p>
              <button
                type="button"
                onClick={loadRequests}
                className="mt-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <p className="mt-10 text-center text-sm text-slate-500" role="status">
              Loading creator requests…
            </p>
          ) : !loadError && requests.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">No pending requests</h2>
              <p className="mt-2 text-sm text-slate-500">
                New creator applications will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              {requests.map((request) => {
                const requester = request.user;
                const isApproving = approvingRequestId === request._id;

                return (
                  <article
                    key={request._id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold text-slate-900">
                            {request.orgName || "Creator application"}
                          </h2>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
                            {request.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {requester?.username || "Unknown user"}
                          {requester?.email ? ` · ${requester.email}` : ""}
                        </p>

                        <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">
                          {request.message || "No additional details provided."}
                        </p>

                        <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="font-semibold text-slate-500">Wallet address</dt>
                            <dd className="mt-1 break-all font-mono text-xs text-slate-700 sm:text-sm">
                              {request.walletAddress}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-slate-500">Submitted</dt>
                            <dd className="mt-1 text-slate-700">
                              {request.createdAt
                                ? new Date(request.createdAt).toLocaleString()
                                : "Date unavailable"}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <button
                        type="button"
                        onClick={() => approveRequest(request._id)}
                        disabled={Boolean(approvingRequestId)}
                        className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isApproving ? "Approving…" : "Approve request"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default AdminCreatorRequests;
