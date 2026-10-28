import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Link, useParams } from "react-router";
import Footer from "../../../components/Footer.jsx";
import Navbar from "../../../components/Navbar.jsx";
import { useEvent } from "../hooks/useEvent.js";
import { getEventMetadata } from "../services/event.api.js";

const Reader = ({ onDecoded, disabled = false }) => {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultHandledRef = useRef(false);
  const [status, setStatus] = useState("idle");
  const [scanError, setScanError] = useState("");

  const handleDecoded = useCallback(async (decodedText) => {
    if (resultHandledRef.current) return;
    resultHandledRef.current = true;
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
    }
    setStatus("idle");
    onDecoded(decodedText);
  }, [onDecoded]);

  useEffect(() => {
    const scanner = new Html5Qrcode("event-ticket-qr-reader", {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });
    scannerRef.current = scanner;

    return () => {
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      } else {
        scanner.clear();
      }
      scannerRef.current = null;
    };
  }, []);

  const startCamera = async () => {
    if (disabled) return;
    const scanner = scannerRef.current;
    if (!scanner) return;

    resultHandledRef.current = false;
    setScanError("");
    setStatus("starting");

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        throw new Error("No camera was found. Upload a QR image or enter the ticket ID manually.");
      }
      const preferredCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label));
      const camera = preferredCamera || cameras[0];

      await scanner.start(
        camera.id,
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        handleDecoded,
        () => {},
      );
      setStatus("scanning");
    } catch (err) {
      setStatus("idle");
      const message = err.name === "NotAllowedError" || err.name === "SecurityError"
        ? "Camera permission is blocked. Allow camera access in your browser settings, then try again."
        : err.name === "NotFoundError"
          ? "No camera was found. Upload a QR image or enter the ticket ID manually."
          : err.name === "NotReadableError"
            ? "The camera is busy in another app. Close that app and try again."
            : err.message || "Could not start the camera. Try uploading a QR image or enter the ticket ID manually.";
      setScanError(message);
    }
  };

  const stopCamera = async () => {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) {
      await scanner.stop().catch(() => {});
    }
    setStatus("idle");
  };

  const scanImageFile = async (file) => {
    if (!file || !scannerRef.current) return;
    setScanError("");
    resultHandledRef.current = false;
    setStatus("scanning");

    try {
      if (scannerRef.current.isScanning) await scannerRef.current.stop();
      const decodedText = await scannerRef.current.scanFile(file, false);
      setStatus("idle");
      handleDecoded(decodedText);
    } catch {
      setStatus("idle");
      setScanError("We couldn’t find a readable QR code in that image. Try a clearer image or enter the ticket ID manually.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            {status === "scanning" ? "Point the camera at the attendee’s QR code." : "Use your camera or upload a QR image."}
          </p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${status === "scanning" ? "bg-emerald-100 text-emerald-800" : status === "starting" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"}`}>
          {status === "scanning" ? "Camera on" : status === "starting" ? "Starting camera…" : "Ready"}
        </span>
      </div>

      <div className="relative mt-4 min-h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
        <div id="event-ticket-qr-reader" className="min-h-64 w-full" />
        {status !== "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex min-h-64 flex-col items-center justify-center px-5 text-center text-white">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-2xl" aria-hidden="true">⌗</span>
            <p className="mt-3 text-sm font-medium text-white/85">
              {status === "starting" ? "Connecting to camera…" : "Camera preview will appear here"}
            </p>
          </div>
        )}
      </div>

      {scanError && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{scanError}</p>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {status === "scanning" ? (
          <button type="button" onClick={stopCamera} className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
            Stop camera
          </button>
        ) : (
          <button type="button" onClick={startCamera} disabled={disabled || status === "starting"} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
            {status === "starting" ? "Starting camera…" : "Start camera"}
          </button>
        )}
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled || status === "starting" || status === "scanning"} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
          Upload QR image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => scanImageFile(event.target.files?.[0])}
        />
      </div>
    </div>
  );
};

const EventCheckIn = () => {
  const { eventId } = useParams();
  const { loading, error, handleListMyEvents, handleCheckInTicket } = useEvent();
  const [event, setEvent] = useState(null);
  const [eventName, setEventName] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
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
    } catch {
      setPageError("Could not read this QR code. Scan a ticket QR from My tickets.");
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
        <Link to="/events/mine" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">← My events</Link>
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
              <p className="mt-1 text-sm leading-6 text-slate-600">Scan the attendee’s QR code or upload an image of it.</p>
              <Reader onDecoded={handleDecoded} disabled={Boolean(event?.cancelled)} />
              <p className="mt-3 text-xs leading-5 text-slate-500">Camera access requires browser permission and a secure connection (HTTPS, or localhost during development). Manual ticket ID entry is also available below.</p>
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
