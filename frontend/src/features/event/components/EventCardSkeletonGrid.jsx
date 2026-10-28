const EventCardSkeletonGrid = ({
  cardHeight = "min-h-[460px]",
  label = "Loading event cards",
}) => (
  <div
    className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
    role="status"
    aria-label={label}
  >
    <span className="sr-only">{label}…</span>
    {Array.from({ length: 3 }, (_, index) => (
      <div
        key={index}
        aria-hidden="true"
        className={`relative ${cardHeight} animate-pulse overflow-hidden rounded-2xl bg-slate-300 shadow-lg shadow-slate-900/10`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-700/55 via-slate-500/10 to-transparent" />
        <div className="absolute left-5 right-5 top-5 flex justify-between gap-3">
          <span className="h-6 w-20 rounded-full bg-white/60" />
          <span className="h-6 w-24 rounded-full bg-white/40" />
        </div>
        <div className="absolute inset-x-5 bottom-5">
          <span className="mb-3 block h-7 w-2/3 rounded-md bg-white/65" />
          <span className="mb-2 block h-3 w-full rounded bg-white/45" />
          <span className="mb-4 block h-3 w-4/5 rounded bg-white/40" />
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/20 bg-slate-950/20 p-3">
            <span className="h-8 rounded bg-white/25" />
            <span className="h-8 rounded bg-white/25" />
            <span className="h-8 rounded bg-white/25" />
            <span className="h-8 rounded bg-white/25" />
          </div>
          <span className="mt-4 block h-10 rounded-lg bg-white/45" />
        </div>
      </div>
    ))}
  </div>
);

export default EventCardSkeletonGrid;
