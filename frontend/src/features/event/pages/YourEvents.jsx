import { useEffect, useState } from "react";
import { Link } from "react-router";
import Footer from "../../../components/Footer.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { useEvent } from "../hooks/useEvent.js";
import { getEventMetadata, resolveIpfsUrl } from "../services/event.api.js";

const CHECK_IN_OPENS_BEFORE_SECONDS = 2 * 60 * 60;

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

const getStatus = (event, now = Math.floor(Date.now() / 1000)) => {
  if (event.proceedsWithdrawn) return "Withdrawn";
  if (event.cancelled) return "Cancelled";
  if (Number(event.endsAt) <= now) return "Ended";
  if (Number(event.startsAt) <= now) return "Live";
  return "Upcoming";
};

const isCheckInOpen = (event, now) =>
  !event.cancelled &&
  !event.proceedsWithdrawn &&
  now >= Number(event.startsAt) - CHECK_IN_OPENS_BEFORE_SECONDS &&
  now <= Number(event.endsAt);

const YourEvents = () => {
  const {
    events,
    error,
    handleListMyEvents,
    handleCancelEvent,
    handleWithdrawProceeds,
  } = useEvent();
  const [eventCards, setEventCards] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [cancellingEventId, setCancellingEventId] = useState(null);
  const [withdrawingEventId, setWithdrawingEventId] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setCurrentTime(Math.floor(Date.now() / 1000)),
      30_000,
    );
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      const records = await handleListMyEvents();
      if (!active) return;

      if (!records) {
        setMetadataLoading(false);
        setHasLoaded(true);
        return;
      }

      const cards = await Promise.all(
        records.map(async (event) => {
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
        setHasLoaded(true);
      }
    };

    loadEvents();
    return () => {
      active = false;
    };
  }, [handleListMyEvents]);

  const isLoading = !hasLoaded || metadataLoading;

  const cancelEvent = async (event) => {
    const name = event.metadata?.name || `Event #${event.eventId}`;
    if (!window.confirm(`Cancel “${name}”? This action cannot be undone.`)) return;

    setCancellingEventId(event.eventId);
    try {
      const result = await handleCancelEvent(event.eventId);
      if (result?.event) {
        setEventCards((current) =>
          current.map((card) =>
            card.eventId === result.event.eventId
              ? { ...card, ...result.event, metadata: card.metadata }
              : card,
          ),
        );
      }
    } finally {
      setCancellingEventId(null);
    }
  };

  const withdrawProceeds = async (event) => {
    const name = event.metadata?.name || `Event #${event.eventId}`;
    if (!window.confirm(`Withdraw the available ticket proceeds for “${name}”? This can only be done once.`)) {
      return;
    }

    setWithdrawingEventId(String(event.eventId));
    try {
      const result = await handleWithdrawProceeds(event.eventId);
      if (result?.event) {
        setEventCards((current) =>
          current.map((card) =>
            String(card.eventId) === String(result.event.eventId)
              ? { ...card, ...result.event, metadata: card.metadata }
              : card,
          ),
        );
      }
    } finally {
      setWithdrawingEventId(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />
      <section className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Creator dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">My events</h1>
            <p className="mt-2 text-slate-600">Manage and review the events you’ve created.</p>
          </div>
          <Link to="/events/create" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500">
            Create event
          </Link>
        </div>

        {error && (
          <p className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="py-20 text-center text-slate-600" role="status">Loading your events…</p>
        ) : hasLoaded && !error && events.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">You haven’t created any events yet</h2>
            <p className="mt-2 text-slate-600">Your published events will appear here.</p>
            <Link to="/events/create" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500">Create your first event</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {eventCards.map((event) => {
              const status = getStatus(event, currentTime);
              return (
                <article key={event._id} className="group relative flex min-h-[460px] flex-col overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15">
                  {event.metadata?.image ? (
                    <img
                      src={resolveIpfsUrl(event.metadata.image)}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-slate-900 to-cyan-900" aria-hidden="true" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/10" aria-hidden="true" />
                  <div className="relative z-10 flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                        {status}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        Event #{event.eventId}
                      </span>
                    </div>

                    <div className="mt-auto pt-16">
                      <h2 className="text-2xl font-bold leading-tight drop-shadow-sm">
                        {event.metadata?.name || `Event #${event.eventId}`}
                      </h2>
                      {event.metadata?.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/80">{event.metadata.description}</p>
                      ) : event.metadataError ? (
                        <p className="mt-2 text-sm text-white/70">Event metadata couldn’t be loaded.</p>
                      ) : null}
                      {event.metadata?.venue && <p className="mt-3 text-sm font-medium text-white/90">{event.metadata.venue}</p>}

                      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-white/20 bg-black/25 p-3 text-sm backdrop-blur-sm">
                        <div>
                          <dt className="text-white/65">Starts</dt>
                          <dd className="mt-1 font-semibold text-white">{formatDate(event.startsAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-white/65">Ends</dt>
                          <dd className="mt-1 font-semibold text-white">{formatDate(event.endsAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-white/65">Tickets</dt>
                          <dd className="mt-1 font-semibold text-white">{event.ticketLimit}</dd>
                        </div>
                        <div>
                          <dt className="text-white/65">Ticket price</dt>
                          <dd className="mt-1 font-semibold text-white">{formatEth(event.ticketPrice)}</dd>
                        </div>
                      </dl>

                      {event.proceedsWithdrawn && event.proceedsWithdrawalAmount && (
                        <p className="mt-3 text-sm font-semibold text-emerald-200">
                          Amount withdrawn: {formatEth(event.proceedsWithdrawalAmount)}
                        </p>
                      )}

                      <div className="mt-4 space-y-2.5">
                        {isCheckInOpen(event, currentTime) && (
                          <Link
                            to={`/events/${event.eventId}/check-in`}
                            className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
                          >
                            Check in attendees
                          </Link>
                        )}
                        {status === "Ended" && !event.cancelled && !event.proceedsWithdrawn && (
                          <button
                            type="button"
                            onClick={() => withdrawProceeds(event)}
                            disabled={withdrawingEventId !== null}
                            className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-60"
                          >
                            {withdrawingEventId === String(event.eventId) ? "Withdrawing proceeds…" : "Withdraw proceeds"}
                          </button>
                        )}
                        {status === "Upcoming" && (
                          <button
                            type="button"
                            onClick={() => cancelEvent(event)}
                            disabled={cancellingEventId !== null}
                            className="w-full rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
                          >
                            {cancellingEventId === event.eventId ? "Cancelling…" : "Cancel event"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default YourEvents;
