import { api } from "../../auth/services/auth.api.js";

export async function submitCreatorRequest({ orgName, message }) {
  const response = await api.post("/api/creators/request", {
    orgName,
    message,
  });

  return response.data;
}

export async function getPendingCreatorRequests() {
  const response = await api.get("/api/creators/pending");
  return response.data;
}

export async function prepareCreatorApproval(requestId) {
  const response = await api.patch(`/api/creators/${requestId}/approve`);
  return response.data;
}

export async function confirmCreatorApproval(requestId, transactionHash) {
  const response = await api.patch(`/api/creators/${requestId}/approve`, {
    transactionHash,
  });
  return response.data;
}
