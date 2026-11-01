import { FUEL_COLORS } from "./constants.js";

/** Fuels that appear in the awarded RE register (map + legend). */
export const AWARDED_FUELS = [
  "Solar",
  "Wind",
  "Hydro",
  "Geothermal",
  "Biomass",
  "Ocean",
];

const MIXED_STROKE = "#71717a";

/** MapLibre match: single-fuel site → that color; mixed → neutral. */
export function awardedStrokeMatch() {
  return [
    "case",
    ["==", ["get", "fuel_n"], 1],
    [
      "match",
      ["get", "primary_fuel"],
      ...AWARDED_FUELS.flatMap((f) => [f, FUEL_COLORS[f] || MIXED_STROKE]),
      MIXED_STROKE,
    ],
    MIXED_STROKE,
  ];
}

/**
 * Collapse geocoded awarded contracts into one map site per centroid.
 * Mixed technologies share one ring (not a flower of offset rings);
 * per-fuel counts drive filter, size, and labels.
 */
export function aggregateAwardedSites(features) {
  if (!features?.length) return [];
  const groups = new Map();

  for (const f of features) {
    if (!f.geometry?.coordinates) continue;
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties || {};
    const fuel = p.fuel || "Other";
    const key = `${lng.toFixed(5)}|${lat.toFixed(5)}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          // Stable share-link key (pre-display coords, 5 dp).
          lng: Number(lng.toFixed(5)),
          lat: Number(lat.toFixed(5)),
          island: p.island || null,
          geocode_status: p.geocode_status || null,
          province: p.province || null,
          municipality: p.municipality || null,
          stack_count: 0,
          potential_mw: 0,
          installed_mw: 0,
          primary_fuel: fuel,
          fuel_n: 0,
          fuels: [],
          label: "",
          breakdown: "",
          members_json: "[]",
        },
        _members: [],
        _byFuel: Object.fromEntries(AWARDED_FUELS.map((x) => [x, 0])),
      };
      groups.set(key, g);
    }
    g.properties.stack_count += 1;
    g.properties.potential_mw += Number(p.potential_mw) || 0;
    g.properties.installed_mw += Number(p.installed_mw) || 0;
    if (fuel in g._byFuel) g._byFuel[fuel] += 1;
    // Prefer municipality-level geocode_status when mixed.
    if (
      p.geocode_status === "centroid_municipality" &&
      g.properties.geocode_status !== "centroid_municipality"
    ) {
      g.properties.geocode_status = p.geocode_status;
    }
    if (!g.properties.island && p.island) g.properties.island = p.island;
    g._members.push({
      name: p.name,
      company: p.company,
      stage: p.stage,
      fuel,
      tech_detail: p.tech_detail || fuel,
      potential_mw: p.potential_mw,
      installed_mw: p.installed_mw,
      // DOE host text (not surveyed coords) — often differs within one pin
      municipality: p.municipality || null,
      province: p.province || null,
      island: p.island || null,
    });
  }

  const sites = [];
  for (const g of groups.values()) {
    const members = g._members;
    const byFuel = g._byFuel;
    delete g._members;
    delete g._byFuel;

    const fuels = AWARDED_FUELS.filter((f) => byFuel[f] > 0);
    for (const f of AWARDED_FUELS) {
      g.properties[`n_${f}`] = byFuel[f];
    }
    g.properties.fuels = fuels;
    g.properties.fuel_n = fuels.length;
    g.properties.primary_fuel =
      fuels.length === 1
        ? fuels[0]
        : fuels.reduce((a, b) => (byFuel[a] >= byFuel[b] ? a : b), fuels[0]);
    g.properties.breakdown = fuels
      .map((f) => `${f} ${byFuel[f]}`)
      .join(" · ");
    g.properties.potential_mw = Math.round(g.properties.potential_mw * 10) / 10;
    g.properties.installed_mw = Math.round(g.properties.installed_mw * 10) / 10;
    g.properties.label =
      members.length === 1
        ? members[0].name
        : fuels.length === 1
          ? `${members.length} ${fuels[0]} contracts`
          : `${members.length} awarded contracts`;
    g.properties.members_json = JSON.stringify(members.slice(0, 40));
    sites.push(g);
  }
  return sites;
}

/** Visible stack size under the current fuel filter ("all" or a fuel name). */
export function awardedVisibleCount(props, fuelFilter) {
  if (!fuelFilter || fuelFilter === "all") return Number(props.stack_count) || 0;
  return Number(props[`n_${fuelFilter}`]) || 0;
}
