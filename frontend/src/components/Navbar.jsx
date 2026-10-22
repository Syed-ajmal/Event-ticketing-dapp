import { Link } from "react-router";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useWallet } from "../features/wallet/hooks/useWallet";

const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const {
    walletAddress,
    isConnected,
    isLinked,
    connecting,
    error: walletError,
    connectWallet,
  } = useWallet();
  const name = user?.username || user?.name;
  const shortWalletAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
      >
        <Link to="/" className="flex items-center gap-3" aria-label="TicketApp home">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="size-6">
              <path d="M7 3.75h7l4 4V20a.25.25 0 0 1-.25.25h-10.5A.25.25 0 0 1 7 20V3.75Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="M14 4v4h4M9.5 13l1.7 1.7 3.5-3.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            TicketApp<span className="text-indigo-600">.</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <a href="/#how-it-works" className="hidden text-sm font-medium text-slate-600 transition hover:text-indigo-600 sm:inline">
            How it works
          </a>
          <a href="/#features" className="hidden text-sm font-medium text-slate-600 transition hover:text-indigo-600 sm:inline">
            Features
          </a>
          {user ? (
            <>
              {name && (
                <span className="hidden border-l border-slate-200 pl-5 text-sm text-slate-600 md:inline">
                  Hi, {name}
                </span>
              )}
              <div className="flex flex-col items-end">
                {isLinked ? (
                  <span
                    title={`Wallet connected: ${walletAddress}`}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                  >
                    <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span className="font-mono text-xs sm:text-sm">{shortWalletAddress}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => connectWallet().catch(() => {})}
                    disabled={connecting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-70"
                  >
                    {connecting
                      ? "Connecting…"
                      : isConnected
                        ? "Link wallet"
                        : "Connect wallet"}
                  </button>
                )}
                {walletError && (
                  <span className="mt-1 max-w-48 text-right text-xs text-rose-600" role="alert">
                    {walletError}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
