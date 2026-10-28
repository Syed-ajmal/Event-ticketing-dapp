import axios from "axios";
import config from "../config/config.js";

export async function uploadEventImage(buffer, { filename, mimeType }) {
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: mimeType }), filename);
  formData.append("network", "public");

  let result;
  try {
    const response = await axios.post(
      "https://uploads.pinata.cloud/v3/files",
      formData,
      { headers: { Authorization: `Bearer ${config.PINATA_JWT}` } },
    );
    result = response.data;
  } catch (error) {
    const detail = error.response?.data?.error?.reason ?? error.response?.data?.message;
    const status = error.response?.status;
    throw new Error(detail || `Pinata upload failed${status ? ` with status ${status}` : ""}`);
  }

  const cid = result?.data?.cid;
  if (typeof cid !== "string" || cid.length === 0) {
    throw new Error("Pinata response did not include a CID");
  }
  return `ipfs://${cid}`;
}

export async function uploadEventMetadata(metadata) {
  const formData = new FormData();
  const metadataFile = new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  });
  formData.append("file", metadataFile, "event-metadata.json");
  formData.append("network", "public");

  let result;
  try {
    const response = await axios.post(
      "https://uploads.pinata.cloud/v3/files",
      formData,
      { headers: { Authorization: `Bearer ${config.PINATA_JWT}` } },
    );
    result = response.data;
  } catch (error) {
    const detail = error.response?.data?.error?.reason ?? error.response?.data?.message;
    const status = error.response?.status;
    throw new Error(detail || `Pinata upload failed${status ? ` with status ${status}` : ""}`);
  }

  const cid = result?.data?.cid;
  if (typeof cid !== "string" || cid.length === 0) {
    throw new Error("Pinata response did not include a CID");
  }
  return `ipfs://${cid}`;
}
