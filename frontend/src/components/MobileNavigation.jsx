import { createPortal } from "react-dom";
import { Link } from "react-router";

const MobileNavigation = ({
  isOpen,
  onClose,
  user,
  name,
  walletAddress,
  isConnected,
  isLinked,
  connecting,
  walletError,
  connectWallet,
  handleLogout,
}) => {
  if (!isOpen) return null;

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 65,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 9998,
        }}
        className="bg-slate-950/30 md:hidden"
      />
      <aside
        id="mobile-navigation"
        aria-label="Mobile navigation"
        style={{
          position: "fixed",
          top: 65,
          right: 0,
          zIndex: 9999,
          width: "min(22rem, 85vw)",
          height: "max-content",
          maxHeight: "calc(100vh - 65px)",
        }}
        className="overflow-y-auto border-l border-slate-200 bg-white px-5 py-6 shadow-2xl md:hidden"
      >
        <nav className="flex flex-col gap-1">
          {user ? (
            <>
              <div className="my-3 border-t border-slate-100" />
              <div className="px-3 py-3">
                <p className="text-sm font-semibold text-slate-900">{name}</p>
                <p className="mt-0.5 text-xs capitalize text-slate-500">{user.role}</p>
              </div>
              <div className="px-3 py-2">
                {isLinked ? (
                  <span className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    Wallet linked <span className="font-mono">{shortAddress}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => connectWallet().catch(() => {})}
                    disabled={connecting}
                    className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
                  >
                    {connecting ? "Connecting…" : isConnected ? "Link wallet" : "Connect wallet"}
                  </button>
                )}
                {walletError && <p className="mt-2 text-xs text-rose-600" role="alert">{walletError}</p>}
              </div>
              {user.role === "creator" && (
                <>
                  <Link to="/events/mine" onClick={onClose} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Your events
                  </Link>
                  <Link to="/events/create" onClick={onClose} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Create event
                  </Link>
                </>
              )}
              {user.role === "attendee" && (
                <Link to="/creator/request" onClick={onClose} className="rounded-lg font-semibold px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  Become a creator
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin/creator-requests" onClick={onClose} className="rounded-lg px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  Creator requests
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleLogout();
                }}
                className="rounded-lg px-3 py-3 mb-5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={onClose} className="mt-2 rounded-lg bg-indigo-600 px-3 py-3 text-center text-sm font-semibold text-white">
              Log in
            </Link>
          )}
        </nav>
      </aside>
    </>,
    document.body,
  );
};

export default MobileNavigation;
