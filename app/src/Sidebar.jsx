import { LAYERS, FUEL_ORDER, STATUS_OPTIONS, ISLAND_OPTIONS, fuelColor } from "./constants.js";

export default function Sidebar({
  className = "",
  dark,
  setDark,
  visible,
  setVisible,
  filters,
  setFilters,
  plants,
  filteredIdx,
  flaggedSet,
  layerCounts,
  awardedStats,
  onShowList,
}) {
  const nFlagged = plants
    ? [...filteredIdx].filter((i) => flaggedSet.has(i)).length
    : 0;

  return (
    <aside className={`sidebar ${className}`.trim()}>
      <header className="brand">
        <div className="brand-mark">RE</div>
        <div>
          <h1>RE Compass</h1>
          <p className="tagline">
            Where energy projects meet sensitive areas — Philippines
          </p>
        </div>
        <button
          className="icon-btn"
          title={dark ? "Switch to light" : "Switch to dark"}
          onClick={() => setDark(!dark)}
        >
          {dark ? "☀" : "☾"}
        </button>
      </header>

      <section className="block">
        <label className="label">Search</label>
        <input
          className="input"
          type="search"
          placeholder="Plant name, province, municipality…"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
      </section>

      <section className="block">
        <div className="label-row">
          <span className="label">Filters</span>
          <button
            className="link-btn"
            onClick={() =>
              setFilters({ query: "", fuel: "all", status: "all", island: "all" })
            }
          >
            reset
          </button>
        </div>
        <div className="select-row">
          <select
            className="select"
            value={filters.fuel}
            onChange={(e) => setFilters({ ...filters, fuel: e.target.value })}
          >
            <option value="all">All technologies</option>
            {FUEL_ORDER.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All stages</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.island}
            onChange={(e) => setFilters({ ...filters, island: e.target.value })}
          >
            <option value="all">All island groups</option>
            {ISLAND_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="block">
        <span className="label">Layers</span>
        <ul className="layer-list">
          {Object.entries(LAYERS).map(([id, cfg]) => (
            <li key={id} className="layer-item">
              <label className={`layer-label ${cfg.pending ? "pending" : ""}`}>
                <input
                  type="checkbox"
                  disabled={cfg.pending}
                  checked={cfg.pending ? false : visible[id]}
                  onChange={(e) => setVisible({ ...visible, [id]: e.target.checked })}
                />
                <span
                  className="swatch"
                  style={
                    id === "awarded"
                      ? {
                          // hollow ring, matching the map rendering
                          background: "transparent",
                          border: `2.5px solid ${cfg.stroke}`,
                          borderRadius: "50%",
                        }
                      : {
                          background:
                            id === "plants" || cfg.pending ? "transparent" : cfg.color,
                          border:
                            id === "plants"
                              ? "2px solid var(--muted)"
                              : cfg.pending
                                ? "2px dashed currentColor"
                                : "none",
                          borderRadius: id === "plants" ? "50%" : "2px",
                        }
                  }
                />
                <span className="layer-name">{cfg.label}</span>
                {layerCounts[id] != null && (
                  <span className="layer-badge">{layerCounts[id]}</span>
                )}
              </label>
            </li>
          ))}
        </ul>
        {visible.awarded && awardedStats && (
          <p className="awarded-note">
            {awardedStats.mapped} of {awardedStats.total} awarded contracts
            placed at municipality/province centroids (approximate locations —{" "}
            {awardedStats.unmapped} await coordinates).
          </p>
        )}
      </section>

      <section className="block">
        <span className="label">By technology</span>
        <ul className="legend">
          {FUEL_ORDER.map((f) => {
            const n = plants
              ? [...filteredIdx].filter(
                  (i) => plants[i].properties.fuel === f
                ).length
              : 0;
            return (
              <li
                key={f}
                className={`legend-item ${filters.fuel !== "all" && filters.fuel !== f ? "dim" : ""}`}
                onClick={() =>
                  setFilters({ ...filters, fuel: filters.fuel === f ? "all" : f })
                }
                title="Click to filter"
              >
                <span className="dot" style={{ background: fuelColor(f) }} />
                <span className="legend-name">{f}</span>
                <span className="legend-n">{n}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="sidebar-footer">
        <div className="stat-chip">
          <strong>{filteredIdx.size}</strong> plants shown ·{" "}
          <strong className="flag-text">{nFlagged}</strong> flagged
        </div>
        <button className="btn primary" onClick={onShowList}>
          Overlaps list ↓ CSV
        </button>
        <p className="footnote">
          Overlap = inside or within 5 km of a sensitive layer. Prototype for
          the 4 Nov 2026 workshop — not an assessment of project performance.
        </p>
      </footer>
    </aside>
  );
}
