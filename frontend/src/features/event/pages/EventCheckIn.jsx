import { useCallback, useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Link, useParams } from "react-router";
import Footer from "../../../components/Footer.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { useEvent } from "../hooks/useEvent.js";
import { getEventMetadata } from "../services/event.api.js";

const Reader = ({ onDecoded }) => {
  const handleDecoded = useCallback((decodedText) => onDecoded(decodedText), [onDecoded]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "event-ticket-qr-reader",
      { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
      false,
    );
    scanner.render(handleDecoded, () => {});

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [handleDecoded]);

  return <div id="event-ticket-qr-reader" className="mx-auto w-full max-w-md" />;
};

const EventCheckIn = () => {
  const { eventId } = useParams();
  const { loading, error, handleListMyEvents, handleCheckInTicket } = useEvent();
  const [event, setEvent] = useState(null);
  const [eventName, setEventName] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;

    const loadEvent = async () => {
      setPageLoading(true);
      setPageError("");
      const events = await handleListMyEvents();
      if (!active) return;

      const selectedEvent = events?.find(
        (item) => String(item.eventId) === String(eventId),
      );
      if (!selectedEvent) {
        setPageError("That event was not found in your creator events.");
        setPageLoading(false);
        return;
      }

      setEvent(selectedEvent);
      try {
        const metadata = await getEventMetadata(selectedEvent.metadataURI);
        if (active) setEventName(metadata?.name || `Event #${eventId}`);
      } catch {
        if (active) setEventName(`Event #${eventId}`);
      }
      if (active) setPageLoading(false);
    };

    loadEvent();
    return () => { active = false; };
  }, [eventId, handleListMyEvents]);

  const handleDecoded = useCallback((rawValue) => {
    try {
      const payload = JSON.parse(rawValue);
      if (
        payload?.type !== "event-ticket" ||
        payload?.version !== 1 ||
        String(payload.eventId) !== String(eventId) ||
        !/^\d+$/.test(String(payload.ticketId ?? ""))
      ) {
        setPageError("This QR code is not a valid ticket for this event.");
        return;
      }

      setTicketId(String(payload.ticketId));
      setSuccess(null);
      setPageError("");
      setScannerOpen(false);
    } catch {
      setPageError("Could not read this QR code. Scan a ticket QR from Your tickets.");
    }
  }, [eventId]);

  const submitCheckIn = async (formEvent) => {
    formEvent.preventDefault();
    setPageError("");
    setSuccess(null);
    if (!/^\d+$/.test(ticketId.trim())) {
      setPageError("Enter a valid numeric ticket ID or scan a ticket QR.");
      return;
    }

    const result = await handleCheckInTicket(eventId, ticketId.trim());
    if (result?.ticket || result?.message === "Ticket checked in") {
      setSuccess({ ticketId: String(ticketId.trim()), transactionHash: result.ticket?.checkInTransactionHash });
      setTicketId("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />
      <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link to="/events/mine" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">← Your events</Link>
        <p className="mt-7 text-sm font-semibold uppercase tracking-wider text-indigo-600">Creator check-in</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Check in attendees</h1>
        <p className="mt-2 text-slate-600">{eventName || `Event #${eventId}`}</p>

        {pageLoading ? (
          <p className="py-16 text-center text-slate-600" role="status">Loading event…</p>
        ) : pageError && !event ? (
          <p className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">{pageError}</p>
        ) : (
          <div className="mt-8 space-y-6">
            {event?.cancelled && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">This event is cancelled. The contract will not allow check-in.</p>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-bold">Scan ticket QR</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Allow camera access, then scan the QR shown on the attendee’s ticket.</p>
              {scannerOpen ? (
                <div className="mt-5">
                  <Reader onDecoded={handleDecoded} />
                  <button type="button" onClick={() => setScannerOpen(false)} className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close camera</button>
                </div>
              ) : (
                <button type="button" disabled={Boolean(event?.cancelled)} onClick={() => { setPageError(""); setScannerOpen(true); }} className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">Open camera scanner</button>
              )}
              <p className="mt-3 text-xs leading-5 text-slate-500">Camera access requires permission and a secure connection (HTTPS, or localhost during development). You can also enter the ticket ID below.</p>
            </div>

            <form onSubmit={submitCheckIn} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <label htmlFor="ticket-id" className="text-lg font-bold">Confirm ticket</label>
              <p className="mt-1 text-sm text-slate-600">Check the scanned ID or enter it manually.</p>
              <input id="ticket-id" inputMode="numeric" pattern="[0-9]*" value={ticketId} onChange={(e) => { setTicketId(e.target.value); setSuccess(null); }} placeholder="Ticket ID" className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              {(pageError || error) && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{pageError || error}</p>}
              {success && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status"><p className="font-semibold">Ticket #{success.ticketId} checked in successfully.</p>{success.transactionHash && <p className="mt-1 break-all font-mono text-xs">Transaction: {success.transactionHash}</p>}</div>}
              <button type="submit" disabled={loading || Boolean(event?.cancelled) || !ticketId.trim()} className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Waiting for wallet and confirmation…" : "Check in ticket"}</button>
            </form>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default EventCheckIn;
