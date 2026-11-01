/**
 * Shareable map state in the URL hash (works cleanly on GitHub Pages).
 *
 * Example:
 *   #fuel=Solar&layers=plants,protected_areas,awarded,kba&area=kba:177
 *
 * Selection keys (mutually exclusive — one open popup at a time):
 *   plant=12
 *   deal=4012
 *   area=protected_areas:840 | kba:177 | kba_proposed:152 | mpa:PH123
 *   awarded=121.05000,14.18000   (site centroid, 5 decimal places)
 *
 * Legacy `?fuel=…` query links still load; new writes go to the hash only.
 */

import { LAYERS } from "./constants.js";

export const DEFAULT_VISIBLE = {
  plants: true,
  awarded: false,
  protected_areas: true,
  kba: false,
  kba_proposed: false,
  mpa: false,
  land_deals: false,
  land_deal_sites: false,
  ancestral_domains: false,
  municipal_waters: false,
};

const DEFAULT_FILTERS = {
  query: "",
  fuel: "all",
  status: "all",
  island: "all",
};

const AREA_LAYERS = new Set([
  "protected_areas",
  "kba",
  "kba_proposed",
  "mpa",
]);

function layerIds() {
  return Object.keys(LAYERS).filter((id) => !LAYERS[id].pending);
}

function sameOnSet(a, b) {
  const onA = layerIds().filter((id) => a[id]).sort().join(",");
  const onB = layerIds().filter((id) => b[id]).sort().join(",");
  return onA === onB;
}

/** Read hash first (`#a=1&b=2` or `#/?a=1`), else fall back to `?…`. */
export function readShareParams(loc = window.location) {
  const hash = (loc.hash || "").replace(/^#\/?/, "").replace(/^\?/, "");
  if (hash && (hash.includes("=") || hash.includes("&"))) {
    return new URLSearchParams(hash);
  }
  if (loc.search && loc.search.length > 1) {
    return new URLSearchParams(loc.search);
  }
  return new URLSearchParams();
}

/** Stable id string for a sensitive browse feature. */
export function sensitiveShareId(layer, props = {}) {
  if (layer === "protected_areas") {
    return props.wdpa_id != null && props.wdpa_id !== ""
      ? String(props.wdpa_id)
      : null;
  }
  if (layer === "kba" || layer === "kba_proposed") {
    return props.id != null && props.id !== "" ? String(props.id) : null;
  }
  if (layer === "mpa") {
    if (props.SITE_CODE) return String(props.SITE_CODE);
    if (props.ID != null && props.ID !== "") return String(props.ID);
  }
  return null;
}

/** Props stub used until GeoJSON resolves the full feature. */
export function sensitivePropsFromShareId(layer, id) {
  if (layer === "protected_areas") return { wdpa_id: id };
  if (layer === "kba" || layer === "kba_proposed") {
    const n = Number(id);
    return { id: Number.isFinite(n) ? n : id };
  }
  if (layer === "mpa") {
    if (/^\d+$/.test(id)) return { ID: Number(id), SITE_CODE: id };
    return { SITE_CODE: id };
  }
  return { name: id };
}

export function parseAwardedCoord(raw) {
  if (!raw) return null;
  const m = String(raw)
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lng = Number(m[1]);
  const lat = Number(m[2]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng: Number(lng.toFixed(5)), lat: Number(lat.toFixed(5)) };
}

export function formatAwardedCoord(lng, lat) {
  if (lng == null || lat == null) return null;
  const a = Number(lng);
  const b = Number(lat);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return `${a.toFixed(5)},${b.toFixed(5)}`;
}

/**
 * Normalize UI selection into a shareable object.
 * Priority matches the app’s single-selection model.
 */
export function selectionFromState({
  plant,
  deal,
  sensitive,
  awarded,
} = {}) {
  if (plant != null) return { type: "plant", plant };
  if (deal != null) return { type: "deal", deal };
  if (sensitive?.layer) {
    const id = sensitiveShareId(sensitive.layer, sensitive.props);
    if (id != null) {
      return { type: "area", layer: sensitive.layer, id };
    }
  }
  if (awarded) {
    const coord = formatAwardedCoord(awarded.lng, awarded.lat);
    if (coord) return { type: "awarded", coord, lng: awarded.lng, lat: awarded.lat };
  }
  return { type: null };
}

/** Ensure the layer(s) needed for a shared selection are visible. */
export function visibleWithSelection(visible, selection) {
  const v = { ...visible };
  if (!selection?.type) return v;
  if (selection.type === "plant") v.plants = true;
  if (selection.type === "deal") {
    v.land_deals = true;
    v.land_deal_sites = true;
  }
  if (selection.type === "area" && AREA_LAYERS.has(selection.layer)) {
    v[selection.layer] = true;
  }
  if (selection.type === "awarded") v.awarded = true;
  return v;
}

export function parseShareState(loc = window.location) {
  const p = readShareParams(loc);
  const filters = { ...DEFAULT_FILTERS };
  if (p.has("q")) filters.query = p.get("q") || "";
  if (p.has("fuel")) filters.fuel = p.get("fuel") || "all";
  if (p.has("status")) filters.status = p.get("status") || "all";
  if (p.has("island")) filters.island = p.get("island") || "all";

  let visible = { ...DEFAULT_VISIBLE };
  if (p.has("layers")) {
    const on = new Set(
      (p.get("layers") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    visible = { ...DEFAULT_VISIBLE };
    for (const id of layerIds()) visible[id] = on.has(id);
  }

  let selection = { type: null };
  const plantRaw = p.get("plant");
  if (plantRaw != null && /^\d+$/.test(plantRaw)) {
    selection = { type: "plant", plant: Number(plantRaw) };
  } else if (p.has("deal") && p.get("deal") !== "") {
    const d = p.get("deal");
    const n = Number(d);
    selection = { type: "deal", deal: Number.isFinite(n) ? n : d };
  } else if (p.has("area")) {
    const raw = p.get("area") || "";
    const i = raw.indexOf(":");
    if (i > 0) {
      const layer = raw.slice(0, i);
      const id = raw.slice(i + 1);
      if (AREA_LAYERS.has(layer) && id) {
        selection = { type: "area", layer, id };
      }
    }
  } else if (p.has("awarded")) {
    const coord = parseAwardedCoord(p.get("awarded"));
    if (coord) {
      selection = { type: "awarded", coord: formatAwardedCoord(coord.lng, coord.lat), ...coord };
    }
  }

  visible = visibleWithSelection(visible, selection);

  return {
    filters,
    visible,
    dark: p.get("dark") === "1",
    selection,
  };
}

/**
 * Build hash string (no leading `#`). Omits defaults to keep links short.
 */
export function serializeShareState({
  filters,
  visible,
  dark,
  plant,
  deal,
  sensitive,
  awarded,
}) {
  const p = new URLSearchParams();
  if (filters?.query) p.set("q", filters.query);
  if (filters?.fuel && filters.fuel !== "all") p.set("fuel", filters.fuel);
  if (filters?.status && filters.status !== "all") p.set("status", filters.status);
  if (filters?.island && filters.island !== "all") p.set("island", filters.island);
  if (dark) p.set("dark", "1");

  const sel = selectionFromState({ plant, deal, sensitive, awarded });
  if (sel.type === "plant") p.set("plant", String(sel.plant));
  else if (sel.type === "deal") p.set("deal", String(sel.deal));
  else if (sel.type === "area") p.set("area", `${sel.layer}:${sel.id}`);
  else if (sel.type === "awarded") p.set("awarded", sel.coord);

  // Persist visibility, ensuring layers needed for the open selection are on
  // so a pasted link restores both the popup and the geometry.
  const vis = visibleWithSelection(visible || DEFAULT_VISIBLE, sel);
  if (!sameOnSet(vis, DEFAULT_VISIBLE)) {
    p.set(
      "layers",
      layerIds()
        .filter((id) => vis[id])
        .join(",")
    );
  }
  return p.toString();
}

/** Replace the URL hash; clears legacy search params used for share state. */
export function writeShareState(state, loc = window.location) {
  const hash = serializeShareState(state);
  const next = `${loc.pathname}${hash ? `#${hash}` : ""}`;
  const cur = `${loc.pathname}${loc.search || ""}${loc.hash || ""}`;
  if (cur !== next) {
    window.history.replaceState({}, "", next);
  }
}
