import { api } from "../../auth/services/auth.api.js";

const IPFS_GATEWAY = (
  import.meta.env.VITE_IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs"
).replace(/\/$/, "");

export function resolveIpfsUrl(uri) {
  if (typeof uri !== "string" || !uri.trim()) return null;

  const contentPath = uri.startsWith("ipfs://")
    ? uri.slice("ipfs://".length)
    : uri;

  if (contentPath.startsWith("http://") || contentPath.startsWith("https://")) {
    return contentPath;
  }

  return `${IPFS_GATEWAY}/${contentPath.replace(/^\/ipfs\//, "")}`;
}

export async function getMyEvents() {
  const response = await api.get("/api/event/mine");
  return response.data;
}

export async function getMyTickets() {
  const response = await api.get("/api/event/my-tickets");
  return response.data;
}

export async function getPublicEvents(page = 1) {
  const response = await api.get("/api/event", { params: { page } });
  return response.data;
}

export async function getEventMetadata(metadataURI) {
  const metadataURL = resolveIpfsUrl(metadataURI);
  if (!metadataURL) throw new Error("Event metadata URI is missing.");

  const response = await fetch(metadataURL);
  if (!response.ok) {
    throw new Error(`Could not load event metadata (${response.status}).`);
  }

  return response.json();
}

export async function uploadEventMetadata(metadata) {
  const response = await api.post("/api/event/metadata", { metadata });
  return response.data;
}

/**
 * Prepare an event creation transaction, or submit its hash to finish creation.
 * The backend distinguishes the two steps by whether transactionHash is set.
 */
export async function createEvent({
  startsAt,
  endsAt,
  ticketLimit,
  ticketPrice,
  metadataURI,
  transactionHash,
}) {
  const response = await api.post("/api/event/create-event", {
    startsAt,
    endsAt,
    ticketLimit,
    ticketPrice,
    metadataURI,
    ...(transactionHash ? { transactionHash } : {}),
  });

  return response.data;
}

/**
 * Prepare an event cancellation transaction, or submit its hash to finish it.
 */
export async function cancelEvent(eventId, transactionHash) {
  const response = await api.patch(`/api/event/${eventId}/cancel`,
    transactionHash ? { transactionHash } : {},
  );

  return response.data;
}

export async function claimEventTicket(eventId, transactionHash) {
  const response = await api.post(
    `/api/event/${eventId}/claim-ticket`,
    transactionHash ? { transactionHash } : {},
  );

  return response.data;
}

export async function checkInEventTicket(eventId, ticketId, transactionHash) {
  const response = await api.post(`/api/event/${eventId}/check-in`, {
    ticketId: String(ticketId),
    ...(transactionHash ? { transactionHash } : {}),
  });

  return response.data;
}

export async function refundEventTicket(eventId, ticketId, transactionHash) {
  const response = await api.post(`/api/event/${eventId}/refund-ticket`, {
    ticketId: String(ticketId),
    ...(transactionHash ? { transactionHash } : {}),
  });

  return response.data;
}

export async function withdrawEventProceeds(eventId, transactionHash) {
  const response = await api.post(
    `/api/event/${eventId}/withdraw-proceeds`,
    transactionHash ? { transactionHash } : {},
  );

  return response.data;
}
