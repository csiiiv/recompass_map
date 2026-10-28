# Architecture & Build Notes

How the app is put together, and the non-obvious decisions behind it.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | Vite 8 + React 19 | instant HMR, static output (no server needed) |
| Map | MapLibre GL JS **v6** | free/open, vector tiles, no API key |
| Basemaps | CARTO Voyager (light) / Dark Matter | vector, label-rich, free tier, no key |
| Hosting | GitHub Pages via Actions | zero-cost stable link, deploy on push |
| Data | static GeoJSON in `app/public/data/` | no backend; fully inspectable |

## Component map

```
src/
├── main.jsx          # entry: imports index.css (reset/vars) BEFORE styles.css
├── App.jsx           # state hub: data loading, map lifecycle, filters, URL sync
├── maplibre.js       # map factory + basemap URLs + worker URL fix
├── constants.js      # single source of truth: colors, layer registry, options
├── Sidebar.jsx       # search, filters, layer toggles+badges, legend, stats
├── DetailPanel.jsx   # plant details + grouped overlap hits
├── OverlapsList.jsx  # modal table + CSV export
├── HelpNote.jsx      # in-app "how to read" toggle card
├── index.css         # CSS vars (light/dark), reset, #root sizing
└── styles.css        # component styles + responsive rules
```

## Gotchas solved (keep these if refactoring)

### 1. MapLibre v6 worker under Vite
v6 loads its worker by deriving a sibling URL from `import.meta.url`. Vite's
dev pre-bundling moves the entry to `node_modules/.vite/deps/`, breaking that
resolution → "Worker failed to load", blank map.
**Fix**: `setWorkerUrl(import("maplibre-gl/dist/maplibre-gl-worker.mjs?url"))`
in `maplibre.js`. Works in dev and emits a hashed asset in builds.

### 2. Container collapse (0px canvas)
MapLibre adds `.maplibregl-map { position: relative }` to the container. If
your own rule is equal-specificity and earlier in the cascade, `inset: 0`
loses and the canvas sizes to 0 (children are absolutely positioned).
**Fix**: `.map-wrap .map.maplibregl-map { position:absolute; inset:0;
width/height:100%; min-height:240px }` — specificity (0,3,0) beats (0,1,0)
regardless of order.

### 3. `index.css` must be imported
The reset (`body{margin:0}`) and `#root` sizing live in `index.css`. If it
isn't imported **before** `styles.css`, the app offsets 8px and layout math
drifts. `main.jsx` enforces the order.

### 4. Style swap on theme toggle wipes layers
`map.setStyle()` drops all custom sources/layers. `App.jsx` bumps
`styleEpoch` on `styledata`, and the add-layers effect re-runs (it checks
`map.getSource(...)` before re-adding). Filters/visibility effects also key
on `styleEpoch`.

### 5. MapLibre sends `Accept: application/json`
CARTO's style endpoint content-negotiates; plain `curl` (Accept: `*/*`)
receives a TS schema file — don't debug basemap issues with naive curl.
MapLibre itself always receives valid JSON.

## State model (App.jsx)

- `plants / overlaps / awarded / gazetteer` — fetched once; awarded is
  geocoded against the gazetteer at load (statuses: `centroid_municipality`,
  `centroid_province`, or unmapped).
- `filters {query, fuel, status, island}` → `filteredIdx` (Set) → MapLibre
  expression filter on the plants layers; also synced to URL params.
- `visible {layerId: bool}` → `setLayoutProperty(visibility)`.
- `selected` (plant index) → URL `?plant=`, flyTo, DetailPanel.
- Pending layers (`ancestral_domains`, `municipal_waters`) are excluded from
  visibility handling — they have no data yet and render as disabled toggles.

## Performance

- Data payload after simplification: ~2.3 MB total (plants 105 KB, PA 1.0 MB,
  land deals 0.5 MB, KBA 0.5 MB, MPA 165 KB, awarded 200 KB, gazetteer small).
- JS bundle ~1.3 MB (MapLibre dominates). Code-splitting is a future option;
  fine for a workshop tool on desktop WiFi.
- No clustering yet; 686 total points render fine at national scale.

## Deployment

`.github/workflows/deploy.yml`: checkout → Node 20 (npm cache) →
`npm ci || npm install --legacy-peer-deps` → `npm run build` →
`configure-pages`/`upload-pages-artifact`/`deploy-pages`. `vite.config.js`
sets `base: "/recompass_map/"` for the Pages subpath. A guard step copies
`app/public/data/*` into `dist` if the build output lacks them (belt-and-braces).
