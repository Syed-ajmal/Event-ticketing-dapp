import { useCallback, useContext } from "react";
import { EventContext } from "../event.context.jsx";
import {
  cancelEvent,
  createEvent,
  getMyEvents,
  uploadEventMetadata,
} from "../services/event.api.js";

export const useEvent = () => {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }

  const {
    loading,
    setLoading,
    error,
    setError,
    metadataURI,
    setMetadataURI,
    event,
    setEvent,
    events,
    setEvents,
  } = context;

  const runRequest = useCallback(async (request) => {
    setLoading(true);
    setError(null);

    try {
      return await request();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Event request failed.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading]);

  const handleUploadMetadata = async (metadata) => {
    const data = await runRequest(() => uploadEventMetadata(metadata));
    if (data?.metadataURI) setMetadataURI(data.metadataURI);
    return data;
  };

  const handleListMyEvents = useCallback(async () => {
    const data = await runRequest(getMyEvents);
    if (data?.events) setEvents(data.events);
    return data?.events ?? null;
  }, [runRequest, setEvents]);

  const handleCreateEvent = async (details) => {
    const data = await runRequest(() => createEvent(details));
    if (data?.event) setEvent(data.event);
    return data;
  };

  const handleCancelEvent = async (eventId, transactionHash) => {
    const data = await runRequest(() => cancelEvent(eventId, transactionHash));
    if (data?.event) setEvent(data.event);
    return data;
  };

  return {
    event,
    events,
    metadataURI,
    loading,
    error,
    handleUploadMetadata,
    handleListMyEvents,
    handleCreateEvent,
    handleCancelEvent,
  };
};
