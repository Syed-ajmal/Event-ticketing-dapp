import { useEffect, useState } from "react";
import { Link } from "react-router";
import Footer from "../../../components/Footer.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { useEvent } from "../hooks/useEvent.js";
import { getEventMetadata, resolveIpfsUrl } from "../services/event.api.js";

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const YourTickets = () => {
  const { loading, error, handleListMyTickets } = useEvent();
  const [tickets, setTickets] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      const records = await handleListMyTickets();
      if (!active) return;

      if (!records) {
        setHasLoaded(true);
        setMetadataLoading(false);
        return;
      }

      const ticketsWithMetadata = await Promise.all(
        records.map(async (ticket) => {
          if (!ticket.event?.metadataURI) {
            return { ...ticket, metadata: null, metadataError: false };
          }

          try {
            const metadata = await getEventMetadata(ticket.event.metadataURI);
            return { ...ticket, metadata, metadataError: false };
          } catch {
            return { ...ticket, metadata: null, metadataError: true };
          }
        }),
      );

      if (active) {
        setTickets(ticketsWithMetadata);
        setHasLoaded(true);
        setMetadataLoading(false);
      }
    };

    loadTickets();
    return () => {
      active = false;
    };
  }, [handleListMyTickets]);

  const pageLoading = !hasLoaded || loading || metadataLoading;

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />
      <section className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Your account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your tickets</h1>
          <p className="mt-2 text-slate-600">Tickets you’ve claimed for upcoming and past events.</p>
        </div>

        {error && (
          <p className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}

        {pageLoading ? (
          <p className="py-20 text-center text-slate-600" role="status">Loading your tickets…</p>
        ) : tickets.length === 0 && !error ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">You don’t have any tickets yet</h2>
            <p className="mt-2 text-slate-600">Browse upcoming events and claim a ticket to see it here.</p>
            <Link to="/events" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500">
              Explore events
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => {
              const event = ticket.event;
              return (
                <article key={ticket._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {ticket.metadata?.image ? (
                    <img src={resolveIpfsUrl(ticket.metadata.image)} alt="" className="h-44 w-full bg-slate-100 object-cover" />
                  ) : (
                    <div className="grid h-36 place-items-center bg-gradient-to-br from-indigo-100 to-cyan-100 text-4xl font-bold text-indigo-500" aria-hidden="true">
                      {(ticket.metadata?.name || "T").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-bold">{ticket.metadata?.name || `Event #${ticket.eventId}`}</h2>
                      {event?.cancelled && (
                        <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Cancelled</span>
                      )}
                    </div>
                    {ticket.metadata?.description ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{ticket.metadata.description}</p>
                    ) : ticket.metadataError ? (
                      <p className="mt-2 text-sm text-slate-500">Event metadata couldn’t be loaded.</p>
                    ) : null}
                    {ticket.metadata?.venue && <p className="mt-3 text-sm text-slate-600">{ticket.metadata.venue}</p>}

                    <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 text-sm">
                      <div>
                        <dt className="text-slate-500">Ticket ID</dt>
                        <dd className="mt-1 break-all font-mono font-semibold">{ticket.ticketId}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Event date</dt>
                        <dd className="mt-1 font-medium">
                          {event ? `${formatDate(event.startsAt * 1000)} – ${formatDate(event.endsAt * 1000)}` : "Event details unavailable"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Claimed</dt>
                        <dd className="mt-1 font-medium">{formatDate(ticket.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Transaction</dt>
                        <dd className="mt-1 break-all font-mono text-xs text-slate-600">{ticket.transactionHash}</dd>
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

export default YourTickets;
