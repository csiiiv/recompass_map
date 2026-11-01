/**
 * Sidebar “ⓘ” copy. Layer entries are keyed like LAYERS; section entries
 * cover Filters / legends. New datasets: add a matching key here (and on
 * LAYERS) — InfoModal picks it up with no extra wiring.
 */

export const SECTION_INFO = {
  filters: {
    title: "Filters",
    summary:
      "Narrow what you see on the map and in counts. Filters apply together (search + technology + stage + island).",
    bullets: [
      "Technology and island counts include operating/committed plants and awarded RE contracts.",
      "Stage (Commercial Operation, Committed, Indicative, …) applies to the plant inventory only — awarded contracts use their own Development / Pre-Development stages in the popup, not this dropdown.",
      "Click a technology in either legend to set the same technology filter; click again to clear.",
      "Reset clears search and all dropdowns.",
      "The address bar updates as you explore — copy the #… link to share filters, visible layers, and the open selection (plant, land deal, sensitive area, or awarded site).",
    ],
  },
  plants_legend: {
    title: "Plants by technology",
    summary:
      "Solid dots are power plants from the DOE inventory (grid + SPUG), colored by fuel / technology.",
    bullets: [
      "Counts in this list follow the current filters (search, stage, island, technology).",
      "Click a row to filter the map to that technology (plants and awarded).",
      "A red flag on the map means the plant is inside or within 5 km of a screened sensitive layer — not a judgment of the project.",
    ],
  },
  awarded_legend: {
    title: "Awarded by technology",
    summary:
      "Hollow rings are awarded RE service contracts (pipeline), not the same as operating plants.",
    bullets: [
      "One ring per shared place (municipality or province centroid). A number means several contracts stack there.",
      "Single-technology places use that fuel’s color; mixed places are gray — open the popup for the breakdown.",
      "Filter a technology to show only places that include it; the number then counts that technology only.",
      "No surveyed coordinates in the DOE sheet — placement is approximate. Not overlap-screened.",
    ],
  },
};

export const LAYER_INFO = {
  plants: {
    title: "RE & power plants",
    summary:
      "Existing and pipeline power plants from the DOE inventory (cleaned for RE Compass), shown as solid dots at reported coordinates.",
    bullets: [
      "Includes grid-connected and SPUG (off-grid) facilities across RE and conventional fuels.",
      "Overlap flags (red) use plant points only — inside a sensitive polygon or within 5 km.",
      "Click a plant for capacity, stage, and which sensitive layers it meets.",
    ],
    meta: [
      { label: "Source", value: "DOE via WeSolve inventory" },
      { label: "Vintage", value: "2026" },
      { label: "Screening", value: "Yes — primary inventory" },
    ],
  },
  awarded: {
    title: "Awarded RE contracts",
    summary:
      "DOE-awarded renewable energy service contracts (Solar, Wind, Hydro, Geothermal, Biomass, Ocean). Separate from operating plants.",
    bullets: [
      "Primary ingest is the multi-tech Sheet export (~1,260 contracts); per-tech PDFs kept for provenance.",
      "No lat/lon in source — only DOE host names. Mapped to municipality or province centroids via a plant-derived gazetteer (~280 muni / ~620 province / ~360 unmapped). Offshore and hard-to-parse hosts stay unmapped.",
      "Map shows one ring per centroid; stacks get a count. Mixed fuels at one place share a gray ring. The popup lists each contract’s DOE host place; Map pin is the shared approximate point.",
      "Not included in plant overlap screening (geocode quality).",
    ],
    meta: [
      { label: "Source", value: "DOE Awarded RE Service Contracts (Sheet)" },
      { label: "Vintage", value: "Mar–Aug 2026 cuts" },
      { label: "Screening", value: "No — display / pipeline only" },
    ],
  },
  protected_areas: {
    title: "Protected areas (WDPA)",
    summary:
      "Nationally and internationally recognized protected areas for the Philippines from Protected Planet.",
    bullets: [
      "Polygons where published; some sites are points only (those use proximity, not boundary, in screening).",
      "Click a area for WDPA name and attributes already on the feature.",
    ],
    meta: [
      { label: "Source", value: "UNEP-WCMC / Protected Planet" },
      { label: "Vintage", value: "Oct 2026" },
      { label: "Screening", value: "Yes" },
    ],
  },
  kba: {
    title: "Key Biodiversity Areas",
    summary:
      "Confirmed Key Biodiversity Areas from the Feb 2026 national update. These are sites that meet global KBA criteria.",
    bullets: [
      "Used in the default plant overlap screen (inside or within 5 km).",
      "Proposed KBAs are a separate layer and are not mixed into these flags.",
      "Trigger-species profiles exist as a workbook but are not joined to the map yet.",
    ],
    meta: [
      { label: "Source", value: "National KBA update (HDX / share)" },
      { label: "Vintage", value: "Feb 2026" },
      { label: "Screening", value: "Yes — confirmed only" },
    ],
  },
  kba_proposed: {
    title: "Proposed KBAs",
    summary:
      "Sites labeled Proposed in the Feb 2026 KBA update. Shown for context only.",
    bullets: [
      "Dashed outline; default off so they don’t crowd confirmed KBAs.",
      "Not included in plant overlap flags (Policy B).",
      "Toggle on when you want to see candidate sites under discussion.",
    ],
    meta: [
      { label: "Source", value: "National KBA update (Proposed class)" },
      { label: "Vintage", value: "Feb 2026" },
      { label: "Screening", value: "No — display only" },
    ],
  },
  mpa: {
    title: "Marine protected areas",
    summary:
      "Point locations of marine protected areas from UP Marine Science Institute (shared via Forum for the Future).",
    bullets: [
      "Vintage 2013 — undercounts MPAs declared since; treat as a minimum set.",
      "Screened as points (proximity within 5 km), not as polygons.",
    ],
    meta: [
      { label: "Source", value: "UP-MSI (via Forum for the Future)" },
      { label: "Vintage", value: "2013" },
      { label: "Screening", value: "Yes — proximity" },
    ],
  },
  land_deals: {
    title: "Large-scale land deals",
    summary:
      "Land Matrix deal area polygons for the Philippines — claimed deal areas, not engineered project footprints.",
    bullets: [
      "Overlap means a plant point falls inside a deal polygon.",
      "Click for investors, intention, and status (from Land Matrix deal info).",
      "Many energy-related intentions (solar park, biofuels, wind, etc.) appear in the underlying deals.",
    ],
    meta: [
      { label: "Source", value: "Land Matrix" },
      { label: "Vintage", value: "2026 export" },
      { label: "Screening", value: "Yes" },
    ],
  },
  land_deal_sites: {
    title: "Land deal sites (points)",
    summary:
      "Land Matrix location points for deals that lack a usable area polygon (or complement the areas layer).",
    bullets: [
      "Use together with Large-scale land deals for fuller coverage.",
      "Screened as points (proximity within 5 km).",
    ],
    meta: [
      { label: "Source", value: "Land Matrix locations" },
      { label: "Vintage", value: "2026 export" },
      { label: "Screening", value: "Yes — proximity" },
    ],
  },
  ancestral_domains: {
    title: "Ancestral domains (pending)",
    summary:
      "Placeholder for NCIP ancestral domain boundaries. Not loaded yet.",
    bullets: [
      "Will appear as a toggle once a shareable dataset is available.",
      "Until then the checkbox stays disabled.",
    ],
    meta: [
      { label: "Source", value: "Pending NCIP" },
      { label: "Screening", value: "Not yet" },
    ],
  },
  municipal_waters: {
    title: "Municipal waters (pending)",
    summary:
      "Placeholder for municipal waters boundaries (UP-MSI). Not loaded yet.",
    bullets: [
      "Will appear as a toggle once the dataset is available.",
      "Until then the checkbox stays disabled.",
    ],
    meta: [
      { label: "Source", value: "Pending UP-MSI" },
      { label: "Screening", value: "Not yet" },
    ],
  },
};

export function resolveInfo(topic) {
  if (!topic) return null;
  if (topic.kind === "section") return SECTION_INFO[topic.id] || null;
  if (topic.kind === "layer") return LAYER_INFO[topic.id] || null;
  return null;
}
