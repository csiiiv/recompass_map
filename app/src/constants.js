export const FUEL_COLORS = {
  Solar: "#f59e0b",
  Wind: "#0ea5e9",
  Hydro: "#2563eb",
  Geothermal: "#ef4444",
  Biomass: "#16a34a",
  BESS: "#8b5cf6",
  "Oil-Based": "#6b7280",
  Coal: "#374151",
  "Natural Gas": "#d97706",
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
  awarded: { label: "Awarded contracts (solar)", color: "#facc15" },
  protected_areas: { label: "Protected areas (WDPA)", color: "#10b981" },
  kba: { label: "Key Biodiversity Areas", color: "#84cc16" },
  mpa: { label: "Marine protected areas", color: "#06b6d4" },
  land_deals: { label: "Large-scale land deals", color: "#a855f7" },
  ancestral_domains: {
    label: "Ancestral domains (pending NCIP)",
    color: "#f97316",
    pending: true,
  },
  municipal_waters: {
    label: "Municipal waters (pending UP-MSI)",
    color: "#3b82f6",
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
