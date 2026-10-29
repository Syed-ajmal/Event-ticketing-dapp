import { Link } from "react-router";
import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";

const StepHeading = ({ number, title, children }) => (
  <div className="flex items-start gap-4">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
      {number}
    </span>
    <div>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
      {children && <p className="mt-2 leading-7 text-slate-600">{children}</p>}
    </div>
  </div>
);

const GuideSectionHeading = ({ eyebrow, title, description }) => (
  <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
    </div>
    <p className="max-w-xl text-sm leading-6 text-slate-600">{description}</p>
  </div>
);

const ExternalLink = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-500"
  >
    {children} <span aria-hidden="true">↗</span>
  </a>
);

const Guide = () => (
  <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
    <Navbar />

    <section className="relative isolate overflow-hidden bg-[#111936]">
      <div className="absolute -right-24 -top-36 -z-10 size-[32rem] rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-48 left-1/3 -z-10 size-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-300">TicketApp guide</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Your first ticket, from setup to check-in
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          Follow these steps to create an account, set up a wallet on Sepolia, claim a ticket, or apply to host an event.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400">Create an account</Link>
          <Link to="/events" className="rounded-xl border border-white/25 px-5 py-3 font-semibold text-white transition hover:bg-white/10">Explore events</Link>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-amber-100/90">
          This app is currently configured for the Sepolia test network. Sepolia ETH is test money for transactions and has no real-world value.
        </p>
      </div>
    </section>

    <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Guide sections" className="mb-10 grid gap-3 sm:grid-cols-3">
        <a href="#getting-started" className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Steps 01–04</span>
          <span className="mt-1 block text-lg font-bold text-slate-900">Get started</span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">Account, MetaMask, test ETH, and wallet linking</span>
        </a>
        <a href="#attend-event" className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Step 05</span>
          <span className="mt-1 block text-lg font-bold text-slate-900">Attend an event</span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">Claim a ticket and show its QR code</span>
        </a>
        <a href="#host-event" className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Steps 06–07</span>
          <span className="mt-1 block text-lg font-bold text-slate-900">Host an event</span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">Request creator access, publish, and check in</span>
        </a>
      </nav>

      <div className="space-y-10">
        <section id="getting-started" className="scroll-mt-24">
          <GuideSectionHeading eyebrow="First, set up" title="Get started" description="Create your account, prepare MetaMask on Sepolia, and link your wallet." />
          <div className="space-y-5">
        <article id="account" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <StepHeading number="01" title="Create your TicketApp account">
            Your TicketApp account and your wallet are separate. Start by creating an account with a username, email, and password, then log in. New accounts start as attendees.
          </StepHeading>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">Register</Link>
            <Link to="/login" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Log in</Link>
          </div>
        </article>

        <article id="wallet" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <StepHeading number="02" title="Install MetaMask">
            On a computer, install the browser extension. On a phone, install MetaMask from your device’s official app store and open TicketApp inside MetaMask’s built-in browser.
          </StepHeading>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Go to <ExternalLink href="https://metamask.io/download/">the official MetaMask download page</ExternalLink> and select your browser or phone.</li>
            <li>Finish setup and create or import a wallet. Follow MetaMask’s guidance to protect your recovery phrase.</li>
            <li>Only install from the official site or the official app store listing. TicketApp will never ask for your recovery phrase or private key.</li>
          </ol>
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            If you already have another wallet, this version of TicketApp connects through MetaMask. Keep the same wallet account available when you return to the site.
          </p>
        </article>

        <article id="sepolia" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <StepHeading number="03" title="Select Sepolia and get test ETH">
            The app’s contract runs on Sepolia. In MetaMask, open the network selector and choose Sepolia. If it is missing, open MetaMask’s network settings and turn on “Show test networks.”
          </StepHeading>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            You need a small amount of Sepolia ETH to pay test transaction fees and, for paid events, the displayed ticket price. Copy your public wallet address from MetaMask, open a faucet, and request Sepolia ETH to that address. A faucet may require sign-in or have request limits.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <ExternalLink href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia">Google Cloud Sepolia faucet</ExternalLink>
            <ExternalLink href="https://www.alchemy.com/faucets/ethereum-sepolia">Alchemy Sepolia faucet</ExternalLink>
            <ExternalLink href="https://ethereum.org/developers/docs/networks/">Ethereum network and faucet list</ExternalLink>
          </div>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Use only testnet ETH here. It is not real money and cannot be used as mainnet ETH. A faucet only needs your public address—never enter your recovery phrase or private key.
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            MetaMask’s steps for displaying test networks are in its <ExternalLink href="https://support.metamask.io/configure/networks/how-to-view-testnets-in-metamask/">official help guide</ExternalLink>. Sepolia is listed by Ethereum.org as a test network for application development.
          </p>
        </article>

        <article id="connect" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <StepHeading number="04" title="Connect your wallet to your account">
            Log in to TicketApp, open the account or menu area in the navigation bar, and choose “Connect wallet.” Approve the connection in MetaMask, then sign the message to link that address to your TicketApp account.
          </StepHeading>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Use the wallet account you plan to use for tickets or creator actions.</li>
            <li>Signing the link message verifies that you control the address; it is not an on-chain transaction and does not spend ETH.</li>
            <li>If the account in MetaMask changes, reconnect the wallet linked to your TicketApp account.</li>
          </ul>
        </article>
          </div>
        </section>

        <section id="attend-event" className="scroll-mt-24">
          <GuideSectionHeading eyebrow="For attendees" title="Attend an event" description="Browse public events, claim a ticket, and bring its QR code to the entrance." />
          <div className="space-y-5">
        <article id="tickets" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <StepHeading number="05" title="Find an event and claim a ticket">
            Open <Link to="/events" className="font-semibold text-indigo-700 underline underline-offset-4">Explore events</Link>. You can browse without logging in, but claiming requires a logged-in attendee or creator account and its linked wallet.
          </StepHeading>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Choose an upcoming event and check its date, ticket price, and remaining tickets.</li>
            <li>Log in, connect the wallet linked to your account, and select “Claim ticket.”</li>
            <li>Review and confirm the transaction in MetaMask. Wait for confirmation before leaving the page.</li>
            <li>Open <Link to="/tickets/mine" className="font-semibold text-indigo-700 underline underline-offset-4">My tickets</Link>, then choose “Show QR” at the venue entrance.</li>
          </ol>
          <p className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-900">
            The creator can also claim a ticket like an attendee. If the event is cancelled, its ticket card will offer the refund action when available.
          </p>
        </article>
          </div>
        </section>

        <section id="host-event" className="scroll-mt-24">
          <GuideSectionHeading eyebrow="For organizers" title="Host an event" description="Apply for creator access, publish an event, then manage proceeds and check in attendees." />
          <div className="space-y-5">
        <article id="creator" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <StepHeading number="06" title="Apply to become a creator">
            Creator access is reviewed. First connect a wallet to your attendee account, then use “Become a creator” in the account menu.
          </StepHeading>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Enter your organization or event brand name and describe the events you plan to host.</li>
            <li>Submit the request and wait for an administrator to review it.</li>
            <li>After approval, your account role becomes Creator. If the menu still shows Attendee, log out and back in to refresh your session.</li>
          </ol>
          <Link to="/creator/request" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">Request creator access</Link>
        </article>

        <article id="manage" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <StepHeading number="07" title="Create, manage, and check in an event">
            Once approved, use “Create event” to publish an event. Creator actions require the wallet linked to your creator account and Sepolia ETH for on-chain transactions.
          </StepHeading>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li><strong className="text-slate-800">Create:</strong> enter the title, description, venue, start and end times, ticket limit, and ticket price in ETH. Choose a poster image from your device; TicketApp uploads it and the event metadata for you. Confirm the create transaction in MetaMask.</li>
            <li><strong className="text-slate-800">Manage:</strong> open <Link to="/events/mine" className="font-semibold text-indigo-700 underline underline-offset-4">My events</Link> to see your event cards. Cancel an event when needed. Available proceeds can be withdrawn after the event ends.</li>
            <li><strong className="text-slate-800">Check in:</strong> the check-in button becomes available starting two hours before the event and remains available through its end. Open it, scan the attendee’s ticket QR with the camera, upload a QR image, or enter the ticket ID manually; then confirm the check-in transaction.</li>
          </ul>
        </article>
          </div>
        </section>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Quick fixes</h2>
          <dl className="mt-4 space-y-4 text-sm leading-6">
            <div><dt className="font-semibold text-slate-800">The app says no wallet is found.</dt><dd className="text-slate-600">Enable the MetaMask extension, or open TicketApp inside MetaMask’s mobile browser.</dd></div>
            <div><dt className="font-semibold text-slate-800">The transaction is likely to fail or the network is wrong.</dt><dd className="text-slate-600">Select Sepolia in MetaMask, make sure the linked address is selected, and check that the wallet has Sepolia test ETH.</dd></div>
            <div><dt className="font-semibold text-slate-800">I cannot create an event.</dt><dd className="text-slate-600">Your creator request must be approved, and the active wallet must match the wallet linked to that account.</dd></div>
          </dl>
        </article>

        <div className="flex flex-wrap gap-3 pb-4">
          <Link to="/events" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">Explore events</Link>
          <Link to="/" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Back to home</Link>
        </div>
      </div>
    </section>

    <Footer />
  </main>
);

export default Guide;
