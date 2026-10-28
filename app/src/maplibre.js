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
  return map;
}
