# What’s new on the map

**RE Compass — Philippines** · update for the 4 November 2026 workshop

A short guide for partners reviewing the app. Technical detail lives in the
sprint [CHANGELOG](CHANGELOG.md) and project docs.

---

## Bigger picture

You can now see **two kinds of energy projects** more clearly side by side:

1. **Power plants** (dots) — what’s already in the DOE inventory (operating,
   committed, or planned), with coordinates.
2. **Awarded RE contracts** (hollow rings) — the wider **pipeline** of
   government-awarded renewable projects across technologies, not only solar.

Sensitive places (protected areas, biodiversity sites, and so on) are updated
where new data was available, with clearer rules about what “counts” as an
overlap flag.

---

## Sensitive areas

### Key Biodiversity Areas (updated)

- The map uses the **February 2026** national KBA update.
- **Confirmed KBAs** can contribute to a plant’s red overlap flag (inside or
  within 5 km), same idea as before.
- **Proposed KBAs** are a **separate layer** (dashed outline, off by default).
  They help you see sites still under discussion, but they **do not** flag
  plants. Turn them on only when you want that extra context.

### What did *not* change this round

- **Protected areas (WDPA)** and **marine protected areas** are the same
  datasets as before. Marine sites are still from **2013**, so newer MPAs may
  be missing.
- **Ancestral domains** and **municipal waters** are still pending — you’ll
  see them as unavailable toggles so the gap stays visible.

---

## Awarded renewable contracts (much expanded)

Previously the pipeline view was mainly **solar**. It now includes:

**Solar · Wind · Hydro · Geothermal · Biomass · Ocean**  
(about **1,260** contracts from the DOE awarded register).

### How to read the rings

- The DOE register has **place names**, not surveyed coordinates. The map
  places rings at a municipality or province **center** when we can match
  those names (many fall back to province; some stay unmapped).
- A **number** on a ring means several contracts share that pin.
- **Colored ring** = one technology at that place. **Gray ring** = mixed
  technologies; click to see the breakdown.
- In the contract card, each row shows its **DOE host** (city/municipality
  and province). **Map pin** at the top is the shared approximate point —
  hosts on the list can differ when several places collapse to one centroid.
- Awarded contracts are **not** overlap-flagged. Use them to explore the
  pipeline; use plant dots for screening against sensitive layers.

Filter by technology or island in the sidebar; the Analysis window has an
**Awarded pipeline** tab for summaries.

---

## Easier to explore

- **Click** a plant, sensitive area, awarded ring, or land deal for details.
- **ⓘ** next to layers and filters opens a short plain-language explainer
  (what the layer is, how old the data is, whether it affects overlap flags).
- Sidebar legends separate **plants by technology** (solid dots) from
  **awarded by technology** (hollow rings).
- **Share a view** — copy the address bar. The `#…` part keeps your filters,
  visible layers, theme, and the open selection (plant, land deal, sensitive
  area, or awarded site).

---

## How to use this in conversation

| If you want to… | Look at… |
| --- | --- |
| Ask “which operating/planned plants sit near sensitive areas?” | Plant dots + red flags + overlaps list / Analysis |
| Ask “what’s in the awarded RE pipeline near this province?” | Awarded rings + filters / Awarded pipeline tab |
| Ask “are there proposed biodiversity sites here?” | Turn on **Proposed KBAs** (context only) |
| Dig into a land deal | Click the purple polygon or point |

Overlap flags remain **screening signals** — a prompt to look closer — not a
judgment that a project is good or bad.

---

## Still coming later (not in this build)

- Richer KBA profiles (e.g. trigger species) on click  
- Better placement of awarded contracts (fuller place-name directory)  
- Checking awarded sites against sensitive layers (once locations are stronger)  
- Ancestral domains and municipal waters when data-sharing allows  

---

Questions or feedback for the workshop: **WeSolve Foundation / Eunice Tanilon**.
