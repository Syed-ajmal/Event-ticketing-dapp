import { useEffect, useState } from "react";
import { Link } from "react-router";
import Footer from "../../../components/Footer.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { useEvent } from "../hooks/useEvent.js";
import { getEventMetadata, resolveIpfsUrl } from "../services/event.api.js";

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

const getStatus = (event) => {
  if (event.cancelled) return "Cancelled";
  const now = Math.floor(Date.now() / 1000);
  if (Number(event.endsAt) <= now) return "Ended";
  if (Number(event.startsAt) <= now) return "Live";
  return "Upcoming";
};

const YourEvents = () => {
  const { events, loading, error, handleListMyEvents } = useEvent();
  const [eventCards, setEventCards] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

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

  const isLoading = loading || metadataLoading;

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />
      <section className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Creator dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your events</h1>
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
              const status = getStatus(event);
              return (
                <article key={event._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {event.metadata?.image ? (
                    <img src={resolveIpfsUrl(event.metadata.image)} alt="" className="h-48 w-full bg-slate-100 object-cover" />
                  ) : (
                    <div className="grid h-40 place-items-center bg-gradient-to-br from-indigo-100 to-cyan-100 text-4xl font-bold text-indigo-500" aria-hidden="true">
                      {(event.metadata?.name || "E").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-bold">{event.metadata?.name || `Event #${event.eventId}`}</h2>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status === "Cancelled" ? "bg-rose-50 text-rose-700" : status === "Live" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>
                        {status}
                      </span>
                    </div>
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
                        <dt className="text-slate-500">Ticket price</dt>
                        <dd className="mt-1 font-medium">{formatEth(event.ticketPrice)}</dd>
                      </div>
                    </dl>
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
