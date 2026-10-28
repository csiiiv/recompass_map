// Aggregates use original plant indices so overlap records stay aligned.
export const RENEWABLE_FUELS = new Set(["Solar", "Wind", "Hydro", "Geothermal", "Biomass"]);
export const SENSITIVE_LAYERS = ["protected_areas", "kba", "mpa", "land_deals", "land_deal_sites"];

export const number = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 1 }).format(value);
export const percent = (value, total) => total ? `${number(value / total * 100)}%` : "—";
export const positiveMW = (value) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

export function plantRows(plants, overlaps, indices, renewablesOnly = false) {
  return plants.flatMap((feature, idx) => {
    if (!indices.has(idx) || (renewablesOnly && !RENEWABLE_FUELS.has(feature.properties.fuel))) return [];
    const hits = overlaps[String(idx)] || [];
    return [{
      ...feature.properties,
      idx,
      mapped: Boolean(feature.geometry),
      mw: positiveMW(feature.properties.capacity_mw),
      hits,
      layers: [...new Set(hits.map((hit) => hit.layer))],
      inside: hits.some((hit) => hit.rel === "inside"),
      flagged: hits.length > 0,
    }];
  });
}

export function summarize(rows) {
  const flagged = rows.filter((row) => row.flagged);
  const inside = flagged.filter((row) => row.inside).length;
  return {
    count: rows.length,
    mw: rows.reduce((sum, row) => sum + row.mw, 0),
    missingMW: rows.filter((row) => !row.mw).length,
    mapped: rows.filter((row) => row.mapped).length,
    flagged: flagged.length,
    inside,
    nearOnly: flagged.length - inside,
    unflagged: rows.length - flagged.length,
    multiLayer: rows.filter((row) => row.layers.length > 1).length,
  };
}

export function groupPlants(rows, field) {
  const groups = new Map();
  for (const row of rows) {
    const name = row[field] || "Not reported";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(row);
  }
  return [...groups].map(([name, members]) => ({ name, ...summarize(members) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function layerSummary(rows) {
  return SENSITIVE_LAYERS.map((id) => {
    const members = rows.filter((row) => row.layers.includes(id));
    const inside = members.filter((row) => row.hits.some((hit) => hit.layer === id && hit.rel === "inside")).length;
    return { id, count: members.length, inside, nearOnly: members.length - inside };
  });
}

export function solarSummary(features, island = "all") {
  const rows = features.filter((f) => island === "all" || f.properties.island === island).map((f) => ({
    ...f.properties,
    potential: positiveMW(f.properties.potential_mw),
    installed: positiveMW(f.properties.installed_mw),
    location: f.geometry && f.properties.geocode_status === "centroid_municipality" ? "municipality"
      : f.geometry && f.properties.geocode_status === "centroid_province" ? "province" : "unmapped",
  }));
  const total = (members) => ({
    count: members.length,
    potential: members.reduce((sum, row) => sum + row.potential, 0),
    installed: members.reduce((sum, row) => sum + row.installed, 0),
    missingPotential: members.filter((row) => !row.potential).length,
  });
  const group = (field) => [...new Set(rows.map((row) => row[field] || "Not reported"))].map((name) => ({
    name, ...total(rows.filter((row) => (row[field] || "Not reported") === name)),
  })).sort((a, b) => b.potential - a.potential || b.count - a.count || a.name.localeCompare(b.name));
  return {
    ...total(rows),
    stages: group("stage"),
    provinces: group("province"),
    municipality: rows.filter((row) => row.location === "municipality").length,
    province: rows.filter((row) => row.location === "province").length,
    unmapped: rows.filter((row) => row.location === "unmapped").length,
    nonCommercial: total(rows.filter((row) => row.stage !== "Commercial Operation")),
  };
}

export function downloadAnalysisCSV(filename, headers, rows, scope) {
  // Prefix spreadsheet formula characters, including in externally sourced names.
  const escape = (value) => `"${String(value ?? "").replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
  const content = [["Scope", ...headers], ...rows.map((row) => [scope, ...row])]
    .map((row) => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
