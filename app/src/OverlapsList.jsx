import { useMemo } from "react";
import { fuelColor } from "./constants.js";

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function OverlapsList({ plants, overlaps, filteredIdx, onSelect, onClose }) {
  const rows = useMemo(() => {
    if (!plants || !overlaps) return [];
    const out = [];
    for (const i of filteredIdx) {
      const hits = overlaps[String(i)];
      if (!hits || !hits.length) continue;
      const p = plants[i].properties;
      for (const h of hits) {
        out.push({
          idx: i,
          name: p.name,
          fuel: p.fuel,
          status: p.status,
          province: p.province,
          municipality: p.municipality,
          capacity_mw: p.capacity_mw,
          layer: h.layer,
          area: h.name,
          relation: h.rel,
          distance_km: h.d_km,
        });
      }
    }
    out.sort((a, b) => a.name.localeCompare(b.name) || a.layer.localeCompare(b.layer));
    return out;
  }, [plants, overlaps, filteredIdx]);

  function downloadCSV() {
    const header = [
      "Plant",
      "Technology",
      "Stage",
      "Province",
      "Municipality",
      "Capacity MW",
      "Sensitive layer",
      "Area",
      "Relation",
      "Distance km",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.name,
          r.fuel,
          r.status,
          r.province,
          r.municipality,
          r.capacity_mw,
          r.layer,
          r.area,
          r.relation,
          r.distance_km,
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "re_compass_overlaps.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overlaps-modal">
      <div className="overlaps-card">
        <header className="overlaps-header">
          <h2>Overlaps ({rows.length})</h2>
          <div>
            <button className="btn primary" onClick={downloadCSV}>
              Download CSV
            </button>
            <button className="btn ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <p className="overlaps-sub">
          Plants currently shown that fall inside or within 5 km of any enabled
          sensitive layer (all layers considered, regardless of map toggles).
        </p>
        <div className="overlaps-table-wrap">
          <table className="overlaps-table">
            <thead>
              <tr>
                <th>Plant</th>
                <th>Tech</th>
                <th>Stage</th>
                <th>Location</th>
                <th>Layer</th>
                <th>Area</th>
                <th>Relation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} onClick={() => onSelect(r.idx)} className="clickable">
                  <td>
                    <span className="dot" style={{ background: fuelColor(r.fuel) }} />
                    {r.name}
                  </td>
                  <td>{r.fuel}</td>
                  <td>{r.status}</td>
                  <td>
                    {r.municipality ? `${r.municipality}, ` : ""}
                    {r.province}
                  </td>
                  <td>{r.layer}</td>
                  <td>{r.area}</td>
                  <td>
                    {r.relation}
                    {r.distance_km > 0 ? ` (${r.distance_km} km)` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
