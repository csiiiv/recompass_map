import {
  Map as MapLibreMap,
  NavigationControl,
  AttributionControl,
  setWorkerUrl,
} from "maplibre-gl";
// Vite serves the v6 worker correctly in dev + build via ?url import
// (default sibling-URL resolution breaks under dev pre-bundling).
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(workerUrl);

// MapLibre sets `Accept: application/json` for style fetches, so the CARTO
// endpoint's content negotiation returns real JSON here.
const CARTO_LIGHT = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const CARTO_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function basemapStyle(dark) {
  return dark ? CARTO_DARK : CARTO_LIGHT;
}

// Custom sources/layers that must survive a basemap switch.
const PERSISTENT_SOURCES = new Set([
  "plants",
  "awarded",
  "protected_areas",
  "kba",
  "mpa",
  "land_deals",
  "land_deal_sites",
  "selection-ring",
  "selection-line",
]);

// Switch basemap while carrying our overlay layers over atomically
// (setStyle + transformStyle), so no remove/re-add race can drop them.
export function switchBasemap(map, dark) {
  map.setStyle(basemapStyle(dark), {
    transformStyle: (previousStyle, nextStyle) => {
      if (!previousStyle) return nextStyle;
      const sources = { ...nextStyle.sources };
      const layers = [...nextStyle.layers];
      const known = new Set(layers.map((l) => l.id));
      for (const layer of previousStyle.layers) {
        if (PERSISTENT_SOURCES.has(layer.source) && !known.has(layer.id)) {
          layers.push(layer);
          known.add(layer.id);
        }
      }
      for (const id of Object.keys(previousStyle.sources)) {
        if (PERSISTENT_SOURCES.has(id)) sources[id] = previousStyle.sources[id];
      }
      return { ...nextStyle, sources, layers };
    },
  });
}

export function createMap(container, dark) {
  const map = new MapLibreMap({
    container,
    style: basemapStyle(dark),
    center: [122.5, 12.5],
    zoom: 5.4,
    minZoom: 4,
    maxZoom: 14,
    attributionControl: false,
  });
  map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
  map.addControl(new AttributionControl({ compact: true }), "bottom-right");
  // Debug hook for the headless probes (scripts/dbgprobe*.mjs) — dev only.
  if (import.meta.env.DEV) window.__map = map;
  return map;
}
