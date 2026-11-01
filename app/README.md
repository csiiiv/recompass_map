# RE Compass — Philippines (app)

Vite + React + MapLibre frontend for the public overlap map.

Prototype for the 4 Nov 2026 consortium workshop (WeSolve / FES /
Forum for the Future / BetterGov). Root project docs:
[`../README.md`](../README.md), [`../docs/`](../docs/).

## What it does

- **189 power plants** — filter by technology, stage, island; search by name /
  province / municipality.
- **1,262 awarded RE contracts** — multi-tech DOE Sheet; one hollow ring per
  centroid with stack counts (gray when mixed fuels).
- **Sensitive layers** — WDPA (Oct 2026), confirmed KBAs + Proposed KBAs
  (Feb 2026 Policy B), MSI MPAs (2013), Land Matrix deals.
- **Overlap flags** — plant inside or within 5 km of a screened layer
  (Proposed KBAs and awarded rings are not screened).
- **Click popups** — plants, sensitive features, awarded stacks, land deals.
- **Sidebar ⓘ** — per-layer and filter/legend explainers (`infoContent.js`).
- **Analysis** window + overlaps CSV; light/dark CARTO basemaps; shareable URL
  params.

## Run

```bash
cd app
npm install          # --legacy-peer-deps if needed
npm run dev          # http://localhost:5174/recompass_map/
npm run build        # static bundle in dist/
npm test             # analysis.js unit tests
```

## Data

Static files in `public/data/` (no backend). Regenerate from repo root via
`scripts/` — see [`../docs/DATA_PIPELINE.md`](../docs/DATA_PIPELINE.md).

| Layer | Source (repo `data_sources/`) | Vintage |
| --- | --- | --- |
| Power plants | DOE inventory XLSX | 2026 |
| Awarded RE | `Awarded_RE_Service_Contracts.xlsx` | 2026 |
| Protected areas | WDPA PHL zip | Oct 2026 |
| KBAs | `Philippines_KBA_Feb2026.zip` | Feb 2026 |
| MPAs | UP-MSI zip | 2013 |
| Land deals | Land Matrix export + API JSON | 2026 |

Pending (disabled toggles): municipal waters, ancestral domains.
