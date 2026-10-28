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
Philippines_KBA.zip             →   "                          →   kba.geojson (137)
marineprotectedareas.zip        →   "                          →   mpa.geojson (339)
areas.geojson (Land Matrix)     →   "                          →   land_deals.geojson (145)
                                    03_overlaps.py             →   overlaps.json (128 plants flagged)
                                    05_simplify.py             →   (in-place, ~10x size cut)
(a) SUMMARY ... May 2026.pdf     → 06_extract_awarded.py       →   awarded_projects.geojson (497)
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
pdfplumber word extraction with x0-column assignment (columns measured from
page 1: island 0-100, region 100-145, province 145-208, municipality 208-272,
project 272-412, company 412-592, stage 592-660, potentials 660+).
- Row grouping by `top` coordinate (3 pt tolerance).
- Blank cells inherit from the previous row (PDF layout artifact).
- Island cell may contain merged `Luzon II` — split; continuation rows with
  region codes in the island column are handled via an `__island` carry.
- Stage normalization (`Commercial Operation` can split across cells).
- Validation: 497 rows, Σ potential = 31,573.5 MW vs PDF grand total
  31,584.26 MW (99.97%).

### `07_gazetteer.py`
Centroids (geographic mean) of coordinate-bearing plants grouped by
normalized municipality@province and province. Normalization strips "City",
multi-municipality strings ("Aringay and Caba") split on and/,.

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
python3 scripts/03_overlaps.py          # BEFORE simplify (full-detail distances)
python3 scripts/05_simplify.py
python3 scripts/06_extract_awarded.py
python3 scripts/07_gazetteer.py
```

Commit; GitHub Actions rebuilds and redeploys Pages automatically.
