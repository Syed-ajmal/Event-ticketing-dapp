import { Link } from "react-router";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 py-2.5 text-center text-xs text-slate-500 sm:px-6 md:flex-row md:justify-between md:gap-6 md:py-4 md:text-sm md:text-left lg:grid lg:grid-cols-3 lg:items-center lg:justify-normal lg:gap-6 lg:px-8">
        <Link
          to="/"
          className="w-fit text-base font-bold tracking-tight text-slate-900 transition hover:text-indigo-600 md:text-lg"
          aria-label="TicketApp home"
        >
          TicketApp<span className="text-indigo-600">.</span>
        </Link>

        <p className="max-w-full leading-5 md:leading-6 lg:col-start-2 lg:justify-self-center lg:whitespace-nowrap">
          © {new Date().getFullYear()} TicketApp. Discover events. Own your ticket.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
