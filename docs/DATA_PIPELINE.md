# Data Pipeline Reference

From raw public files in `data_sources/` to the web-served GeoJSON in
`app/public/data/`. All scripts are idempotent — rerun any of them after
updating the corresponding raw source.

## Flow

```
data_sources/                      scripts                          app/public/data/
─────────────────────────────     ────────────────────────────     ─────────────────────────
Philippine Power Plant ...xlsx → 01_process_plants.py          →   plants.geojson (189)
WDPA zip                        → 02_process_sensitive.py      →   protected_areas.geojson (452)
Philippines_KBA_Feb2026.zip     →   "                          →   kba.geojson (121 confirmed)
                                    "                          →   kba_proposed.geojson (194, display-only)
marineprotectedareas.zip        →   "                          →   mpa.geojson (339)
areas.geojson (Land Matrix)     →   "                          →   land_deals.geojson (145)
locations.geojson (Land Matrix) → 08_land_locations.py        →   land_deal_sites.geojson (60 pts)
deals.json (Land Matrix)        → 09_deal_details.py (API)    →   deal_details.json (325 deals)
deals.json + deal_details.json  → 10_deal_info.py             →   land_deal_info.json (web lookup)
                                    03_overlaps.py             →   overlaps.json (129 plants flagged)
                                    05_simplify.py             →   (in-place, ~10x size cut)
Awarded_RE_Service_Contracts.xlsx → 06_extract_awarded.py     →   awarded_projects.geojson (1262 multi-tech)
  (optional --pdf solar audit)
plants.geojson                  → 07_gazetteer.py             →   gazetteer.json (139 muni / 59 prov)
```

## Scripts in detail

### `01_process_plants.py`
Unifies the two XLSX sheets into one schema
(`name, owner, parent, fuel, tech, status, island, region, province,
municipality, capacity_mw, ...`).
- `Master_Inventory`: direct column mapping.
- `SPUG`: different headers (`Prime Mover & Technology`, `Regulatory Status`);
  fuel inferred from tech string; kW→MW fallback; status = Operational.
- Coordinate sanity bounds: 4<lat<21.5, 115<lon<129.5; out-of-range →
  feature kept with null geometry + `geocode_status` marker.
- Dedupe on (name, province).

### `02_process_sensitive.py`
Shapefile → GeoJSON with pyshp (no GDAL needed):
- WDPA: outer zip contains 3 inner zips (file-size splitting) each with
  polygons + points shapefiles — all merged; 2026 field names (`SITE_ID`,
  `NAME_ENG`, …) mapped to friendly keys; MultiPoint shapeType (8) → first
  point.
- KBA/MPA: straightforward; MPA DBF is latin-1 (`encoding="latin-1",
  encodingErrors="replace"` — its NAME fields contain `\xa0`).
- Land Matrix: passed through as-is.
- Polygons keep ring structure as MultiPolygon-of-single-ring (adequate for
  fill rendering and point-in-polygon flagging).

### `08_land_locations.py`
`locations.geojson` complements `areas.geojson`: every deal in the latter also
has points, but 210 deals exist **only** as points. One pin per polygon-less
deal is kept at the best available accuracy:
- `EXACT_LOCATION`/`COORDINATES` (26) → display **and** overlap test;
- `APPROXIMATE_LOCATION` (34) → display only;
- `ADMINISTRATIVE_REGION`/`COUNTRY` centroids (228) → dropped entirely —
  province/island centroids would falsely flag every nearby plant in the
  5 km overlap analysis.

### `09_deal_details.py`
Fetches `https://landmatrix.org/api/deals/<id>/` for every deal in
`deals.json` and writes a slim extract to `data_sources/deal_details.json`
keyed by deal id:
- location details: `name`, `description`, `facility_name` per location nid
  (the list endpoint / `deals.json` only has `{nid, point, accuracy}`);
- `contracts` (number, date, expiration, duration);
- `datasources` (type, publication title, date, URL, comment);
- `project_name`, `nature_of_deal`.
Networked (unlike the rest of the pipeline): 0.4 s politeness delay,
retries with backoff, crash-resumable via checkpoints (re-run skips
already-fetched deals; `--refresh` forces re-fetch; `--limit N` for
testing). Polygons are not stored — `areas.geojson` already has them where
they exist. Location names/descriptions were verified to match
`locations.geojson` exactly, so `09` is a provenance/enrichment source,
not a geometry source.

### `10_deal_info.py`
Joins `deals.json` (deal attributes) with `deal_details.json` (contracts,
data sources, project name) into `app/public/data/land_deal_info.json` —
the compact lookup the web app fetches lazily when a user clicks a
land-deal polygon or site point (~390 KB, 325 deals, 68 energy-related).
Enums stay as short codes; the frontend translates them
(`app/src/constants.js`). Source titles trimmed to 90 chars, max 10
sources per deal. Run after `09` whenever the Land Matrix data refreshes.

### `03_overlaps.py`
For each plant point vs each sensitive feature:
1. bbox prefilter (~5 km padding, 0.045°),
2. point-in-polygon (ray casting) → `inside`,
3. else min distance to ring segments (lat-adjusted equirectangular km)
   ≤ 5 km → `within 5 km`.
Output: `overlaps.json` keyed by plant index with `{layer, name, rel, d_km}`.
Point layers (MPA) use center distance only.

### `05_simplify.py`
Douglas-Peucker (iterative, no dependency) run **after** overlap computation:
tolerance 0.002° (PA) / 0.0015° (land deals) / 0.001° (KBA) — worst-case
boundary shift ~200 m, immaterial vs the 5 km threshold. Also minifies JSON
(separators). Result: 22 MB → 2 MB total.

### `06_extract_awarded.py`
**Primary:** openpyxl read of `Awarded_RE_Service_Contracts.xlsx` (`DATABASE`
sheet) → multi-tech `awarded_projects.geojson` (1,262 rows). Maps Sheet
`Technology` to map fuels (`Hydropower`→`Hydro`, biomass variants→`Biomass`)
and keeps `tech_detail`. Geometry null; client geocodes via gazetteer.
**Audit:** `--pdf` still runs the legacy pdfplumber solar-only parser against
`(a) SUMMARY-…31-May-2026.pdf`.

### `07_gazetteer.py`
Centroids (geographic mean) of coordinate-bearing plants grouped by
normalized municipality@province and province. Normalization strips "City",
multi-municipality strings ("Aringay and Caba") split on and/,.

## Pending data refresh (2026-11-01)

Raw files staged in `sprints/2026-11-01-1949_new_data_update/data/`.
See [`docs/DATA_SOURCES.md`](DATA_SOURCES.md) and
[`sprints/.../docs/review_and_recommendations.md`](../sprints/2026-11-01-1949_new_data_update/docs/review_and_recommendations.md).

1. **KBA — done (Policy B).** Confirmed → `kba.geojson` (overlap screen);
   Proposed → `kba_proposed.geojson` (map toggle only). Profiles xlsx not
   joined yet. Click popups for KBA/WDPA/MPA surface existing GeoJSON attrs.
2. **Awarded — done.** Sheet ingest (1,262 multi-tech); UI + Analysis
   pipeline tab; PDFs retained for provenance; `--pdf` audit path kept.
3. **WDPA / MPA** — staged copies are byte-identical to live; no pipeline
   change.

## Adding the pending layers (when data arrives)

Municipal waters (polygon shapefile) or ancestral domains:
1. Drop the file into `data_sources/`.
2. Add a reader block in `02_process_sensitive.py` → one new geojson.
3. Add a layer entry in `05_simplify.py` if polygons are heavy.
4. Add the layer id to `overlaps_for` inputs in `03_overlaps.py`, rerun 03.
5. Enable in `app/src/constants.js` (remove `pending`), adjust color.

## Regenerating everything

```bash
python3 scripts/01_process_plants.py
python3 scripts/02_process_sensitive.py
python3 scripts/08_land_locations.py
python3 scripts/03_overlaps.py          # BEFORE simplify (full-detail distances)
python3 scripts/05_simplify.py
python3 scripts/06_extract_awarded.py
python3 scripts/07_gazetteer.py
python3 scripts/09_deal_details.py      # networked; resumable (skips cached deals)
python3 scripts/10_deal_info.py         # joins deals + details -> web lookup
```

Commit; GitHub Actions rebuilds and redeploys Pages automatically.
