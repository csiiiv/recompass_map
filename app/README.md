# RE Compass — Philippines

A public map of where existing and planned renewable energy projects overlap
with protected areas, Key Biodiversity Areas, marine protected areas, and
large-scale land deals in the Philippines.

Prototype built for the 4 Nov 2026 consortium workshop (WeSolve / FES /
Forum for the Future / BetterGov).

## What it does

- **189 power plants** (DOE grid inventory + SPUG off-grid), filterable by
  technology, stage, and island group; searchable by name / province / municipality.
- **4 sensitive layers**: WDPA protected areas (Oct 2026), Key Biodiversity Areas,
  MSI marine protected areas, Land Matrix large-scale land deals.
- **Overlap flags**: a plant is flagged when it sits inside or within 5 km of
  any sensitive layer (plain-geometry screening, not an assessment).
- **Overlaps table** with CSV download.
- Light / dark CARTO basemaps, deep-linkable plant selection (`?plant=ID`).

## Run

```bash
cd app
npm install
npm run dev        # http://localhost:5174
npm run build      # static bundle in app/dist
```

## Data pipeline

```bash
python3 scripts/01_process_plants.py      # XLSX -> plants.geojson
python3 scripts/02_process_sensitive.py   # WDPA/KBA/MPA/LandMatrix -> geojson
python3 scripts/03_overlaps.py            # 5km overlap flags -> overlaps.json
```

Raw inputs live in `data_sources/`. Outputs are static files under
`app/public/data/` — the app has no backend.

## Data sources

| Layer | Source | Vintage |
| --- | --- | --- |
| Power plants | DOE Philippine Power Plant Inventory (grid + SPUG) | 2026 |
| Protected areas | WDPA/WDOECM PHL (protectedplanet.net) | Oct 2026 |
| KBAs | Key Biodiversity Areas Partnership | 2025 |
| MPAs | UP-MSI MPA pin locations | 2013 |
| Land deals | Land Matrix | 2026 pull |

**Pending layers** (not yet in v1): municipal waters (15 km, UP-MSI), ancestral
domains (CADT/CALT, NCIP).

## Caveats

- Overlap flags are **screening signals**, not judgments about projects.
- WDPA point features (no boundary published) are buffered as points only.
- Land Matrix polygons are deal *areas*, not project footprints; overlap means
  the plant falls inside a deal area boundary.
- MPA data is from 2013 and undercounts newer sites.
