import { useEffect, useState } from "react";
import { Link } from "react-router";
import { QRCodeSVG } from "qrcode.react";
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

const formatWeiAsEth = (value) => {
  try {
    const wei = BigInt(value);
    const whole = wei / 10n ** 18n;
    const fraction = (wei % 10n ** 18n)
      .toString()
      .padStart(18, "0")
      .replace(/0+$/, "");
    return `${whole}${fraction ? `.${fraction}` : ""} ETH`;
  } catch {
    return `${value} wei`;
  }
};

const YourTickets = () => {
  const { error, handleListMyTickets, handleRefundTicket } = useEvent();
  const [tickets, setTickets] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [shownQrTicketId, setShownQrTicketId] = useState(null);
  const [refundingTicketId, setRefundingTicketId] = useState(null);

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

  const pageLoading = !hasLoaded || metadataLoading;

  const refundTicket = async (ticket) => {
    const eventName = ticket.metadata?.name || `Event #${ticket.eventId}`;
    if (!window.confirm(`Refund your ticket for “${eventName}”? The ticket NFT will be burned and its ticket price returned to your wallet.`)) {
      return;
    }

    setRefundingTicketId(String(ticket.ticketId));
    try {
      const result = await handleRefundTicket(ticket.eventId, ticket.ticketId);
      if (result?.ticket) {
        setTickets((current) =>
          current.map((item) =>
            String(item.ticketId) === String(ticket.ticketId)
              ? {
                  ...item,
                  ...result.ticket,
                  event: item.event,
                  metadata: item.metadata,
                  refunded: true,
                  refundAmount: result.refundAmount,
                  refundTransactionHash:
                    result.ticket.refundTransactionHash || item.refundTransactionHash,
                }
              : item,
          ),
        );
        setShownQrTicketId(null);
      }
    } finally {
      setRefundingTicketId(null);
    }
  };

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
              // Keep on-chain uint IDs as strings so large values are never rounded.
              const checkInPayload = JSON.stringify({
                type: "event-ticket",
                version: 1,
                eventId: String(event?.eventId ?? ticket.eventId),
                ticketId: String(ticket.ticketId),
              });

              return (
                <article key={ticket._id} className="[perspective:1200px]">
                  <div className={`relative min-h-[460px] transition-transform duration-700 [transform-style:preserve-3d] ${shownQrTicketId === String(ticket.ticketId) ? "[transform:rotateY(180deg)]" : ""}`}>
                  <div className="group relative flex min-h-[460px] flex-col overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15 [backface-visibility:hidden]">
                  {ticket.metadata?.image ? (
                    <img
                      src={resolveIpfsUrl(ticket.metadata.image)}
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
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm ${ticket.refunded ? "border-emerald-200/40 bg-emerald-500/25 text-emerald-100" : event?.cancelled ? "border-rose-200/40 bg-rose-500/25 text-rose-100" : "border-white/25 bg-black/25 text-white/90"}`}>
                        {ticket.refunded ? "Refunded" : event?.cancelled ? "Cancelled" : "Your ticket"}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        Ticket #{ticket.ticketId}
                      </span>
                    </div>

                    <div className="mt-auto pt-16">
                      <h2 className="text-2xl font-bold leading-tight drop-shadow-sm">{ticket.metadata?.name || `Event #${ticket.eventId}`}</h2>
                      {ticket.metadata?.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/80">{ticket.metadata.description}</p>
                      ) : ticket.metadataError ? (
                        <p className="mt-2 text-sm text-white/70">Event metadata couldn’t be loaded.</p>
                      ) : null}
                      {ticket.metadata?.venue && <p className="mt-3 text-sm font-medium text-white/90">{ticket.metadata.venue}</p>}

                      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-white/20 bg-black/25 p-3 text-sm backdrop-blur-sm">
                        <div className="col-span-2">
                          <dt className="text-white/65">Event date</dt>
                          <dd className="mt-1 font-semibold text-white">
                            {event ? `${formatDate(event.startsAt * 1000)} – ${formatDate(event.endsAt * 1000)}` : "Event details unavailable"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-white/65">Claimed</dt>
                          <dd className="mt-1 font-semibold text-white">{formatDate(ticket.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-white/65">Price</dt>
                          <dd className="mt-1 font-semibold text-white">{event ? formatWeiAsEth(event.ticketPrice) : "—"}</dd>
                        </div>
                      </dl>

                      {event?.cancelled && ticket.refunded && (
                        <p className="mt-3 text-sm font-semibold text-emerald-200">
                          Refund received{ticket.refundAmount ? ` · ${formatWeiAsEth(ticket.refundAmount)}` : ""}
                        </p>
                      )}

                      <div className="mt-4 space-y-2.5">
                        {event?.cancelled && !ticket.refunded && (
                          <button
                            type="button"
                            onClick={() => refundTicket(ticket)}
                            disabled={refundingTicketId !== null}
                            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                          >
                            {refundingTicketId === String(ticket.ticketId) ? "Confirming refund…" : "Refund ticket"}
                          </button>
                        )}
                        {!event?.cancelled && !ticket.refunded && (
                          <button
                            type="button"
                            aria-expanded={shownQrTicketId === String(ticket.ticketId)}
                            aria-controls={`ticket-qr-${ticket.ticketId}`}
                            onClick={() =>
                              setShownQrTicketId((current) =>
                                current === String(ticket.ticketId) ? null : String(ticket.ticketId),
                              )
                            }
                            className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                          >
                            {shownQrTicketId === String(ticket.ticketId) ? "Hide QR" : "Show QR"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                  {shownQrTicketId === String(ticket.ticketId) && !ticket.refunded && !event?.cancelled && (
                    <div
                      id={`ticket-qr-${ticket.ticketId}`}
                      className="absolute inset-0 flex min-h-[460px] flex-col items-center justify-center rounded-2xl bg-white p-6 text-center text-slate-900 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    >
                      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Entry ticket</p>
                      <h2 className="mt-2 text-xl font-bold">{ticket.metadata?.name || `Event #${ticket.eventId}`}</h2>
                      <p className="mt-1 text-sm text-slate-500">Ticket #{ticket.ticketId}</p>
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <QRCodeSVG
                          value={checkInPayload}
                          size={220}
                          level="M"
                          title={`Check-in QR code for ${ticket.metadata?.name || `event ${ticket.eventId}`}, ticket ${ticket.ticketId}`}
                          className="h-56 w-56 max-w-full"
                        />
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-700">Show this QR code at the event entrance.</p>
                      <button
                        type="button"
                        onClick={() => setShownQrTicketId(null)}
                        className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                      >
                        Back to ticket
                      </button>
                    </div>
                  )}
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
