# How to Read This Map

**RE Compass — Philippines** · Version 1, November 2026
*A map of where renewable energy projects meet sensitive areas.*

Prepared by WeSolve Foundation with BetterGov.ph for FES Philippines and Forum
for the Future (Responsible Energy Initiative).

---

## The question this map answers

**Where do existing and planned renewable energy projects overlap with
protected areas, ancestral domains, and municipal fishing waters?**

A community should be able to find out whether a project is planned near them.
A mayor should see whether a project clashes with a boundary. A developer
should see the same before committing money. All three get the same overlay;
only what they do with it differs.

## The map in one glance

| Element | What it is | How to read it |
|---|---|---|
| **Colored dots** | Power plants (189 total: existing, committed, indicative) | Color = technology (see sidebar legend). Size = capacity. |
| **Red-ringed dots** | Plants flagged as overlapping | The plant sits inside or within **5 km** of a sensitive layer. |
| **Green polygons** | Protected areas (NIPAS & others, WDPA Oct 2026) | Toggle on/off in the sidebar. |
| **Lime polygons** | Key Biodiversity Areas (2025) | Off by default; enable to see overlaps. |
| **Purple polygons** | Large-scale land deals (Land Matrix) | Off by default. Deal *areas*, not project footprints. |
| **Purple dots** | Land deal sites (Land Matrix points) | Deals without mapped polygons; approximate locations shown but excluded from overlap flags. |
| **Cyan dots** | Marine protected areas (UP-MSI) | Off by default. |

## Five things you can do

1. **Search** any plant name, province, or municipality.
2. **Filter** by technology (solar, wind, hydro…), stage (operational,
   committed, indicative), and island group.
3. **Click a plant** for its details — owner, capacity, location, permitting —
   and a list of every sensitive area it overlaps.
4. **Open the overlaps table** (bottom-left button) and **download it as CSV**
   for your own analysis.
5. **Share a view** — the URL carries your selection, e.g. a specific plant.

## Explore the Analysis window

Click **Analysis** in the upper right to open a large, tabbed window:

- **Home** gives a briefing overview, live summary counts, and suggested paths
  into the analysis.
- **Energy mix** compares technologies, stages, and island groups by plant
  count or reported capacity, with a downloadable technology summary.
- **Sensitive areas** separates inside-boundary and proximity-only flags,
  summarizes unique plants per sensitive layer, and lists provinces for
  closer review. Download all province summaries or choose **View** beside
  a plant to return to its details on the map.
- **Solar pipeline** shows awarded solar contracts by stage and province,
  distinguishes non-commercial potential, and discloses estimated and missing
  locations. Province summaries are downloadable.
- **Data & methods** explains the sources, counting rules, limits, and
  recommended data improvements.

Inventory views initially follow the sidebar search and filters. Choose
**All inventory plants** to set those filters aside, or **Renewables only**
to include solar, wind, hydro, geothermal, and biomass. The inventory also
contains fossil-fuel plants and BESS storage. Moving the map or hiding a
layer does not change these calculations: all available sensitive layers
are always considered. Each plant counts once in overall totals and once
per sensitive layer; adding layer counts can therefore double-count plants.

The solar tab has its own island filter and includes contracts without map
coordinates. It does not inherit inventory filters. Potential MW is not
installed capacity or a completion forecast; commercial-operation contracts
are explicitly included in the source. Do not add contracts to inventory
totals because the sources can contain the same projects. Estimated
centroids are not used for sensitive-area screening. Multi-province labels
remain together rather than assigning the full capacity to each province.

Use Escape, Close, or the backdrop to leave the window. Arrow keys move
between focused tabs. CSV exports include the selected scope.

## What an overlap flag means — and what it doesn't

An overlap flag is a **screening signal**: "look here, ask questions." It is
*not* a verdict that a project is harmful. Many flagged plants are fully
compliant and well-managed. Use flags to prioritize where communities,
regulators, and developers should have informed conversations — not to
condemn projects.

**The flag means:** the plant's location point falls inside, or within 5 km
of, the boundary of a sensitive area, using public boundary data.

## Data behind the map

| Layer | Source | Vintage |
|---|---|---|
| Power plants | DOE Philippine Power Plant Inventory (grid + SPUG off-grid) | 2026 |
| Protected areas | WDPA/WDOECM Philippines (protectedplanet.net) | Oct 2026 |
| Key Biodiversity Areas | KBA Partnership | 2025 |
| Marine protected areas | UP-MSI pin locations | 2013 |
| Land deals | Land Matrix | 2026 pull |

All data is public and downloadable from the map itself (CSV) and from the
original sources above.

## Known gaps (v1)

- **Municipal waters** (15 km boundaries) and **ancestral domains** (CADT/CALT)
  are not yet included — the two layers most requested by partners. Both are
  pending data-sharing agreements; the map is built to add them without
  restructuring.
- The MPA layer (2013) undercounts newer sites.
- WDPA entries published only as points are flagged by proximity, not boundary.
- Plant locations are as reported in the DOE inventory; some are approximate.

## Give us feedback

This prototype will be discussed at the 4 November 2026 consortium workshop.
What's missing? What would make this useful in your work?
**[contact: WeSolve Foundation / Eunice Tanilon]**

---

*RE Compass v1 · built by BetterGov.ph · data public · code public*
