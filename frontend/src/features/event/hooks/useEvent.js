import { useCallback, useContext } from "react";
import { EventContext } from "../event.context.jsx";
import { useWallet } from "../../wallet/hooks/useWallet.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import {
  cancelEvent as cancelEventRequest,
  claimEventTicket,
  createEvent,
  getMyEvents,
  getPublicEvents,
  uploadEventMetadata,
} from "../services/event.api.js";

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

  throw new Error("The transaction is still pending. Please try again shortly.");
};

export const useEvent = () => {
  const context = useContext(EventContext);
  const { walletAddress, isLinked } = useWallet();
  const { user } = useAuth();

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

  const handleListPublicEvents = useCallback(
    (page = 1) => runRequest(() => getPublicEvents(page)),
    [runRequest],
  );

  const handleCreateEvent = async (details) => {
    const data = await runRequest(() => createEvent(details));
    if (data?.event) setEvent(data.event);
    return data;
  };

  const handleCancelEvent = async (eventId) => {
    setLoading(true);
    setError(null);

    try {
      if (!walletAddress || !isLinked) {
        throw new Error("Connect the wallet linked to your creator account to cancel this event.");
      }

      const ethereum = window.ethereum;
      if (!ethereum?.request) {
        throw new Error("No browser wallet found. Install or enable one to continue.");
      }

      const prepared = await cancelEventRequest(eventId);
      if (!prepared?.transaction) {
        if (prepared?.event) {
          setEvent(prepared.event);
          setEvents((current) =>
            current.map((item) =>
              item.eventId === prepared.event.eventId ? prepared.event : item,
            ),
          );
        }
        return prepared;
      }

      const [account] = await ethereum.request({ method: "eth_requestAccounts" });
      if (!account || account.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Switch your wallet to the address linked to your creator account.");
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
        params: [{
          from: account,
          to: prepared.transaction.to,
          data: prepared.transaction.data,
        }],
      });

      await waitForTransactionReceipt(ethereum, transactionHash);
      const result = await cancelEventRequest(eventId, transactionHash);
      if (result?.event) {
        setEvent(result.event);
        setEvents((current) =>
          current.map((item) =>
            item.eventId === result.event.eventId ? result.event : item,
          ),
        );
      }
      return result;
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Could not cancel event.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (eventId) => {
    setError(null);

    try {
      if (!user) throw new Error("Log in before claiming a ticket.");
      if (user.role !== "attendee") {
        throw new Error("Only attendee accounts can claim tickets.");
      }
      if (!walletAddress || !isLinked) {
        throw new Error("Link a wallet to your attendee account before claiming.");
      }

      const ethereum = window.ethereum;
      if (!ethereum?.request) {
        throw new Error("No browser wallet found. Install or enable one to continue.");
      }

      const prepared = await claimEventTicket(eventId);
      if (!prepared?.transaction) return prepared;

      const [account] = await ethereum.request({ method: "eth_requestAccounts" });
      const expectedWallet = prepared.walletAddress || walletAddress;
      if (!account || account.toLowerCase() !== expectedWallet.toLowerCase()) {
        throw new Error("Switch your wallet to the address linked to your attendee account.");
      }

      const expectedChainId = `0x${BigInt(prepared.transaction.chainId).toString(16)}`;
      const currentChainId = await ethereum.request({ method: "eth_chainId" });
      if (currentChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: expectedChainId }],
        });
      }

      const transaction = {
        from: account,
        to: prepared.transaction.to,
        data: prepared.transaction.data,
      };
      if (prepared.transaction.value !== undefined) {
        transaction.value = `0x${BigInt(prepared.transaction.value).toString(16)}`;
      }

      const transactionHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [transaction],
      });

      await waitForTransactionReceipt(ethereum, transactionHash);
      return await claimEventTicket(eventId, transactionHash);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Could not claim ticket.",
      );
      return null;
    }
  };

  return {
    event,
    events,
    metadataURI,
    loading,
    error,
    handleUploadMetadata,
    handleListMyEvents,
    handleListPublicEvents,
    handleCreateEvent,
    handleCancelEvent,
    handleClaimTicket,
  };
};
