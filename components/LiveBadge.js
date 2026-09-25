// Blue means live, as it does everywhere else in the app; amber asks for
// attention. The text says the same thing, so colour is never the only signal.
const STATES = {
  connecting: { label: 'Connecting…', dot: 'bg-slate-400' },
  live: { label: 'Live', dot: 'bg-blue-600' },
  offline: { label: 'Reconnecting…', dot: 'bg-amber-500' },
};

export function LiveBadge({ connection }) {
  const { label, dot } = STATES[connection];

  return (
    <p
      role="status"
      className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700"
    >
      <span aria-hidden="true" className={`size-2.5 rounded-full ${dot}`} />
      {label}
    </p>
  );
}
