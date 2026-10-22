import { createContext, useMemo, useState } from "react";

export const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [activeAddress, setActiveAddress] = useState(null);

  const value = useMemo(
    () => ({
      walletAddress,
      setWalletAddress,
      activeAddress,
      setActiveAddress,
      isConnected: Boolean(activeAddress),
    }),
    [walletAddress, activeAddress],
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

