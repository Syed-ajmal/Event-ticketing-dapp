import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Footer from "../../../components/Footer.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { useEvent } from "../hooks/useEvent.js";
import { getEventMetadata, resolveIpfsUrl } from "../services/event.api.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { useWallet } from "../../wallet/hooks/useWallet.js";

const formatDate = (timestamp) =>
  new Date(Number(timestamp) * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatEth = (wei) => {
  try {
    const amount = BigInt(wei);
    const whole = amount / 10n ** 18n;
    const fraction = (amount % 10n ** 18n)
      .toString()
      .padStart(18, "0")
      .replace(/0+$/, "");
    return `${whole}${fraction ? `.${fraction}` : ""} ETH`;
  } catch {
    return `${wei} wei`;
  }
};

const PublicEvents = () => {
  const {
    loading,
    error,
    handleListPublicEvents,
    handleClaimTicket,
  } = useEvent();
  const { user, loading: authLoading } = useAuth();
  const {
    isLinked,
    connecting,
    error: walletError,
    connectWallet,
  } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [eventCards, setEventCards] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [listFailed, setListFailed] = useState(false);
  const [claimingEventId, setClaimingEventId] = useState(null);
  const [claimedTickets, setClaimedTickets] = useState({});

  useEffect(() => {
    let active = true;
    setMetadataLoading(true);

    const loadPage = async () => {
      const result = await handleListPublicEvents(page);
      if (!active) return;

      if (!result?.events) {
        setEventCards([]);
        setListFailed(true);
        setMetadataLoading(false);
        return;
      }

      setListFailed(false);
      setTotalPages(Math.max(1, result.totalPages || 1));
      const cards = await Promise.all(
        result.events.map(async (event) => {
          try {
            const metadata = await getEventMetadata(event.metadataURI);
            return { ...event, metadata, metadataError: false };
          } catch {
            return { ...event, metadata: null, metadataError: true };
          }
        }),
      );

      if (active) {
        setEventCards(cards);
        setMetadataLoading(false);
      }
    };

    loadPage();
    return () => {
      active = false;
    };
  }, [handleListPublicEvents, page, reloadKey]);

  const pageLoading = loading || metadataLoading;

  const onClaimTicket = async (event) => {
    if (!user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }

    if (user.role !== "attendee") return;

    if (!isLinked) {
      connectWallet().catch(() => {});
      return;
    }

    setClaimingEventId(event.eventId);
    try {
      const result = await handleClaimTicket(event.eventId);
      if (result?.ticket) {
        setClaimedTickets((current) => ({
          ...current,
          [event.eventId]: result.ticket,
        }));
      }
    } finally {
      setClaimingEventId(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />
      <section className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Discover</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Explore events</h1>
          <p className="mt-2 text-slate-600">Find upcoming events and see what’s happening.</p>
        </div>

        {error && (
          <div className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {error}
            {listFailed && (
              <button type="button" onClick={() => setReloadKey((current) => current + 1)} className="ml-3 font-semibold underline">
                Retry loading events
              </button>
            )}
          </div>
        )}
        {walletError && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {walletError}
          </p>
        )}

        {pageLoading ? (
          <p className="py-20 text-center text-slate-600" role="status">Loading events…</p>
        ) : eventCards.length === 0 && !error ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">No upcoming events yet</h2>
            <p className="mt-2 text-slate-600">Check back later to see new events.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {eventCards.map((event) => (
              <article key={event._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {event.metadata?.image ? (
                  <img src={resolveIpfsUrl(event.metadata.image)} alt="" className="h-48 w-full bg-slate-100 object-cover" />
                ) : (
                  <div className="grid h-40 place-items-center bg-gradient-to-br from-indigo-100 to-cyan-100 text-4xl font-bold text-indigo-500" aria-hidden="true">
                    {(event.metadata?.name || "E").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-xl font-bold">{event.metadata?.name || `Event #${event.eventId}`}</h2>
                  {event.metadata?.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{event.metadata.description}</p>
                  ) : event.metadataError ? (
                    <p className="mt-2 text-sm text-slate-500">Event metadata couldn’t be loaded.</p>
                  ) : null}
                  {event.metadata?.venue && <p className="mt-3 text-sm text-slate-600">{event.metadata.venue}</p>}
                  <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <dt className="text-slate-500">Starts</dt>
                      <dd className="mt-1 font-medium">{formatDate(event.startsAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Ends</dt>
                      <dd className="mt-1 font-medium">{formatDate(event.endsAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Tickets</dt>
                      <dd className="mt-1 font-medium">{event.ticketLimit}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Price</dt>
                      <dd className="mt-1 font-medium">{formatEth(event.ticketPrice)}</dd>
                    </div>
                  </dl>
                  {claimedTickets[event.eventId] ? (
                    <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
                      Ticket #{claimedTickets[event.eventId].ticketId} claimed
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onClaimTicket(event)}
                      disabled={authLoading || connecting || claimingEventId !== null || Boolean(user && user.role !== "attendee")}
                      className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {authLoading
                        ? "Checking account…"
                        : !user
                          ? "Log in to claim"
                          : user.role !== "attendee"
                            ? "Attendees only"
                            : connecting
                              ? "Linking wallet…"
                              : !isLinked
                                ? "Link wallet to claim"
                                : claimingEventId === event.eventId
                                  ? "Claiming ticket…"
                                  : "Claim ticket"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!pageLoading && totalPages > 1 && (
          <nav aria-label="Event pages" className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default PublicEvents;
