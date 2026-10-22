import { Link } from "react-router";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-2 px-6 py-3 text-sm text-slate-500 sm:grid-cols-3 sm:items-center lg:px-8">
        <Link
          to="/"
          className="w-fit text-lg font-bold tracking-tight text-slate-900 transition hover:text-indigo-600"
          aria-label="TicketApp home"
        >
          TicketApp<span className="text-indigo-600">.</span>
        </Link>


        <p className="text-center sm:col-start-2">
          © {new Date().getFullYear()} TicketApp. Discover events. Own your ticket.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
