# RE Compass — Philippines

**A public map of where existing and planned renewable energy projects
overlap with protected areas, Key Biodiversity Areas, marine protected
areas, and large-scale land deals in the Philippines.**

- **Live map**: https://csiiiv.github.io/recompass_map/
- **Version 1** — built for the 4 November 2026 consortium workshop
  (WeSolve Foundation · FES Philippines · Forum for the Future / REI ·
  BetterGov.ph)

## What it does

- **189 power plants** (DOE grid inventory + SPUG off-grid), filterable by
  technology, stage, and island group; searchable by name / province /
  municipality.
- **1,262 awarded RE service contracts** (DOE Sheet: solar / wind / hydro /
  biomass / geothermal / ocean), placed at municipality/province centroids —
  the pipeline view (~899 mapped / ~363 unmapped).
- **Sensitive layers**: WDPA protected areas (Oct 2026), confirmed Key
  Biodiversity Areas (Feb 2026), Proposed KBAs (display-only toggle, not
  overlap-flagged), MSI marine protected areas (2013), Land Matrix
  large-scale land deals (2026).
- **2 pending layers shown as unavailable**: ancestral domains (NCIP CADT/CALT)
  and municipal waters (15 km, UP-MSI) — data-sharing pending.
- **Analysis window** (upper right): Home briefing, energy mix, sensitive-area
  screening and province review, awarded RE pipeline (tech + island filters),
  and data/methods. Filter-aware inventory summaries, a renewables-only
  option, and CSV downloads. Contract estimates stay separate from the plant
  inventory and are not screened for overlaps.
- **Overlap flags**: a plant is flagged when it sits inside or within 5 km of
  a screened sensitive layer (confirmed KBA, WDPA, MPA, land deals —
  screening signal, not an assessment). Proposed KBAs are display-only.
- **Click details**: plants (overlaps list), sensitive polygons/points
  (existing attrs), awarded rings (stacked contracts), Land Matrix deals
  (company, investors, contracts, sources).
- **Sidebar ⓘ**: short modals for each layer plus Filters / legends
  (source, vintage, screening yes/no).
- **Overlaps table** with CSV download; hover tooltips; shareable **hash**
  URLs for filters, layers, theme, and selection
  (`#fuel=Solar&layers=…&area=kba:177` or `deal=` / `awarded=` / `plant=`);
  light/dark CARTO basemaps. Legacy `?fuel=…` links still open.

## Repo layout

```
├── app/                  # Vite + React + MapLibre GL frontend
│   ├── public/data/      # processed GeoJSON served to the map
│   └── src/              # components, styles, map setup
├── data_sources/         # raw downloads (committed: all public data)
├── scripts/              # reproducible data pipeline (Python)
├── docs/                 # project briefs, guides, architecture notes
└── .github/workflows/    # GitHub Pages deploy on push to main
```

## Run locally

```bash
cd app
npm install          # use --legacy-peer-deps if npm errors on peer resolution
npm run dev          # http://localhost:5174/recompass_map/
npm run build        # static bundle in app/dist/
```

## Data pipeline (reproducible)

Requires Python 3 with `pyshp`, `openpyxl`, `pdfplumber` (`pip install pyshp
openpyxl pdfplumber`).

```bash
python3 scripts/01_process_plants.py       # DOE XLSX -> plants.geojson (189)
python3 scripts/02_process_sensitive.py    # WDPA/KBA/MPA/LandMatrix -> geojson
python3 scripts/03_overlaps.py             # 5 km overlap flags -> overlaps.json
python3 scripts/05_simplify.py             # polygon simplification (~10x smaller)
python3 scripts/06_extract_awarded.py      # awarded Sheet -> geojson (1262 multi-tech)
python3 scripts/07_gazetteer.py            # municipality centroids for geocoding
python3 scripts/09_deal_details.py         # Land Matrix per-deal API -> contracts,
                                           # data sources, location details
python3 scripts/10_deal_info.py            # deal info -> web lookup for deal popups
```

Run 01→02→03 for core layers; 05 shrinks polygons for fast loads; 06→07 add
the awarded-contracts layer. Full details: [`docs/DATA_PIPELINE.md`](docs/DATA_PIPELINE.md).

## Data sources

| Layer | Source file (in `data_sources/`) | Vintage | Format |
| --- | --- | --- | --- |
| Power plants | `Philippine Power Plant Inventory for RE Compass.xlsx` | 2026 | XLSX (2 sheets: grid, SPUG) |
| Awarded RE contracts | `Awarded_RE_Service_Contracts.xlsx` (+ tech PDFs) | 2026 | Sheet (primary) |
| Protected areas | `WDPA_WDOECM_Oct2026_Public_PHL_shp.zip` | Oct 2026 | Shapefile |
| Key Biodiversity Areas | `Philippines_KBA_Feb2026.zip` | Feb 2026 | Shapefile (confirmed + Proposed split) |
| Marine protected areas | `marineprotectedareas.zip` | 2013 | Shapefile (points) |
| Land deals | `areas.geojson` (Land Matrix export) | 2026 | GeoJSON |
| Land deal attributes | `deals.json` + `deal_details.json` (Land Matrix API) | 2026 | JSON (per-deal investors, contracts, data sources) |

All layers are public data. See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)
for provenance, licenses, and known quality issues per layer.

## Caveats

- Overlap flags are **screening signals**, not judgments about projects.
- Awarded-contract locations are **centroids** (municipality/province), not
  actual site coordinates — ~899/1262 placed, ~363 unmapped (offshore /
  multi-province). Map shows one ring per place; mixed fuels share a gray ring.
- Land Matrix polygons are deal *areas*, not project footprints.
- The 2013 MPA layer undercounts newer sites.
- See [`docs/HOW_TO_READ.md`](docs/HOW_TO_READ.md) for the full user-facing guide.

## Deployment

GitHub Actions builds `app/` and publishes to GitHub Pages on every push to
`main`. Live URL: https://csiiiv.github.io/recompass_map/
