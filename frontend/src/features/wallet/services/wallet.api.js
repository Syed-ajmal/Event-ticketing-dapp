import { api } from "../../auth/services/auth.api.js";

/** Request a one-time nonce that the user must sign to link their wallet. */
export async function getWalletNonce() {
  const response = await api.post("/api/auth/wallet/nonce");
  return response.data;
}

/** Submit the signed nonce and wallet address to link the wallet to the account. */
export async function linkWallet({ walletAddress, signature }) {
  const response = await api.post("/api/auth/wallet/link", {
    walletAddress,
    signature,
  });
  return response.data;
}
