import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/auth.context.jsx";
import { WalletContext } from "../context/wallet.context.jsx";
import {
  getWalletNonce,
  linkWallet,
} from "../services/wallet.api.js";

export const useWallet = () => {
  const walletContext = useContext(WalletContext);
  const authContext = useContext(AuthContext);

  if (!walletContext) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  if (!authContext) {
    throw new Error("useWallet must be used within an AuthProvider");
  }

  const {
    walletAddress,
    setWalletAddress,
    activeAddress,
    setActiveAddress,
    isConnected,
  } = walletContext;
  const { user, setUser, loading: authLoading } = authContext;
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setWalletAddress(user?.walletAddress ?? null);
  }, [setWalletAddress, user?.walletAddress]);

  useEffect(() => {
    const ethereum = window.ethereum;

    if (!ethereum?.request) {
      return undefined;
    }

    let mounted = true;

    const restoreActiveAccount = async () => {
      try {
        const [address] = await ethereum.request({ method: "eth_accounts" });
        if (mounted) {
          setActiveAddress(address ?? null);
        }
      } catch {
        if (mounted) {
          setActiveAddress(null);
        }
      }
    };

    const handleAccountsChanged = (accounts) => {
      setActiveAddress(accounts[0] ?? null);
    };

    restoreActiveAccount();
    ethereum.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      mounted = false;
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [setActiveAddress]);

  const connectWallet = useCallback(async () => {
    setError(null);

    if (authLoading) {
      throw new Error("Please wait while your account is loading.");
    }

    if (!user) {
      const message = "Log in before connecting a wallet.";
      setError(message);
      throw new Error(message);
    }

    if (!window.ethereum) {
      const message = "No browser wallet found. Install or enable one to continue.";
      setError(message);
      throw new Error(message);
    }

    setConnecting(true);

    try {
      const [address] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!address) {
        throw new Error("No wallet account was selected.");
      }

      setActiveAddress(address);

      const nonceData = await getWalletNonce();
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [nonceData.messageToSign, address],
      });

      const result = await linkWallet({ walletAddress: address, signature });
      const linkedAddress = result.walletAddress;

      setWalletAddress(linkedAddress);
      setUser((currentUser) =>
        currentUser ? { ...currentUser, walletAddress: linkedAddress } : currentUser,
      );

      return result;
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Unable to connect wallet.",
      );
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [authLoading, setActiveAddress, setUser, setWalletAddress, user]);

  const clearError = useCallback(() => setError(null), []);

  return {
    walletAddress,
    activeAddress,
    isConnected,
    isLinked: Boolean(
      walletAddress &&
        activeAddress &&
        walletAddress.toLowerCase() === activeAddress.toLowerCase(),
    ),
    connecting,
    error,
    connectWallet,
    clearError,
  };
};
