# Changelog — sprint `2026-11-01-1949_new_data_update`

Workshop data + UI refresh for RE Compass Philippines (shipped on `main`,
commit `4f3a8a6`, with follow-up docs).

For non-technical reviewers: see [`user_changelog.md`](user_changelog.md).

## Data

- **KBA Policy B** — Feb 2026 national update (315 sites) replaces 2025 zip.
  - Confirmed → `kba.geojson` (121) — in plant overlap screen
  - Proposed → `kba_proposed.geojson` (194) — dashed toggle, default off, **not** screened
  - 2025 zip archived under sprint `data/kba/archive/`
- **Awarded RE** — DOE Sheet primary ingest (`Awarded_RE_Service_Contracts.xlsx`)
  - **1,262** contracts (was ~497 solar-only PDF): Solar / Wind / Hydro /
    Geothermal / Biomass / Ocean
  - Per-tech PDFs kept for provenance; `06_extract_awarded.py --pdf` audit path retained
- **WDPA / MPA** — no replace (staged copies byte-identical; MPA still 2013)
- Overlaps re-run on confirmed KBA only (~127 flagged plants)

## Map / UI

- Proposed KBA layer toggle + distinct dashed style
- Awarded multi-tech filter, Analysis “Awarded pipeline” tab, sidebar counts
  (tech/island include plants + awarded)
- Awarded markers: **one ring per centroid**, stack numbers; fuel color when
  single-tech, gray when mixed; click → contract list popup
- Awarded popup lists each contract’s **DOE host** (municipality / province)
  separately from the shared **map pin** centroid
- Click popups for WDPA / KBA / Proposed KBA / MPA (existing GeoJSON attrs)
- Sidebar **ⓘ** explainers for each layer + Filters / legends (`infoContent.js`)
- **Shareable hash URLs** (`shareUrl.js`): filters, layers, theme, and open
  selection (`plant` / `deal` / `area=layer:id` / `awarded=lng,lat`)

## Pipeline / docs

- `02_process_sensitive.py` — KBA class split; `03` skips proposed; `05` /
  `06` updated; docs + README / HOW_TO_READ / ARCHITECTURE aligned
- User-facing sprint note: [`user_changelog.md`](user_changelog.md)

## Deferred (not in this sprint)

- KBA profiles / trigger-species workbook join
- Overlap-screening awarded contracts
- PSGC gazetteer upgrade (muni / optional brgy)
- Ancestral domains (NCIP) and municipal waters (UP-MSI)
