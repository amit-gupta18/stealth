function SearchBar({ value, onChange, connected }) {
  return (
    <div className="search-wrap">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by title..."
        className="search-input"
      />
      <span className={`status ${connected ? 'online' : 'offline'}`}>
        {connected ? 'WebSocket: connected' : 'WebSocket: disconnected'}
      </span>
    </div>
  );
}

export default SearchBar;
