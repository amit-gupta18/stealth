function SearchBar({ value, onChange, connected }) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by title..."
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
      />
      <span
        className={`w-fit rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
          connected
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-rose-50 text-rose-700 ring-rose-200'
        }`}
      >
        {connected ? 'WebSocket: connected' : 'WebSocket: disconnected'}
      </span>
    </div>
  )
}

export default SearchBar;
