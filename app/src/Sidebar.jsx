import { useMemo, useState } from "react";
import { LAYERS, FUEL_ORDER, STATUS_OPTIONS, ISLAND_OPTIONS, fuelColor, layerColor } from "./constants.js";
import { AWARDED_FUELS } from "./awardedSites.js";
import InfoModal, { InfoButton } from "./InfoModal.jsx";

function plantMatches(p, { query, fuel, status, island }, skip) {
  if (skip !== "fuel" && fuel !== "all" && p.fuel !== fuel) return false;
  if (skip !== "status" && status !== "all" && p.status !== status) return false;
  if (skip !== "island" && island !== "all" && p.island !== island) return false;
  if (skip !== "query" && query) {
    const hay = `${p.name} ${p.province || ""} ${p.municipality || ""}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function tally(items, key) {
  const counts = {};
  for (const item of items) {
    const k = item[key] || "Not reported";
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

export default function Sidebar({
  className = "",
  dark,
  setDark,
  visible,
  setVisible,
  filters,
  setFilters,
  plants,
  awarded,
  filteredIdx,
  flaggedSet,
  layerCounts,
  awardedStats,
  onShowList,
}) {
  const [infoTopic, setInfoTopic] = useState(null);

  const nFlagged = plants
    ? [...filteredIdx].filter((i) => flaggedSet.has(i)).length
    : 0;

  // Facet counts for filter dropdowns. Technology/island include awarded
  // contracts (so Ocean shows 2); stage stays plant-inventory only.
  const facets = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const plantProps = (plants || []).map((f) => f.properties);
    const awardedProps = (awarded || []).map((f) => f.properties);

    const plantsForFuel = plantProps.filter((p) =>
      plantMatches(p, { ...filters, query: q }, "fuel")
    );
    const awardedForFuel = awardedProps.filter((p) => {
      if (filters.island !== "all" && p.island !== filters.island) return false;
      return true;
    });
    const fuel = tally(
      [
        ...plantsForFuel.map((p) => ({ fuel: p.fuel })),
        ...awardedForFuel.map((p) => ({ fuel: p.fuel })),
      ],
      "fuel"
    );

    const plantsForStatus = plantProps.filter((p) =>
      plantMatches(p, { ...filters, query: q }, "status")
    );
    const status = tally(plantsForStatus, "status");

    const plantsForIsland = plantProps.filter((p) =>
      plantMatches(p, { ...filters, query: q }, "island")
    );
    const awardedForIsland = awardedProps.filter((p) => {
      if (filters.fuel !== "all" && p.fuel !== filters.fuel) return false;
      return true;
    });
    const island = tally(
      [
        ...plantsForIsland.map((p) => ({ island: p.island })),
        ...awardedForIsland.map((p) => ({ island: p.island })),
      ],
      "island"
    );

    const fuelTotal = Object.values(fuel).reduce((a, b) => a + b, 0);
    const statusTotal = Object.values(status).reduce((a, b) => a + b, 0);
    const islandTotal = Object.values(island).reduce((a, b) => a + b, 0);
    return { fuel, status, island, fuelTotal, statusTotal, islandTotal };
  }, [plants, awarded, filters]);

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
          <span className="label">
            Filters
            <InfoButton
              label="Filters"
              topic={{ kind: "section", id: "filters" }}
              onOpen={setInfoTopic}
            />
          </span>
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
            title="Counts = plants + awarded contracts"
          >
            <option value="all">All technologies ({facets.fuelTotal})</option>
            {FUEL_ORDER.map((f) => (
              <option key={f} value={f}>
                {f} ({facets.fuel[f] || 0})
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            title="Plant inventory stages only"
          >
            <option value="all">All stages ({facets.statusTotal})</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s} ({facets.status[s] || 0})
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.island}
            onChange={(e) => setFilters({ ...filters, island: e.target.value })}
            title="Counts = plants + awarded contracts"
          >
            <option value="all">All island groups ({facets.islandTotal})</option>
            {ISLAND_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s} ({facets.island[s] || 0})
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
                          border: `2.5px solid ${dark ? cfg.strokeDark : cfg.stroke}`,
                          borderRadius: "50%",
                        }
                      : {
                          background:
                            id === "plants" || cfg.pending
                              ? "transparent"
                              : layerColor(id, dark),
                          border:
                            id === "plants"
                              ? "2px solid var(--muted)"
                              : cfg.pending || cfg.dashed
                                ? `2px dashed ${cfg.pending ? "currentColor" : layerColor(id, dark)}`
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
              <InfoButton
                label={cfg.label}
                topic={{ kind: "layer", id }}
                onOpen={setInfoTopic}
              />
            </li>
          ))}
        </ul>
        {visible.awarded && awardedStats && (
          <p className="awarded-note">
            {awardedStats.mapped} of {awardedStats.total} contracts geocoded →{" "}
            {awardedStats.sites} map sites (one ring per centroid). Single-fuel
            sites use that color; mixed sites are gray — click for breakdown.
            Numbers mark stacks. Filter a technology to isolate it.{" "}
            {awardedStats.unmapped} unmapped (incl. offshore).
          </p>
        )}
      </section>

      <section className="block">
        <span className="label">
          Plants by technology
          <InfoButton
            label="Plants by technology"
            topic={{ kind: "section", id: "plants_legend" }}
            onOpen={setInfoTopic}
          />
        </span>
        <ul className="legend">
          {FUEL_ORDER.map((f) => {
            const n = plants
              ? [...filteredIdx].filter(
                  (i) => plants[i].properties.fuel === f
                ).length
              : 0;
            if (!n && !["Solar", "Wind", "Hydro", "Geothermal", "Biomass", "BESS", "Oil-Based", "Coal", "Natural Gas"].includes(f))
              return null;
            return (
              <li
                key={f}
                className={`legend-item ${filters.fuel !== "all" && filters.fuel !== f ? "dim" : ""}`}
                onClick={() =>
                  setFilters({ ...filters, fuel: filters.fuel === f ? "all" : f })
                }
                title="Click to filter plants and awarded"
              >
                <span className="dot" style={{ background: fuelColor(f) }} />
                <span className="legend-name">{f}</span>
                <span className="legend-n">{n}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {visible.awarded && (
        <section className="block">
          <span className="label">
            Awarded by technology
            <InfoButton
              label="Awarded by technology"
              topic={{ kind: "section", id: "awarded_legend" }}
              onOpen={setInfoTopic}
            />
          </span>
          <p className="legend-hint">
            Hollow rings · fuel color when alone, gray when mixed at one place
          </p>
          <ul className="legend">
            {AWARDED_FUELS.map((f) => {
              const n = (awarded || []).filter((feat) => {
                const p = feat.properties;
                if (p.fuel !== f) return false;
                if (!feat.geometry) return false;
                if (filters.island !== "all" && p.island !== filters.island) return false;
                return true;
              }).length;
              return (
                <li
                  key={`aw-${f}`}
                  className={`legend-item ${filters.fuel !== "all" && filters.fuel !== f ? "dim" : ""}`}
                  onClick={() =>
                    setFilters({ ...filters, fuel: filters.fuel === f ? "all" : f })
                  }
                  title="Click to filter"
                >
                  <span
                    className="dot ring"
                    style={{ borderColor: fuelColor(f) }}
                  />
                  <span className="legend-name">{f}</span>
                  <span className="legend-n">{n}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

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

      <InfoModal topic={infoTopic} onClose={() => setInfoTopic(null)} />
    </aside>
  );
}
