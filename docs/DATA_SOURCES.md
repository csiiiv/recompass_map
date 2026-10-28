# Data Sources & Provenance

Everything needed to rebuild the map's data from raw public sources.
All files live in `data_sources/` and are committed to the repo (total < 30 MB).

## Inventory

| File | Layer | Source | Vintage | Size |
| --- | --- | --- | --- | --- |
| `Philippine Power Plant Inventory for RE Compass.xlsx` | Power plants (existing/committed/indicative) | DOE, cleaned by WeSolve | 2026 | 101 KB |
| `(a) SUMMARY-OF-AWARDED-PROJECTS-AS-OF-31-May-2026.pdf` | Awarded solar service contracts | DOE | 31 May 2026 | 631 KB |
| `WDPA_WDOECM_Oct2026_Public_PHL_shp.zip` | Protected areas (NIPAS + others) | UNEP-WCMC / protectedplanet.net | Oct 2026 | 17.3 MB |
| `Philippines_KBA.zip` | Key Biodiversity Areas | KBA Partnership | 2025 | 1.3 MB |
| `marineprotectedareas.zip` | Marine protected areas (points) | UP-MSI (via Forum for the Future) | 2013 | 39 KB |
| `areas.geojson` | Large-scale land deal areas | Land Matrix | 2026 export | 4.8 MB |
| `locations.geojson` | Land deal location points (complements `areas.geojson`) | Land Matrix | 2026 export | 205 KB |
| `deals.json` | Land deal attributes (investors, sizes, status) | Land Matrix API (`/api/deals/`) | 2026 export | 399 KB |
| `deal_details.json` | Per-deal details: location names/descriptions, contracts, data sources | Land Matrix API (`/api/deals/<id>/`), via `scripts/09_deal_details.py` | 2026 fetch | ~1 MB |

## Provenance & licenses

### Power plant inventory (XLSX)
- Provided by WeSolve Foundation (Eunice Tanilon), cleaned from DOE sources.
- Two sheets: `Master_Inventory` (grid-connected, 108 plants) and `SPUG`
  (off-grid Small Power Utilities Group, 81 plants).
- Columns include facility name, SPV/parent, fuel, technology, region,
  province, municipality, lat/lon, installed/dependable MW, status, permitting
  framework, market type.
- Usage: internal/communication; attribute to DOE via WeSolve.

### Awarded contracts (PDF)
- DOE "Summary of Awarded Projects" — solar only, as of 31 May 2026.
- 497 projects extracted; ~31.57 GW potential (reconciles to 99.97% of the
  PDF's grand total of 31,584.26 MW).
- Stages: Pre-Development / Development / Construction / Commercial Operation.
- **No coordinates in source** — locations derived: see Geocoding below.

### WDPA protected areas
- Downloaded from protectedplanet.net (Philippines country subset, Oct 2026).
- WDPA + WDOECM; polygons where published, points otherwise (points are
  proximity-flagged, not boundary-flagged).
- License: WDPA is open but requires attribution — the map's attribution
  control credits "© Protected Planet / UNEP-WCMC".

### Key Biodiversity Areas
- 2025 KBA Partnership national subset for the Philippines (137 sites).
- Attributes include national/international names, status, area.

### Marine protected areas
- 2013 UP Marine Science Institute pin locations (339 sites), shared by
  Forum for the Future (Jonathan Catalla).
- **Known issue**: vintage 2013 — undercounts MPAs declared since.
- DBF encoding is latin-1 (handled in the pipeline).

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

Result: 385 placed (120 municipality-level + 265 province-level), 112
unmapped. **Upgrade path**: an official PSGC municipality shapefile would
raise coverage to ~100% and improve accuracy.

## Sensitive pending layers

| Layer | Expected source | Status |
| --- | --- | --- |
| Municipal waters (15 km) | NAMRIA/BFAR via UP-MSI ("Doc Mike") | Awaiting share |
| Ancestral domains (CADT/CALT) | NCIP (public but not downloadable; OCR needed) | Awaiting request via FES (Renee) |

Both appear in the UI as dashed, disabled toggles so the gaps are visible.

## Re-fetching

- WDPA: https://www.protectedplanet.net/en/country/PHL (monthly releases)
- Land Matrix: https://landmatrix.org/map/ (export deals for Philippines)
- KBA: https://www.keybiodiversityareas.org/ (via Forum for the Future share)
- DOE inventories: via FES/WeSolve contacts (not public URLs)

After re-fetching, rerun the pipeline (see `README.md`) — order matters:
01 → 02 → 03 (+ 05 → 06 → 07 for awarded layer).
