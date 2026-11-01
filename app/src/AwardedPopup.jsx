import { fuelColor } from "./constants.js";
import { AWARDED_FUELS } from "./awardedSites.js";

function Row({ k, v }) {
  if (v == null || v === "") return null;
  return (
    <div className="detail-row">
      <span className="detail-k">{k}</span>
      <span className="detail-v">{v}</span>
    </div>
  );
}

const fmt = (v) =>
  v == null || v === ""
    ? null
    : `${Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 })} MW`;

/**
 * Popup for an aggregated awarded site (one centroid, possibly mixed fuels).
 */
export default function AwardedPopup({ site, onClose }) {
  if (!site) return null;
  const n = Number(site.stack_count) || 1;
  const members = site.members || [];
  const pinPlace = [site.municipality, site.province].filter(Boolean).join(", ");
  const approx =
    site.geocode_status === "centroid_province"
      ? "Province centroid (approximate)"
      : site.geocode_status === "centroid_municipality"
        ? "Municipality centroid (approximate)"
        : "Approximate location";

  const hostLine = (m) =>
    [m.municipality, m.province].filter(Boolean).join(", ") || null;

  // fuels may arrive as array (JS) or comma string (MapLibre serialization)
  let fuels = site.fuels;
  if (typeof fuels === "string") {
    try {
      fuels = JSON.parse(fuels);
    } catch {
      fuels = fuels.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(fuels) || !fuels.length) {
    fuels = AWARDED_FUELS.filter((f) => Number(site[`n_${f}`]) > 0);
  }

  return (
    <div className="deal-popup awarded-popup">
      <button className="close-btn" onClick={onClose} title="Close">
        ✕
      </button>
      <h2>{site.label || `${n} awarded contracts`}</h2>
      <div className="detail-chips">
        {fuels.map((f) => (
          <span
            key={f}
            className="chip"
            style={{ borderColor: fuelColor(f), color: fuelColor(f) }}
          >
            {f}
            {Number(site[`n_${f}`]) > 0 ? ` · ${site[`n_${f}`]}` : ""}
          </span>
        ))}
        <span className="chip">
          {n} contract{n > 1 ? "s" : ""}
        </span>
        <span className="chip">Awarded pipeline</span>
      </div>
      <div className="detail-section">
        <Row k="Map pin" v={pinPlace} />
        <Row k="Placement" v={approx} />
        <Row k="Potential (sum)" v={fmt(site.potential_mw)} />
        <Row k="Installed (sum)" v={fmt(site.installed_mw)} />
        <Row k="Island group" v={site.island} />
      </div>
      {members.length > 0 && (
        <div className="detail-section">
          <h3>
            Contracts
            {n > members.length ? ` (showing ${members.length} of ${n})` : ""}
          </h3>
          <ul className="awarded-member-list">
            {members.map((m, i) => {
              const host = hostLine(m);
              return (
                <li key={i} className="awarded-member">
                  <strong>{m.name}</strong>
                  {host && (
                    <span className="awarded-member-host" title="Host from DOE register">
                      {host}
                    </span>
                  )}
                  <span className="hit-rel">
                    {[m.tech_detail || m.fuel, m.stage, fmt(m.potential_mw)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {m.company && <span className="deal-muted">{m.company}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="deal-muted" style={{ marginTop: 10, fontSize: 12 }}>
        Host places come from the DOE register (text only). The map pin is a
        shared municipality or province centroid — not a surveyed site.
        Mixed technologies share one gray ring. Not screened against sensitive
        layers.
      </p>
    </div>
  );
}
