// Central color palette. Hue-families are allocated to avoid conflicts:
//   polygons: green (PA) · pink (KBA) · violet (land deals) · cyan (MPA) ·
//             orange (ancestral, pending) · blue (municipal waters, pending)
//   dots:      amber (solar) · sky (wind) · indigo (hydro) · red (geothermal) ·
//             olive (biomass) · magenta (BESS) · teal (gas) · grays (oil/coal)
//   awarded:   yellow fill + dark brown stroke (distinct from solid solar amber)
export const FUEL_COLORS = {
  Solar: "#f59e0b",
  Wind: "#0ea5e9",
  Hydro: "#4f46e5",
  Geothermal: "#ef4444",
  Biomass: "#65a30d",
  BESS: "#d946ef",
  "Oil-Based": "#6b7280",
  Coal: "#111827",
  "Natural Gas": "#14b8a6",
};

export const FUEL_ORDER = [
  "Solar",
  "Wind",
  "Hydro",
  "Geothermal",
  "Biomass",
  "BESS",
  "Oil-Based",
  "Coal",
  "Natural Gas",
];

export const LAYERS = {
  plants: { label: "RE & power plants", color: null },
  awarded: { label: "Awarded contracts (solar)", color: "#facc15", stroke: "#7c2d12" },
  protected_areas: { label: "Protected areas (WDPA)", color: "#22c55e" },
  kba: { label: "Key Biodiversity Areas", color: "#ec4899" },
  mpa: { label: "Marine protected areas", color: "#06b6d4" },
  land_deals: { label: "Large-scale land deals", color: "#8b5cf6" },
  ancestral_domains: {
    label: "Ancestral domains (pending NCIP)",
    color: "#f97316",
    pending: true,
  },
  municipal_waters: {
    label: "Municipal waters (pending UP-MSI)",
    color: "#2563eb",
    pending: true,
  },
};

export const STATUS_OPTIONS = [
  "Operational",
  "Committed",
  "Indicative",
  "Operational / Committed",
];

export const ISLAND_OPTIONS = ["Luzon", "Visayas", "Mindanao"];

export function fuelColor(fuel) {
  return FUEL_COLORS[fuel] || "#71717a";
}
