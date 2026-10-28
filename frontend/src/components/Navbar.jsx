import { useState } from "react";
import { Link } from "react-router";
import MobileNavigation from "./MobileNavigation.jsx";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const name = user?.username || user?.name || "Account";
  const shortWalletAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const handleConnectWallet = () => {
    connectWallet().catch(() => {});
  };

  const walletAction = (
    <>
      {isLinked ? (
        <span className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
          Wallet linked <span className="font-mono">{shortWalletAddress}</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={handleConnectWallet}
          disabled={connecting}
          className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70"
        >
          {connecting
            ? "Connecting…"
            : isConnected
              ? "Link wallet"
              : "Connect wallet"}
        </button>
      )}
      {walletError && (
        <p className="mt-2 text-xs leading-5 text-rose-600" role="alert">
          {walletError}
        </p>
      )}
    </>
  );

  const roleLinks = user?.role === "creator" ? (
    <>
      <Link
        to="/events/mine"
        onClick={closeMobileMenu}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
      >
        My events
      </Link>
      <Link
        to="/tickets/mine"
        onClick={closeMobileMenu}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
      >
        My tickets
      </Link>
      <Link
        to="/events/create"
        onClick={closeMobileMenu}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
      >
        Create event
      </Link>
    </>
  ) : user?.role === "attendee" ? (
    <>
      <Link
        to="/tickets/mine"
        onClick={closeMobileMenu}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
      >
        My tickets
      </Link>
      <Link
        to="/creator/request"
        onClick={closeMobileMenu}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
      >
        Become a creator
      </Link>
    </>
  ) : user?.role === "admin" ? (
    <Link
      to="/admin/creator-requests"
      onClick={closeMobileMenu}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
    >
      Creator requests
    </Link>
  ) : null;

  const signOutButton = (
    <button
      type="button"
      onClick={() => {
        closeMobileMenu();
        handleLogout();
      }}
      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      Sign out
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-2 px-2.5 py-3 min-[400px]:px-3 sm:px-6 lg:px-8"
      >
        <div className="flex min-w-0 items-center gap-3 min-[400px]:gap-4 sm:gap-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 sm:gap-3"
            aria-label="TicketApp home"
            onClick={closeMobileMenu}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200 sm:size-10 sm:rounded-xl" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="size-5 sm:size-6">
                <path d="M7 3.75h7l4 4V20a.25.25 0 0 1-.25.25h-10.5A.25.25 0 0 1 7 20V3.75Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="M14 4v4h4M9.5 13l1.7 1.7 3.5-3.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[15px] font-bold tracking-tight text-slate-900 min-[400px]:text-base sm:text-xl max-[359px]:hidden">
              TicketApp<span className="text-indigo-600">.</span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-3 min-[400px]:gap-4 md:gap-6">
            <Link to="/events" onClick={closeMobileMenu} className="whitespace-nowrap text-[10px] font-medium text-slate-600 transition hover:text-indigo-600 min-[400px]:text-[11px] sm:text-sm">
              Events
            </Link>
            <a href="/#how-it-works" onClick={closeMobileMenu} className="whitespace-nowrap text-[10px] font-medium text-slate-600 transition hover:text-indigo-600 min-[400px]:text-[11px] sm:text-sm">
              How it works
            </a>
            <a href="/#features" onClick={closeMobileMenu} className="whitespace-nowrap text-[10px] font-medium text-slate-600 transition hover:text-indigo-600 min-[400px]:text-[11px] sm:text-sm max-[520px]:hidden">
              Features
            </a>
          </div>
        </div>

        {user && (
          <div className="hidden items-center gap-3 md:flex">
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                <span>{name}</span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 transition group-open:rotate-180" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                  <p className="mt-0.5 text-xs capitalize text-slate-500">{user.role}</p>
                </div>
                <div className="py-2">{walletAction}</div>
                {roleLinks && <div className="border-t border-slate-100 py-2">{roleLinks}</div>}
                <div className="border-t border-slate-100 pt-2">{signOutButton}</div>
              </div>
            </details>
          </div>
        )}

        {user ? (
          <button
            type="button"
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        ) : (
          <Link
            to="/login"
            className="shrink-0 rounded-lg bg-indigo-600 px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 min-[400px]:px-2.5 min-[400px]:text-xs sm:px-4 sm:py-2 sm:text-sm"
          >
            Log in
          </Link>
        )}

      </nav>
      </header>
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
        user={user}
        name={name}
        walletAddress={walletAddress}
        isConnected={isConnected}
        isLinked={isLinked}
        connecting={connecting}
        walletError={walletError}
        connectWallet={connectWallet}
        handleLogout={handleLogout}
      />
    </>
  );
};

export default Navbar;
