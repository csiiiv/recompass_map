# Data Sources & Provenance

Everything needed to rebuild the map's data from raw public sources.
All files live in `data_sources/` and are committed to the repo
(~70 MB raw; served GeoJSON is simplified).

## Inventory

**Added** = date the file was first committed to this repo (not the source
publisher's release date — that is **Vintage**).

| File | Layer | Source | Vintage | Added | Size |
| --- | --- | --- | --- | --- | --- |
| `Philippine Power Plant Inventory for RE Compass.xlsx` | Power plants (existing/committed/indicative) | DOE, cleaned by WeSolve | 2026 | 2026-10-29 | 101 KB |
| `Awarded_RE_Service_Contracts.xlsx` | Awarded RE service contracts (all tech) — **primary ingest** | DOE Sheet export | 2026 multi-tech | 2026-11-01 | 120 KB |
| `Awarded_Solar_May_2026.pdf` / `(a) SUMMARY-…31-May-2026.pdf` | Awarded solar (provenance / `--pdf` audit) | DOE | 31 May 2026 | 2026-10-29 / 11-01 | 631 KB |
| `Awarded_{Biomass,Biomass_Own-use,Geothermal_Mar,Geothermal_Aug,Hydro,Wind}_*.pdf` | Awarded RE PDFs by technology (provenance) | DOE | Mar–Aug 2026 | 2026-11-01 | ~0.5 MB ea |
| `WDPA_WDOECM_Oct2026_Public_PHL_shp.zip` | Protected areas (NIPAS + others) | UNEP-WCMC / protectedplanet.net | Oct 2026 | 2026-10-29 | 17.3 MB |
| `Philippines_KBA_Feb2026.zip` | Key Biodiversity Areas (confirmed + Proposed) | National KBA update (HDX / Drive share) | Feb 2026 | 2026-11-01 | 45 MB |
| `KBA_Profiles_and_Trigger_Species_04Feb2026.xlsx` | KBA site profiles + trigger species (not yet joined to map) | HDX companion to Feb 2026 KBA | Feb 2026 | 2026-11-01 | 409 KB |
| `marineprotectedareas.zip` | Marine protected areas (points) | UP-MSI (via Forum for the Future) | 2013 | 2026-10-29 | 39 KB |
| `areas.geojson` | Large-scale land deal areas | Land Matrix | 2026 export | 2026-10-29 | 4.8 MB |
| `locations.geojson` | Land deal location points (complements `areas.geojson`) | Land Matrix | 2026 export | 2026-10-29 | 205 KB |
| `deals.json` | Land deal attributes (investors, sizes, status) | Land Matrix API (`/api/deals/`) | 2026 export | 2026-10-29 | 399 KB |
| `deal_details.json` | Per-deal details: location names/descriptions, contracts, data sources | Land Matrix API (`/api/deals/<id>/`), via `scripts/09_deal_details.py` | 2026 fetch | 2026-10-29 | ~1 MB |

## Provenance & licenses

### Power plant inventory (XLSX)
- Provided by WeSolve Foundation (Eunice Tanilon), cleaned from DOE sources.
- Two sheets: `Master_Inventory` (grid-connected, 108 plants) and `SPUG`
  (off-grid Small Power Utilities Group, 81 plants).
- Columns include facility name, SPV/parent, fuel, technology, region,
  province, municipality, lat/lon, installed/dependable MW, status, permitting
  framework, market type.
- Usage: internal/communication; attribute to DOE via WeSolve.

### Awarded RE contracts (Sheet — shipped 2026-11-01)
- **Primary ingest:** `Awarded_RE_Service_Contracts.xlsx` via
  `scripts/06_extract_awarded.py` → **1,262** contracts
  (Solar 505 / Hydro 376 / Wind 271 / Biomass 84 / Geothermal 24 / Ocean 2).
- ~135.7 GW reported potential, ~9.0 GW installed across stages
  (Development / Pre-Development / Commercial Operation / Own-Use).
- Sheet `Technology` mapped to map fuels (`Hydropower` → `Hydro`; both
  biomass rows → `Biomass` with `tech_detail` preserved).
- **No coordinates in source** — locations derived: see Geocoding below.
  Roughly **899 mapped / 363 unmapped** with the plant-inventory gazetteer
  (offshore + multi-province drive unmapped count up vs solar-only).
- Per-technology DOE PDFs kept in `data_sources/` for provenance;
  `06_extract_awarded.py --pdf` still parses the May 2026 solar summary for
  audit only.

### WDPA protected areas
- Downloaded from protectedplanet.net (Philippines country subset, Oct 2026).
- WDPA + WDOECM; polygons where published, points otherwise (points are
  proximity-flagged, not boundary-flagged).
- License: WDPA is open but requires attribution — the map's attribution
  control credits "© Protected Planet / UNEP-WCMC".
- **Pending refresh check (2026-11-01)**: Drive re-share is byte-identical to
  this file — no replace needed until a newer Protected Planet monthly cut.

### Key Biodiversity Areas (Policy B — shipped 2026-11-01)
- Feb 2026 national shapefile (`Philippines_KBA_Feb2026.zip`): **315** sites
  → pipeline split into **121 confirmed** (`kba.geojson`) and **194 Proposed**
  (`kba_proposed.geojson`).
- Confirmed KBAs are in the default plant overlap screen. Proposed KBAs are a
  separate map toggle (dashed outline, default off) and are **not**
  overlap-flagged.
- Attributes: name, class/category, area, depth/elevation, region / province /
  municipality, island group, global/national category, status, type.
- Companion workbook `KBA_Profiles_and_Trigger_Species_04Feb2026.xlsx` adds
  PA / ancestral-domain / ICCA overlap % and trigger-species tables — staged
  for a later popup join; not wired to the map yet.
- 2025 zip (137 sites) archived under
  `sprints/2026-11-01-1949_new_data_update/data/kba/archive/`.

### Marine protected areas
- 2013 UP Marine Science Institute pin locations (339 sites), shared by
  Forum for the Future (Jonathan Catalla).
- **Known issue**: vintage 2013 — undercounts MPAs declared since.
- DBF encoding is latin-1 (handled in the pipeline).
- **Pending refresh check (2026-11-01)**: HDX + Drive re-shares are
  byte-identical to this file — still the 2013 MSI set.

### Land Matrix deals
- Export of deal *areas* (contract/production/intended) for the Philippines:
  145 polygons with deal IDs, facility names, accuracy levels.
- **Interpretation**: a polygon is the deal's claimed area, not a project
  footprint; overlap means the plant point falls inside a deal area.
- `deals.json` (API list export) adds deal-level attributes for all 325
  deals: operating company, top investors, intention of investment (108
  energy-related: 52 solar park, 37 biofuels, 9 wind farm, 7 renewable
  energy, 3 biomass), deal/contract/intended sizes, negotiation and
  implementation status.
- `deal_details.json` (per-deal API fetch, `scripts/09_deal_details.py`)
  adds location details (name, description, facility name), contracts
  (number, dates), and data sources (publication titles, URLs) — the
  per-deal content shown on landmatrix.org deal pages. Resumable; re-run
  after re-exporting `deals.json`. Polygons are not re-fetched
  (`areas.geojson` already has them).

## Geocoding (awarded contracts)

The PDF has no coordinates. `scripts/07_gazetteer.py` builds a centroid
gazetteer from the plant inventory's coordinate-bearing municipalities
(139 municipalities, 59 provinces). Client-side, each awarded project is
placed at:

1. its municipality centroid, if known; else
2. its province centroid; else
3. left unmapped and counted in the sidebar disclosure.

Solar-only era: 385 placed / 112 unmapped. Multi-tech Sheet (2026-11-01):
~899 placed / 363 unmapped — many wind rows are `(Offshore)` or
multi-province. **Upgrade path**: an official PSGC municipality shapefile
(and offshore handling) would raise coverage and improve accuracy.

## Sensitive pending layers

| Layer | Expected source | Status |
| --- | --- | --- |
| Municipal waters (15 km) | NAMRIA/BFAR via UP-MSI ("Doc Mike") | Awaiting share |
| Ancestral domains (CADT/CALT) | NCIP (public but not downloadable; OCR needed) | Awaiting request via FES (Renee) |

Both appear in the UI as dashed, disabled toggles so the gaps are visible.

## Pending data refresh (2026-11-01)

Staged under `sprints/2026-11-01-1949_new_data_update/data/` (pulled
2026-11-01). Not yet copied into `data_sources/` or run through the
pipeline. Full pull notes:
[`sprints/.../docs/data_sources.md`](../sprints/2026-11-01-1949_new_data_update/docs/data_sources.md).
Review criteria, Policy B toggles, and sequenced recommendations:
[`sprints/.../docs/review_and_recommendations.md`](../sprints/2026-11-01-1949_new_data_update/docs/review_and_recommendations.md).

| Layer | Staged file(s) | vs current | Action |
| --- | --- | --- | --- |
| Awarded RE (all tech) | Sheet + PDFs | **Shipped** — Sheet ingest, 1,262 multi-tech; UI + Analysis updated | Done |
| KBA | `kba/Philippines_KBA_Feb2026_Drive.zip` (+ HDX profiles xlsx) | **Shipped** as Policy B (confirmed + Proposed toggle) | Done — see § Key Biodiversity Areas above |
| WDPA | `protected_areas/WDPA_WDOECM_Oct2026_Public_PHL_Drive.zip` | Identical hash to current | No change |
| MPA | `mpa/MarineProtectedAreas_*.zip` | Identical hash to current (still 2013) | No change |

### Awarded Sheet snapshot

Columns: Technology, Island, Region, Province, City/Municipality, Project
Name, Company Name, Stage of Contract, Potential Capacity (MW), Installed
Capacity (MW). Stages include Own-Use (biomass own-use rows).

| Technology | n | Potential MW | Installed MW |
| --- | --- | --- | --- |
| Solar | 505 | 31,140 | 3,217 |
| Wind | 271 | 88,625 | 626 |
| Hydropower | 376 | 14,386 | 2,337 |
| Biomass - Commercial | 66 | 698 | 619 |
| Geothermal | 24 | 810 | 2,057 |
| Biomass - Own-Use | 18 | 3 | 183 |
| Ocean | 2 | 10 | 0 |

Solar subset is close to the live PDF extract (505 vs 497). Commercial
Operation awards will partially duplicate plants already in the DOE
inventory — keep plants vs awarded as separate products (inventory vs
pipeline). Awarded contracts remain **not** overlap-screened unless that
product rule changes.

### KBA Feb 2026 snapshot (implemented)

- Schema: `ID`, `KBA_Name`, `KBA_Class`, `KBA_Categ`, `Area_sqkm`, region /
  province / municipality, plus `_Status` / `_Type` / `_Category`.
- `KBA_Class`: 121 `KBA` (~83k km²) + 194 `Proposed KBA` (~448k km², largely
  marine / large proposals).
- Shipped as Policy B: confirmed in overlaps; Proposed as separate dashed
  toggle, excluded from plant flags.

### Integration order

1. **KBA Policy B — done** (2026-11-01): `02 → 03 → 05`, UI Proposed toggle.
2. **Awarded Sheet — done** (2026-11-01): rewrite `06` + multi-tech UI.
3. Leave WDPA / MPA as-is; note MPA still 2013.
4. Optional follow-ups: KBA profiles xlsx join; awarded overlap screening
   (still deferred). KBA/WDPA/MPA click popups shipped (attrs already on
   features).

## Re-fetching

- WDPA: https://www.protectedplanet.net/en/country/PHL (monthly releases)
- Land Matrix: https://landmatrix.org/map/ (export deals for Philippines)
- KBA: https://data.humdata.org/dataset/philippine-key-biodiversity-areas-kbas
  (also Drive share used in the 2026-11-01 pull)
- MPA: https://data.humdata.org/dataset/philippines-other-0-0-0-0-0-0-0-0-0-0-0-0-0
  (same 2013 MSI package)
- Awarded RE Sheet:
  https://docs.google.com/spreadsheets/d/1_zKprvPxmnBBuLrXuOZlXWBgg9FFZAMuC3JHHzPWkiU/
- Awarded DOE PDFs (by technology): see sprint `docs/data_sources.md`
- DOE plant inventories: via FES/WeSolve contacts (not public URLs)

After re-fetching into `data_sources/`, rerun the pipeline (see `README.md`) —
order matters: 01 → 02 → 03 (+ 05 → 06 → 07 for awarded layer).
