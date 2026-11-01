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
├── main.jsx           # entry: index.css (vars/reset) BEFORE styles.css
├── App.jsx            # state hub: data load, map lifecycle, filters, URL sync
├── maplibre.js        # map factory + basemap URLs + worker URL fix
├── constants.js       # colors, LAYERS registry, fuel/status/island options
├── awardedSites.js    # aggregate awarded → one site per centroid; stroke exprs
├── infoContent.js     # copy for sidebar ⓘ (LAYER_INFO + SECTION_INFO)
├── InfoModal.jsx      # shared dialog + InfoButton for layers / filters / legends
├── Sidebar.jsx        # search, filters, layer toggles, dual legends, stats, ⓘ
├── DetailPanel.jsx    # plant details + grouped overlap hits
├── SensitivePopup.jsx # click browse for WDPA / KBA / Proposed KBA / MPA
├── AwardedPopup.jsx   # stacked contracts at one centroid
├── DealPopup.jsx      # Land Matrix deal details (lazy land_deal_info.json)
├── OverlapsList.jsx   # modal table + CSV export
├── AnalysisModal.jsx  # native dialog, tabbed briefing / analysis
├── analysis.js        # pure aggregation, scope rules, CSV exports
├── analysis.test.js   # counting / filter / reconciliation tests
├── analysis.css       # analysis dialog + charts
├── HelpNote.jsx       # in-map "how to read" card
├── index.css          # CSS vars (light/dark), reset, #root sizing
└── styles.css         # component styles + responsive rules
```

New datasets: add a `LAYERS` entry in `constants.js`, pipeline output under
`public/data/`, and a matching `LAYER_INFO` blurb in `infoContent.js` — the
ⓘ modal needs no extra wiring.

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

- `plants / overlaps / awarded / gazetteer` — fetched once. Awarded rows are
  geocoded against the gazetteer at load (`centroid_municipality`,
  `centroid_province`, or unmapped), then collapsed via
  `aggregateAwardedSites` into `awardedSites` (one Feature per centroid with
  `stack_count`, `n_<Fuel>`, `breakdown`, `members_json`).
- `filters {query, fuel, status, island}` → `filteredIdx` for plants; awarded
  map filter uses island + per-fuel counts (`n_Solar`, …) so a tech filter
  keeps mixed sites but resizes/labels to that tech’s count.
- `visible {layerId: bool}` → `setLayoutProperty(visibility)` (including
  `awarded-count` with the awarded layer).
- Share state (`shareUrl.js`) serializes filters, non-default layers, `dark`,
  and the active selection into the URL **hash**:
  `plant` · `deal` · `area=layer:id` · `awarded=lng,lat` (mutually exclusive).
  Opening a shared selection also turns on the needed layer(s). Legacy `?…`
  query links still parse on load; writes clear the search string.
- Selection is single-object: plant `selected` **or** deal **or** sensitive
  **or** awarded popup — opening one clears the others.
- Pending layers (`ancestral_domains`, `municipal_waters`) stay out of
  visibility handling — disabled toggles only.

## Awarded markers (design)

Earlier per-fuel offset rings cluttered shared municipalities. Current rule:

- **One hollow ring per centroid** (not per technology).
- Single-fuel site → that fuel’s stroke color; mixed → neutral gray.
- Symbol layer shows `stack_count` when > 1 (or the filtered `n_<Fuel>`).
- Popup lists member contracts (capped) with fuel chips.

## Analysis window

The upper-right Analysis button opens a native modal `dialog`. Native modality
handles background interaction and focus trapping; Escape, Close, and backdrop
clicks dismiss it. Tabs support arrow, Home, and End keys. Selecting a
review-list plant closes the dialog and uses the existing selection workflow.

Analysis reuses loaded data (no extra fetches). Initial scope follows
`filteredIdx`, with options for all inventory plants and renewables-only
(solar, wind, hydro, geothermal, biomass; excludes BESS). Map bounds and layer
visibility do not affect analysis. Counts deduplicate by plant and layer;
inside beats proximity in each partition. MW sums use positive finite values
only.

**Awarded pipeline tab** covers all Sheet technologies (not solar-only), with
its own technology + island filters, including unmapped rows. Potential MW and
installed MW stay separate. No overlap screening of centroids; no joining into
plant totals.

Run `cd app && npm test` for synthetic cases and inventory reconciliation.
`npm run build` / `npm run lint` validate the frontend.

## Performance

- Data payload after simplification: ~3.8 MB total (plants 105 KB, PA ~1.0 MB,
  land deals ~0.5 MB, confirmed KBA ~0.5 MB, proposed KBA ~0.7 MB, MPA 164 KB,
  awarded ~0.5 MB, deal info ~0.4 MB, gazetteer small).
- JS bundle ~1.3 MB (MapLibre dominates). Fine for a workshop tool on desktop
  WiFi.
- No clustering; plants + ~100 awarded site rings + MPA/land-deal points render
  acceptably at national scale.

## Deployment

`.github/workflows/deploy.yml`: checkout → Node 20 (npm cache) →
`npm ci || npm install --legacy-peer-deps` → `npm run build` →
`configure-pages`/`upload-pages-artifact`/`deploy-pages`. `vite.config.js`
sets `base: "/recompass_map/"` for the Pages subpath. A guard step copies
`app/public/data/*` into `dist` if the build output lacks them (belt-and-braces).
