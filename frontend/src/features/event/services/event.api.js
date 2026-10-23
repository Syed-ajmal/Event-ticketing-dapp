import { api } from "../../auth/services/auth.api.js";

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
