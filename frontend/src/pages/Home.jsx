import React from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <Navbar />


      <section className="relative isolate overflow-hidden bg-[#111936]">
        <div className="absolute -right-24 -top-36 -z-10 size-[32rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 -z-10 size-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-indigo-200">
              <span className="size-2 rounded-full bg-emerald-400" /> Your next great night starts here
            </div>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">Find your people.<br /><span className="text-indigo-300">Get in with confidence.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Discover live events, book tickets, and keep verifiable proof of entry in your wallet. Ticket ownership is secured on the blockchain.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/events" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400">Explore events <span aria-hidden="true">→</span></Link>
              <a href="#features" className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10">How it works</a>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
              <div className="flex -space-x-2" aria-hidden="true">
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#111936] bg-violet-300 text-xs font-bold text-violet-900">A</span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#111936] bg-cyan-200 text-xs font-bold text-cyan-900">M</span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#111936] bg-amber-200 text-xs font-bold text-amber-900">J</span>
              </div>
              <span>Live events, secure tickets, simple entry</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-indigo-500/30 to-cyan-400/10 blur-2xl" />
            <div className="relative rotate-1 rounded-2xl border border-white/20 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between">
                <div className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true"><path d="M12 3.5 14.2 5l2.7-.1.8 2.6 2.2 1.6-.8 2.6.8 2.6-2.2 1.6-.8 2.6-2.7-.1L12 20l-2.2-1.5-2.7.1-.8-2.6-2.2-1.6.8-2.6-.8-2.6 2.2-1.6.8-2.6 2.7.1L12 3.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Verified ticket</span>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-slate-400">YOUR EVENT PASS</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Blockchain Summer Festival</h2>
              <p className="mt-2 text-sm text-slate-500">Admit one · <span className="font-semibold text-slate-700">Alex Morgan</span></p>
              <div className="my-6 h-px bg-slate-100" />
              <div className="flex items-center justify-between text-xs text-slate-500"><span>EVENT ORGANIZER</span><span>EVENT DATE</span></div>
              <div className="mt-1 flex items-center justify-between text-sm font-semibold text-slate-700"><span>Northstar Live</span><span>Aug 24, 2026</span></div>
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm"><svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true"><path d="M12 3v18m-6-15h9a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></span>
                <div className="min-w-0"><p className="text-xs font-semibold text-slate-700">Ticket secured on-chain</p><p className="truncate font-mono text-[10px] text-slate-400">Token #1842 · Ownership verified</p></div>
                <span className="ml-auto size-2 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-5 text-center text-[11px] text-slate-400">A preview of your digital ticket</p>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-slate-100 bg-white p-4 shadow-xl sm:block">
              <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">✓</span><div><p className="text-xs font-bold text-slate-800">Ready for check-in</p><p className="text-[11px] text-slate-500">Scan your ticket at the venue</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-600">A better way to go out</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Your ticket, secured on-chain</h2><p className="mt-4 leading-7 text-slate-600">Buy directly from event creators, keep your ticket in your wallet, and verify it at the door.</p></div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { icon: "⌁", title: "Genuine tickets", text: "On-chain ownership helps make every ticket verifiable and harder to counterfeit." },
            { icon: "◎", title: "Easy check-in", text: "Present your ticket for a quick ownership check at the venue." },
            { icon: "↗", title: "Your ticket, your wallet", text: "Keep your event passes together and access them when you need them." },
          ].map((feature) => <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><span className="grid size-12 place-items-center rounded-xl bg-indigo-50 text-2xl font-semibold text-indigo-600">{feature.icon}</span><h3 className="mt-5 text-lg font-bold text-slate-900">{feature.title}</h3><p className="mt-2 leading-6 text-slate-600">{feature.text}</p></article>)}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div><p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-600">Simple by design</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Three steps to your next event</h2><p className="mt-4 leading-7 text-slate-600">Discover an event, claim your ticket, and show it at the door. Blockchain handles ticket ownership behind the scenes.</p></div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[["01", "Discover", "Find an event you want to attend."], ["02", "Get your ticket", "Purchase a ticket and receive it in your wallet."], ["03", "Check in", "Present your ticket for verification at check-in."]].map(([number, title, text]) => <article key={number} className="rounded-2xl bg-[#f5f7fb] p-5"><span className="text-sm font-bold text-indigo-600">{number}</span><h3 className="mt-5 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Home;
