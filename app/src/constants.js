// Central color palette.
//
// Technology dots are deep/saturated solids; sensitivity layers are bright
// thin outlines with ~12% fills. That difference in form is what keeps them
// apart when two hues land near each other.
//
// Legibility against the basemap is handled by the theme-aware halo below, not
// by the palette — which is why coal can stay near-black and oil light slate
// without either disappearing on one theme.
export const FUEL_COLORS = {
  Solar: "#d97706", // deep amber
  Wind: "#0369a1", // deep sky (vs MPA bright cyan)
  Hydro: "#3730a3", // deep indigo (vs land-deal violet)
  Geothermal: "#dc2626", // deep red
  Biomass: "#3f6212", // dark olive (vs PA bright green)
  BESS: "#a21caf", // dark magenta (vs KBA pink)
  "Oil-Based": "#7c8798", // slate gray
  Coal: "#33383f", // charcoal
  "Natural Gas": "#0f766e", // dark teal (vs MPA bright cyan)
};

// Halo that frames every plant dot. Inverted per theme so dots keep a
// consistent outline weight against both CARTO Voyager and Dark Matter:
// a light halo on dark basemaps, a charcoal halo on light ones.
export const HALO = { light: "#3f3f46", dark: "#f4f4f5" };

// Stroke used for overlap-flagged dots — high contrast on both themes.
export const FLAG_COLOR = "#dc2626";

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

// Sensitivity layer colors are theme-aware: darker variants for the light
// basemap (bright hues wash out to ~1-2:1 there), brighter for the dark one.
// `color` = light mode, `colorDark` = dark mode (falls back to `color`).
// Verified >=3:1 against both CARTO Voyager and Dark Matter land/water tones.
export const LAYERS = {
  plants: { label: "RE & power plants", color: null },
  // Hollow rings. The stroke is theme-specific: #7c2d12 is only 1.06:1 against
  // Dark Matter (invisible), so dark mode gets the bright yellow ring instead.
  awarded: {
    label: "Awarded contracts (solar)",
    color: "#facc15",
    stroke: "#7c2d12",
    strokeDark: "#fde047",
  },
  protected_areas: {
    label: "Protected areas (WDPA)",
    color: "#15803d",
    colorDark: "#22c55e",
  },
  kba: {
    label: "Key Biodiversity Areas",
    color: "#be185d",
    colorDark: "#ec4899",
  },
  mpa: { label: "Marine protected areas", color: "#0e7490", colorDark: "#06b6d4" },
  land_deals: {
    label: "Large-scale land deals",
    color: "#7c3aed",
    colorDark: "#8b5cf6",
  },
  land_deal_sites: {
    label: "Land deal sites (points)",
    color: "#7c3aed",
    colorDark: "#8b5cf6",
    note: "Deals without mapped polygons",
  },
  ancestral_domains: {
    label: "Ancestral domains (pending NCIP)",
    color: "#854d0e", // earth brown — clear of solar amber
    colorDark: "#f59e0b",
    pending: true,
  },
  municipal_waters: {
    label: "Municipal waters (pending UP-MSI)",
    color: "#2563eb",
    colorDark: "#3b82f6",
    pending: true,
  },
};

// Resolve a layer color for the current theme.
export function layerColor(id, dark = false) {
  const cfg = LAYERS[id];
  if (!cfg) return "#71717a";
  return (dark ? cfg.colorDark : cfg.color) || cfg.color;
}

// ---- Land Matrix deal lookups (land_deal_info.json) ----
// Short enum codes from the Land Matrix API, expanded for display.

export const INTENTIONS = {
  FOOD_CROPS: "Food crops",
  NON_FOOD_AGRICULTURE: "Non-food agriculture",
  AGRICULTURE_UNSPECIFIED: "Agriculture (unspecified)",
  LIVESTOCK: "Livestock",
  BIOFUELS: "Biofuels",
  FORESTRY_UNSPECIFIED: "Forestry (unspecified)",
  CARBON: "Carbon",
  MINING: "Mining",
  TOURISM: "Tourism",
  INDUSTRY: "Industry",
  CONVERSATION: "Conservation",
  LAND_SPECULATION: "Land speculation",
  SOLAR_PARK: "Solar park",
  WIND_FARM: "Wind farm",
  BIOMASS_ENERGY_GENERATION: "Biomass energy",
  RENEWABLE_ENERGY: "Renewable energy",
  OTHER: "Other",
};

export const NEGOTIATION = {
  EXPRESSION_OF_INTEREST: "Expression of interest",
  UNDER_NEGOTIATION: "Under negotiation",
  MEMORANDUM_OF_UNDERSTANDING: "Memorandum of understanding",
  ORAL_AGREEMENT: "Oral agreement",
  CONTRACT_SIGNED: "Contract signed",
  CONTRACT_EXPIRED: "Contract expired",
  CONTRACT_CANCELED: "Contract canceled",
  NEGOTIATIONS_FAILED: "Negotiations failed",
  CHANGE_OF_OWNERSHIP: "Change of ownership",
};

export const IMPLEMENTATION = {
  PROJECT_NOT_STARTED: "Project not started",
  STARTUP_PHASE: "Startup phase",
  IN_OPERATION: "In operation",
  PROJECT_ABANDONED: "Project abandoned",
  ON_HOLD: "On hold",
};

export const NATURE = {
  OUTRIGHT_PURCHASE: "Outright purchase",
  LEASE: "Lease",
  CONCESSION: "Concession",
  EXPLOITATION_PERMIT: "Exploitation permit",
  PURE_CONTRACT_FARMING: "Contract farming",
  OTHER: "Other",
};

export const SOURCE_TYPES = {
  CONTRACT: "Contract",
  GOVERNMENT_SOURCES: "Government source",
  MEDIA_REPORT: "Media report",
  RESEARCH_PAPER_OR_POLICY_REPORT: "Research / policy report",
  COMPANY_SOURCES: "Company source",
  PERSONAL_INFORMATION: "Personal information",
  CROWDSOURCING: "Crowdsourced",
  OTHER: "Other",
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
