import { createContext, useState } from "react";

export const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadataURI, setMetadataURI] = useState(null);
  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState([]);

  return (
    <EventContext.Provider
      value={{
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
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
