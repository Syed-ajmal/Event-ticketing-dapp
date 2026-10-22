import { useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import {
  confirmCreatorApproval,
  prepareCreatorApproval,
} from "../services/creator.api.js";

const waitForTransactionReceipt = async (ethereum, transactionHash) => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const receipt = await ethereum.request({
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    });

    if (receipt) {
      if (BigInt(receipt.status) === 0n) {
        throw new Error("The wallet transaction failed on chain.");
      }

      return receipt;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("The transaction is still pending. Please try verifying it again shortly.");
};

export const useCreatorApproval = () => {
  const { user, loading: authLoading } = useAuth();
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [error, setError] = useState(null);

  const handleApproveRequest = async (requestId) => {
    setError(null);

    if (authLoading) {
      setError("Please wait while your account is loading.");
      return null;
    }

    if (!user?.walletAddress) {
      setError("Your admin account needs a linked wallet to approve requests.");
      return null;
    }

    const ethereum = window.ethereum;
    if (!ethereum?.request) {
      setError("No browser wallet found. Install or enable one to continue.");
      return null;
    }

    setApprovingRequestId(requestId);

    try {
      const prepared = await prepareCreatorApproval(requestId);

      // The backend finalizes approval directly if the role was already granted.
      if (!prepared.transaction) {
        return prepared;
      }

      const [adminAddress] = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (
        !adminAddress ||
        adminAddress.toLowerCase() !== user.walletAddress.toLowerCase()
      ) {
        throw new Error("Switch your wallet to the address linked to your admin account.");
      }

      const expectedChainId = `0x${BigInt(prepared.transaction.chainId).toString(16)}`;
      const currentChainId = await ethereum.request({ method: "eth_chainId" });

      if (currentChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: expectedChainId }],
        });
      }

      const transactionHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: adminAddress,
            to: prepared.transaction.to,
            data: prepared.transaction.data,
          },
        ],
      });

      await waitForTransactionReceipt(ethereum, transactionHash);
      return await confirmCreatorApproval(requestId, transactionHash);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Could not approve creator request.",
      );
      return null;
    } finally {
      setApprovingRequestId(null);
    }
  };

  return { handleApproveRequest, approvingRequestId, error };
};
