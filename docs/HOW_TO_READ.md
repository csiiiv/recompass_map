# How to Read This Map

**RE Compass — Philippines** · Version 1, November 2026
*A map of where renewable energy projects meet sensitive areas.*

Prepared by WeSolve Foundation with BetterGov.ph for FES Philippines and Forum
for the Future (Responsible Energy Initiative).

---

## The question this map answers

**Where do existing and planned renewable energy projects overlap with
protected areas, biodiversity sites, marine protected areas, and large-scale
land deals?**

A community should be able to find out whether a project is planned near them.
A mayor should see whether a project clashes with a boundary. A developer
should see the same before committing money. All three get the same overlay;
only what they do with it differs.

Ancestral domains and municipal waters are still pending data-sharing — they
appear as disabled toggles so the gaps stay visible.

## The map in one glance

| Element | What it is | How to read it |
|---|---|---|
| **Solid colored dots** | Power plants (189: existing, committed, indicative) | Color = technology (sidebar legend). |
| **Red-flagged dots** | Plants with an overlap signal | Inside or within **5 km** of a screened sensitive layer. |
| **Hollow rings (+ number)** | Awarded RE service contracts (pipeline) | One ring per place (centroid). Number = stacked contracts. Fuel-colored when single-tech; **gray when mixed**. Click: each contract shows its DOE host place; header **Map pin** is the shared approximate point. |
| **Green polygons** | Protected areas (WDPA, Oct 2026) | Toggle in the sidebar. Click for attributes. |
| **Pink / magenta polygons** | Key Biodiversity Areas — confirmed (Feb 2026) | In the plant overlap screen. Click for attributes. |
| **Dashed pink polygons** | Proposed KBAs (Feb 2026) | Display only; **not** overlap-flagged. Off by default. |
| **Purple polygons / dots** | Large-scale land deals (Land Matrix) | Deal *areas* / site points — not engineered footprints. Click for investors & status. |
| **Cyan dots** | Marine protected areas (UP-MSI, 2013) | Points; proximity-screened. Undercounts newer sites. |

Sidebar **ⓘ** buttons open short explainers for each layer, filters, and
legends (source, vintage, whether it enters screening).

## Five things you can do

1. **Search** any plant name, province, or municipality.
2. **Filter** by technology, plant stage, and island group. Technology and
   island counts include plants **and** awarded contracts; stage is plants only.
3. **Click a plant** for details and every sensitive area it meets; **click a
   sensitive polygon/point** for its attributes; **click an awarded ring** for
   the stacked contract list; **click a land deal** for company / investors /
   contracts.
4. **Open the overlaps table** and download it as CSV.
5. **Share a view** — copy the address bar. The `#…` hash keeps filters,
   visible layers, theme, and the open selection (plant, land deal, sensitive
   area, or awarded site), e.g.
   `#fuel=Solar&layers=plants,awarded,kba&area=kba:177`.

## Explore the Analysis window

Click **Analysis** in the upper right to open a large, tabbed window:

- **Home** — briefing overview, live summary counts, suggested paths.
- **Energy mix** — technologies, stages, island groups by plant count or MW.
- **Sensitive areas** — inside vs proximity flags, plants per layer, province
  review lists.
- **Awarded pipeline** — multi-tech awarded RE contracts (Solar, Wind, Hydro,
  Geothermal, Biomass, Ocean) by technology, stage, and province; separates
  potential vs installed MW; discloses mapped vs unmapped. Local tech + island
  filters on that tab.
- **Data & methods** — sources, counting rules, limits, improvement ideas.

Inventory views initially follow the sidebar search and filters. Choose
**All inventory plants** or **Renewables only** (solar, wind, hydro,
geothermal, biomass; excludes BESS and fossil). Map pan/zoom and layer
visibility do not change these calculations. Each plant counts once overall
and once per sensitive layer.

The awarded-pipeline tab does **not** inherit inventory filters and includes
contracts without map coordinates. Potential MW is not installed capacity or a
completion forecast. Do not add awarded MW to plant inventory totals — the
sources can describe the same projects. Estimated centroids are **not** used
for sensitive-area screening.

## What an overlap flag means — and what it doesn't

An overlap flag is a **screening signal**: "look here, ask questions." It is
*not* a verdict that a project is harmful. Many flagged plants are fully
compliant and well-managed. Use flags to prioritize conversations — not to
condemn projects.

**The flag means:** the plant's location point falls inside, or within 5 km
of, a screened sensitive feature, using public boundary (or point) data.
Confirmed KBAs, WDPA, MPA, and Land Matrix enter screening. Proposed KBAs and
awarded-contract rings do not.

## Data behind the map

| Layer | Source | Vintage |
|---|---|---|
| Power plants | DOE Philippine Power Plant Inventory (grid + SPUG) | 2026 |
| Awarded RE contracts | DOE Awarded RE Service Contracts (Sheet; PDFs for provenance) | Mar–Aug 2026 |
| Protected areas | WDPA/WDOECM Philippines (protectedplanet.net) | Oct 2026 |
| Key Biodiversity Areas (confirmed) | National KBA update | Feb 2026 |
| Proposed KBAs (display only) | National KBA update | Feb 2026 |
| Marine protected areas | UP-MSI pin locations | 2013 |
| Land deals | Land Matrix | 2026 pull |

## Known gaps (v1)

- **Municipal waters** and **ancestral domains** — pending data-sharing;
  disabled toggles in the UI.
- Awarded locations are **municipality/province centroids** (~899 of 1,262
  mapped); offshore and multi-host rows often stay unmapped. A fuller PSGC
  gazetteer is a follow-up.
- MPA layer (2013) undercounts newer sites.
- WDPA entries published only as points are flagged by proximity, not boundary.
- Plant locations are as reported in the DOE inventory; some are approximate.
- KBA trigger-species profiles workbook is staged but not joined to popups yet.

## Give us feedback

This prototype will be discussed at the 4 November 2026 consortium workshop.
What's missing? What would make this useful in your work?
**[contact: WeSolve Foundation / Eunice Tanilon]**

---

*RE Compass v1 · built by BetterGov.ph · data public · code public*
