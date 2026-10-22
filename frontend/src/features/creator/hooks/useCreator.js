import { useState } from "react";
import { submitCreatorRequest } from "../services/creator.api.js";

export const useCreator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);

  const handleRequest = async ({ orgName, message }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await submitCreatorRequest({ orgName, message });
      setRequest(data.request);
      return data;
    } catch (err) {
      const messageText =
        err.response?.data?.message ||
        err.message ||
        "Could not submit creator request.";
      setError(messageText);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { handleRequest, request, loading, error };
};
