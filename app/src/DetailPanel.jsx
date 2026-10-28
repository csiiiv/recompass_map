import { LAYERS, layerColor } from "./constants.js";

function Row({ k, v }) {
  if (v == null || v === "") return null;
  return (
    <div className="detail-row">
      <span className="detail-k">{k}</span>
      <span className="detail-v">{v}</span>
    </div>
  );
}

export default function DetailPanel({ plant, selected, overlaps, onClose, dark = false }) {
  if (selected == null || !plant) return null;
  const p = plant.properties;
  const hits = (overlaps && overlaps[String(selected)]) || [];
  const byLayer = {};
  for (const h of hits) {
    (byLayer[h.layer] ||= []).push(h);
  }

  return (
    <div className="detail-panel">
      <button className="close-btn" onClick={onClose} title="Close">
        ✕
      </button>
      <h2>{p.name}</h2>
      <div className="detail-chips">
        {p.fuel && <span className="chip">{p.fuel}</span>}
        {p.tech && p.tech !== p.fuel && <span className="chip">{p.tech}</span>}
        {p.status && <span className="chip">{p.status}</span>}
      </div>

      {hits.length > 0 ? (
        <div className="flag-banner">
          ⚑ Overlaps {hits.length} sensitive area{hits.length > 1 ? "s" : ""} (inside or
          within 5 km)
        </div>
      ) : (
        <div className="ok-banner">No overlap flagged within 5 km</div>
      )}

      <div className="detail-section">
        <Row k="Owner / SPV" v={p.owner} />
        <Row k="Parent developer" v={p.parent} />
        <Row k="Capacity" v={p.capacity_mw ? `${p.capacity_mw} MW` : null} />
        <Row k="Dependable" v={p.dependable_mw ? `${p.dependable_mw} MW` : null} />
        <Row k="Island group" v={p.island} />
        <Row k="Region" v={p.region} />
        <Row k="Province" v={p.province} />
        <Row k="Municipality" v={p.municipality} />
        {p.barangay && <Row k="Barangay" v={p.barangay} />}
        <Row k="Target / actual COD" v={p.cod} />
        <Row k="Permitting" v={p.permitting || p.regulatory_status} />
        <Row k="Market / contract" v={p.market} />
        <Row k="Data source" v={p.source} />
      </div>

      {hits.length > 0 && (
        <div className="detail-section">
          <h3>Sensitive areas nearby</h3>
          {Object.entries(byLayer).map(([layer, items]) => (
            <div key={layer} className="hit-group">
              <div className="hit-layer">
                <span
                  className="swatch"
                  style={{ background: layerColor(layer, dark) || "#888" }}
                />
                {LAYERS[layer]?.label || layer}
              </div>
              <ul className="hit-list">
                {items.map((h, j) => (
                  <li key={j} className="hit-item">
                    <span>{h.name}</span>
                    <span className="hit-rel">
                      {h.rel}
                      {h.d_km > 0 ? ` · ${h.d_km} km` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
