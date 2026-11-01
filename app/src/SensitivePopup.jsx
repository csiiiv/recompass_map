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

const fmtKm2 = (v) =>
  v == null || v === ""
    ? null
    : `${Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 })} km²`;

const fmtM = (v) =>
  v == null || v === ""
    ? null
    : `${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })} m`;

/** Field layout per sensitive layer — values come from processed GeoJSON props. */
function rowsFor(layer, p) {
  if (layer === "protected_areas") {
    return [
      ["English name", p.name],
      ["Original name", p.orig_name !== p.name ? p.orig_name : null],
      ["Designation", p.desig],
      ["Designation type", p.desig_type],
      ["IUCN category", p.iucn_cat],
      ["Status", p.status],
      ["Status year", p.status_yr],
      ["Governance", p.gov_type],
      ["Reported area", fmtKm2(p.rep_area_km2)],
      ["Reported marine area", fmtKm2(p.rep_m_area_km2)],
      ["Realm", p.realm],
      ["No-take", p.no_take],
      ["Geometry", p.geom_kind],
      ["WDPA ID", p.wdpa_id],
    ];
  }
  if (layer === "kba" || layer === "kba_proposed") {
    return [
      ["Class", p.kba_class],
      ["Category", p.kba_categ || p.category],
      ["Type", p.kba_type],
      ["Status", p.status],
      ["Global / national", p.category],
      ["Area", fmtKm2(p.area_km2)],
      ["Island group", p.island_group],
      ["Region", p.region],
      ["Province", p.province],
      ["Municipality", p.municipality],
      ["Elevation", p.min_elev_m != null || p.max_elev_m != null
        ? `${fmtM(p.min_elev_m) || "—"} – ${fmtM(p.max_elev_m) || "—"}`
        : null],
      ["Depth", p.min_depth_m != null || p.max_depth_m != null
        ? `${fmtM(p.min_depth_m) || "—"} – ${fmtM(p.max_depth_m) || "—"}`
        : null],
      ["KBA ID", p.id],
    ];
  }
  if (layer === "mpa") {
    const yn = (v) => (v === 1 || v === "1" ? "Yes" : v === 0 || v === "0" ? "No" : v);
    return [
      ["Type", p.TYPE],
      ["IUCN category", p.IUCNCAT_CO],
      ["Site code", p.SITE_CODE],
      ["Region", p.REGION],
      ["Subregion", p.SUBREGION],
      ["Year established", p.YEAR_ESTAB],
      ["Coral", yn(p.CORAL_EXIS)],
      ["Seagrass", yn(p.SEAGRASS_E)],
      ["Mangrove", yn(p.MANGROVE_E)],
      ["Marine existence", yn(p.MARINE_EXI)],
      ["Littoral", yn(p.LITTORAL_E)],
      ["Reef area", p.REEF_AREA_],
      ["ID", p.ID],
    ];
  }
  // Generic fallback
  return Object.entries(p)
    .filter(([, v]) => v != null && v !== "")
    .slice(0, 16)
    .map(([k, v]) => [k, String(v)]);
}

function titleFor(layer, p) {
  if (layer === "mpa") return p.NAME || p.name || "Marine protected area";
  return p.name || LAYERS[layer]?.label || "Sensitive area";
}

/**
 * Browse popup for WDPA / KBA / Proposed KBA / MPA features.
 * Uses attributes already on the GeoJSON — no extra fetch.
 */
export default function SensitivePopup({ layer, properties, onClose, dark = false }) {
  if (!layer || !properties) return null;
  const p = properties;
  const label = LAYERS[layer]?.label || layer;
  const note = LAYERS[layer]?.note;
  const rows = rowsFor(layer, p);

  return (
    <div className="deal-popup sensitive-popup">
      <button className="close-btn" onClick={onClose} title="Close">
        ✕
      </button>
      <h2>{titleFor(layer, p)}</h2>
      <div className="detail-chips">
        <span
          className="chip"
          style={{
            borderColor: layerColor(layer, dark),
            color: layerColor(layer, dark),
          }}
        >
          {label}
        </span>
        {layer === "kba_proposed" && (
          <span className="chip">Not in plant overlap flags</span>
        )}
        {p.geom_kind === "point" && (
          <span className="chip">Point geometry · proximity only</span>
        )}
      </div>
      {note && <p className="deal-muted">{note}</p>}
      <div className="detail-section">
        {rows.map(([k, v]) => (
          <Row key={k} k={k} v={v} />
        ))}
      </div>
      <p className="deal-muted" style={{ marginTop: 10, fontSize: 12 }}>
        Attributes from the map layer. Screening flags apply to plants only
        (confirmed KBA / WDPA / MPA / land deals).
      </p>
    </div>
  );
}
