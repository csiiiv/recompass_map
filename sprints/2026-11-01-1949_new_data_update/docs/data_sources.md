# Sprint: new data update (2026-11-01)

Staged raw pulls for a data refresh. Files live under `../data/`.
Nothing here is wired into `data_sources/` or the map pipeline yet —
canonical live inventory remains [`docs/DATA_SOURCES.md`](../../../docs/DATA_SOURCES.md).

**Review / recommendations (Policy B, sequencing, checklists):**
[`review_and_recommendations.md`](review_and_recommendations.md)

**Pulled:** 2026-11-01 (~69 MB total under `data/`).

## Source links (as shared)

### Awarded RE service contracts

- Google Sheet:
  https://docs.google.com/spreadsheets/d/1_zKprvPxmnBBuLrXuOZlXWBgg9FFZAMuC3JHHzPWkiU/edit?usp=sharing
- Google Drive folder of DOE PDFs:
  https://drive.google.com/drive/folders/13hW2vVphDTA_un5Z3yOby23v0T4o7tsb?usp=sharing

Official PDFs:

| Technology | Vintage | URL |
| --- | --- | --- |
| Biomass (commercial) | Aug 2026 | https://d24qbtp4vooyzi.cloudfront.net/api/media/file/Awarded%20Biomass%20Aug%202026.pdf?prefix=dev%2Fmedia |
| Biomass (own-use) | Aug 2026 | https://d24qbtp4vooyzi.cloudfront.net/api/media/file/Awarded%20Biomass%20Own-use%20Aug%202026.pdf?prefix=dev%2Fmedia |
| Geothermal | Mar 2026 | https://prod-cms.doe.gov.ph/documents/d/guest/a-5-awarded-geothermal-1-pdf |
| Solar | May 2026 | https://prod-cms.doe.gov.ph/documents/d/guest/awarded-solar-1-pdf |
| Hydropower | Jun 2026 | https://prod-cms.doe.gov.ph/documents/d/guest/a-6-awarded-hydro-projects-as-of-30-june-2026-pdf |
| Wind | Jun 2026 | https://prod-cms.doe.gov.ph/documents/d/guest/a-10-awarded-wind-projects-as-of-30-june-2026-pdf |

### Sensitive layers

| Layer | Official | Drive |
| --- | --- | --- |
| Philippine KBAs | https://data.humdata.org/dataset/philippine-key-biodiversity-areas-kbas | https://drive.google.com/file/d/1EPbABQvZz-DkH_ZP6wHM90TuaCOEj15f/view?usp=sharing |
| Protected areas (WDPA) | https://www.protectedplanet.net/country/PHL | https://drive.google.com/file/d/119ZnFSdIhQCmpWY9l3R3gVRy_VgDtrjB/view?usp=sharing |
| Marine protected areas | https://data.humdata.org/dataset/philippines-other-0-0-0-0-0-0-0-0-0-0-0-0-0 | https://drive.google.com/file/d/1BhqjNbuOzVVgTxm6wWVseVzJ4U9pFDDy/view?usp=sharing |

## Local inventory (`data/`)

```
data/
├── awarded/
│   ├── Awarded_RE_Service_Contracts.xlsx          # Sheet export (preferred ingest)
│   ├── Awarded_Biomass_Aug_2026.pdf
│   ├── Awarded_Biomass_Own-use_Aug_2026.pdf
│   ├── Awarded_Geothermal_Mar_2026.pdf            # official CMS link
│   ├── Awarded_Solar_May_2026.pdf
│   ├── Awarded_Hydro_Jun_2026.pdf
│   ├── Awarded_Wind_Jun_2026.pdf
│   └── doe_pdfs_drive/DOE Awarded Service Contracts/
│       └── …same set + Awarded Geothermal Aug 2026.pdf
├── kba/
│   ├── Philippines_KBA_Feb2026_Drive.zip          # shapefile (315 sites)
│   └── KBA_Profiles_and_Trigger_Species_04Feb2026.xlsx
├── protected_areas/
│   └── WDPA_WDOECM_Oct2026_Public_PHL_Drive.zip   # identical to live data_sources/
└── mpa/
    ├── MarineProtectedAreas_Drive.zip            # identical to live
    └── MarineProtectedAreas_HDX.zip               # identical to live
```

HDX `kbas.zip` download was aborted (slow / incomplete); Drive KBA zip is
complete and preferred.

## Comparison vs live `data_sources/`

| Layer | Live | Staged | Decision |
| --- | --- | --- | --- |
| Awarded | Solar PDF, 497 projects | Sheet 1,262 multi-tech (+ PDFs) | **Shipped** — Sheet ingest in `data_sources/` |
| KBA | 137 confirmed (2025 schema) | 315 sites Feb 2026 (new schema; Proposed + Marine) | **Update** — remap fields; pick confirmed vs Proposed policy |
| WDPA | Oct 2026 PHL | Same package (identical hash) | **No change** |
| MPA | 2013 MSI | Same package (identical hash) | **No change** (still undercounts post-2013) |

### Awarded Sheet (1,262 filled rows)

| Technology | n | Potential MW | Installed MW |
| --- | --- | --- | --- |
| Solar | 505 | 31,140 | 3,217 |
| Wind | 271 | 88,625 | 626 |
| Hydropower | 376 | 14,386 | 2,337 |
| Biomass - Commercial | 66 | 698 | 619 |
| Geothermal | 24 | 810 | 2,057 |
| Biomass - Own-Use | 18 | 3 | 183 |
| Ocean | 2 | 10 | 0 |

Solar is close to the live extract (505 vs 497). Many wind rows use
municipality `(Offshore)` — gazetteer will leave them unmapped.

### KBA Feb 2026

- 121 `KBA` (~83k km²) + 194 `Proposed KBA` (~448k km²).
- Field rename vs live (`KBA_Name`, `KBA_Class`, … vs `NatName`/`SitRecID`).
- Name overlap with live set is weak (~59) — treat as a replacement, not a
  patch.
- Do **not** fold all Proposed into the default overlap screen without a
  separate toggle (area would flood plant flags).

## Overlaps / product notes

- Live map screens **plants only** against sensitive layers; awarded contracts
  are not overlap-flagged. Multi-tech awarded does not require overlap changes
  unless product wants a pipeline-vs-sensitive screen.
- Commercial Operation awards will partially overlap the plant inventory —
  keep inventory vs pipeline separate.
- Integration order when implementing: (1) KBA + policy → `02→03→05`,
  (2) awarded Sheet → rewrite `06` + UI tech filter, (3) skip WDPA/MPA.
