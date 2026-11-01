# Review & recommendations — 2026-11-01 data refresh

Working notes for the 2026-11-01 data refresh. **Shipped on `main`**
(KBA Policy B, multi-tech awarded, UI popups/ⓘ). Staging folder kept for
provenance / identical-hash checks; live docs are under `docs/`.

**Staged data:** `sprints/2026-11-01-1949_new_data_update/data/`  
**Source pull notes:** [`data_sources.md`](data_sources.md)  
**Sprint changelog (tech):** [`CHANGELOG.md`](CHANGELOG.md)  
**User-facing what’s new:** [`user_changelog.md`](user_changelog.md)  
**Live inventory:** [`docs/DATA_SOURCES.md`](../../../docs/DATA_SOURCES.md)

---

## How we are reviewing

For each staged dataset we check four things, then decide replace / skip /
defer:

| Check | Question |
| --- | --- |
| **Identity** | Same bytes / same vintage as live `data_sources/`? |
| **Schema** | Drop-in for current pipeline scripts, or remap required? |
| **Coverage** | Count, area, tech mix — what changes on the map and in overlaps? |
| **Product fit** | Does it crowd the map, muddy screening, or duplicate another layer? |

**Overlap rule we keep unless product changes it:** only **plants** are
screened against sensitive layers. Awarded contracts are a pipeline view and
are **not** overlap-flagged today.

**Map crowding rule:** sensitive layers are already independent sidebar
toggles and start **off**. New detail should prefer **extra toggles that
default off**, not packing more polygons into a single always-on layer.

---

## Policy B — KBA with multiple toggles

**Yes — multiple toggles are the point of Policy B.** We do not dump all 315
sites into one `kba` layer.

### Recommended split

| Toggle | Contents | Default | In plant overlaps? |
| --- | --- | --- | --- |
| **Key Biodiversity Areas** | Confirmed only (`KBA_Class == "KBA"`, ~121) | Off (same as today) | **Yes** — default sensitive screen |
| **Proposed KBAs** | `KBA_Class == "Proposed KBA"` (~194) | **Off** | **No** (or optional later) |

Why this avoids crowding:

- Confirmed ~83k km² vs Proposed ~448k km² — Proposed is mostly large /
  marine and would paint huge swaths if mixed in.
- Users who want the pipeline-of-proposals story turn Proposed on
  deliberately; everyone else keeps today’s screening density.
- Same pattern as existing `land_deals` vs `land_deal_sites`, and as the
  pending ancestral-domains / municipal-waters toggles (visible but gated).

### Optional later toggles (not v1)

Only if workshop feedback asks for them — still default **off**:

- Filter Proposed by `_Type` (Terrestrial / Marine / Integrated)
- Filter by `_Category` (Global / National / Candidate)

Prefer **one Proposed toggle** first; subtype filters add sidebar noise
without much gain for the Nov workshop.

### Metadata — what’s already there vs what’s missing

**Already on the GeoJSON (both WDPA and KBA):** site attributes are
mapped into feature properties today — WDPA (name, designation, IUCN,
status/year, area, …) and KBA (name, class/category/type, area,
region/province/municipality, elev/depth, status, …). Confirmed + Proposed
KBA both carry these fields after the Feb 2026 swap.

**Already used in the UI (thinly):** plant overlap hits show the **site
name** only.

**Browse UI:** clicking a KBA, Proposed KBA, WDPA, or MPA feature opens a
detail popup from existing GeoJSON properties (same pattern as Land Matrix
deals). Hover shows a short name tooltip. No extra fetch required.

**Extra / deferred (profiles workbook):**
`KBA_Profiles_and_Trigger_Species_04Feb2026.xlsx` adds PA / ancestral-domain /
ICCA overlap % and trigger-species tables. That is additive enrichment
joined on `KBA ID`, not a substitute for shapefile attrs. Ship popups on
existing fields first; join the workbook later if workshop needs species /
overlap %.

### Review checklist — KBA

- [x] Confirm Policy B (confirmed + Proposed toggle)
- [x] Copy Feb 2026 zip into `data_sources/`; retire or archive 2025 zip
- [x] Remap `02_process_sensitive.py` → `kba.geojson` + `kba_proposed.geojson`
- [x] `03_overlaps.py`: confirmed KBA only in default sensitive set
- [x] `05_simplify.py`: both polygon layers
- [x] UI: second toggle, distinct style (e.g. dashed / lower opacity for Proposed)
- [x] Analysis / overlaps table labels updated
- [x] Docs: inventory Added date, vintage, schema note

---

## Recommendations — everything else

### 1. Awarded RE contracts — **shipped (after KBA)**

| | |
| --- | --- |
| **What** | Sheet `Awarded_RE_Service_Contracts.xlsx` (1,262 rows, all tech) + DOE PDFs |
| **vs prior** | Solar-only PDF extract (497) → multi-tech Sheet |
| **Status** | Sheet is primary ingest; PDFs kept for provenance / `--pdf` audit |

**How to add without crowding**

- Keep a **single** “Awarded contracts” layer (already hollow rings, separate
  from plants) — do **not** split into six tech layers on the map.
- Crowding control = **sidebar tech filter** (Solar / Wind / Hydro / …),
  same pattern as plant fuel filters — not six new polygon toggles.
- Default awarded visibility stays **off** (current behavior).
- Expect more **unmapped** pins (`(Offshore)`, multi-province); disclose in
  the existing “X of Y mapped” note.

**Product boundaries**

- Do **not** merge Commercial Operation awards into the plant inventory —
  plants = DOE inventory coordinates; awarded = pipeline geocoded to
  centroids.
- Do **not** start overlap-screening awarded in this pass (geocode quality
  is weaker, especially offshore). Revisit after KBA + multi-tech UI land.

**Review checklist — awarded**

- [x] Spot-check Sheet solar vs live 497 (expect ~505; stages near-match)
- [x] Confirm Sheet is complete vs Drive PDF set (incl. Geothermal Aug PDF)
- [x] Rewrite `06_extract_awarded.py` for xlsx; keep PDF script path as audit optional
- [x] UI copy: drop “(solar)”; Analysis “awarded solar” → multi-tech
- [x] Tech filter + MW rollups by technology
- [x] Docs + README counts

### 2. WDPA protected areas — **no change**

Staged Drive package is **byte-identical** to live Oct 2026 PHL zip.

- Review: hash check only (done).
- Action: skip replace; next review when Protected Planet publishes a newer
  monthly cut.

### 3. Marine protected areas — **no change (known gap remains)**

Staged HDX + Drive zips are **byte-identical** to live 2013 MSI set.

- Review: identity check (done); still undercounts post-2013 declarations.
- Action: do not pretend this is a refresh. Track as open data gap; only
  replace when a newer national MPA product arrives.

### 4. Power plant inventory — **out of scope this sprint**

No new XLSX in the share package. Leave `01_process_plants.py` alone.
Commercial Operation awards may *look* like plants on the map once multi-tech
awarded ships — document the distinction in Help / Analysis, don’t merge.

### 5. Land Matrix — **out of scope this sprint**

Not in the 2026-11-01 share. No change to deals / areas / locations /
`deal_details`.

### 6. Pending layers (CADT / municipal waters) — **still blocked**

Still awaiting NCIP / UP-MSI shares. Keep dashed disabled toggles. Proposed
KBA is **not** a substitute for ancestral domains even though the profiles
xlsx has “Ancestral Domain Overlap %” — that is a KBA attribute, not a CADT
boundary layer.

### 7. Overlaps model — **tighten around KBA only**

| Decision | Recommendation |
| --- | --- |
| Plants × confirmed KBA / WDPA / MPA / land deals | Keep |
| Plants × Proposed KBA | Exclude from default `03_overlaps.py` |
| Awarded × any sensitive layer | Defer |
| Analysis modal layer table | Show Proposed only if we add a separate optional metric later |

---

## Recommended sequence

```
1. Agree Policy B (this doc)                         ✅
2. Implement KBA split + remap + overlaps + UI toggle ✅
3. Implement awarded Sheet ingest + tech filter UI    ✅
4. Leave WDPA / MPA / Land Matrix / plants untouched  ✅
5. KBA/WDPA/MPA click popups (attrs already on features) ✅
6. Optional later: KBA profiles xlsx join; awarded overlap screening
```

### Why this order

1. Sensitive-layer credibility is the map’s core claim — get KBA right first.
2. Awarded expansion is high user value but mostly UI + ingest; it doesn’t
   change screening math if we keep “plants only.”
3. Skipping identical WDPA/MPA avoids fake “updates” and keeps the MPA gap
   visible.

---

## Open questions / follow-ups

1. **Profiles xlsx join?** Species + PA/CADT/ICCA % — still deferred.
2. **Awarded overlap screening?** Still deferred (geocode / offshore quality).
3. **PSGC gazetteer module (muni / optional brgy)?** Offered — not for this
   workshop pass. Current `gazetteer.json` is plant-derived (~139 munis), so
   many awards fall back to province or stay unmapped. A PSGC lookup
   (city/municipality → centroid, with aliases + multi-host parsing) would
   cut that gap; barangay points only help once the awarded source carries
   brgy names (Sheet today does not). Hook: extend `07_gazetteer.py` +
   client geocode — not a new map layer.
4. **Sidebar ⓘ info** — shipped: per-layer + Filters / legend section
   modals (`infoContent.js`). New datasets add a `LAYER_INFO` key.
5. **Docs pass** — `README`, `app/README`, `HOW_TO_READ`, `ARCHITECTURE`,
   `DATA_PIPELINE`, `DATA_SOURCES` aligned with shipped behavior (2026-11-02).

---

## Sign-off

| Item | Reviewer | Status |
| --- | --- | --- |
| KBA Policy B | | Done in code |
| Awarded Sheet as ingest | | Done in code |
| Skip WDPA / MPA | | Done |
| Defer awarded overlaps + profiles join | | Still deferred |
| KBA/WDPA/MPA click popups (existing attrs) | | Done in code |
| Sidebar ⓘ + awarded markers | | Done in code |
| Docs aligned to shipped build | | Done (2026-11-02) |
| Implementation order (KBA → awarded → popups) | | Done |
