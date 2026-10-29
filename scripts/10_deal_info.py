#!/usr/bin/env python3
"""Build the web lookup land_deal_info.json from deals.json + deal_details.json.

The map's land-deal layers (land_deals.geojson polygons, land_deal_sites.geojson
points) carry only location-level fields. This script joins the two API-derived
files into one compact lookup keyed by deal id (as string) for the frontend:

  company, investors, intention, size_ha, year, negotiation, implementation,
  project, nature, contracts[], sources[]

Fetched lazily by the app on first interaction with a land-deal feature, so
its size is kept minimal: titles trimmed, sources capped per deal, enums left
as short codes (translated in app/src/constants.js).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "data_sources"
OUT = ROOT / "app" / "public" / "data" / "land_deal_info.json"

MAX_SOURCES = 10
TITLE_MAX = 90

deals = json.loads((DS / "deals.json").read_text())
details = json.loads((DS / "deal_details.json").read_text())["deals"]

out = {}
for d in deals:
    did = str(d["id"])
    sv = d["selected_version"]
    dd = details.get(did, {})
    company = ((sv.get("operating_company") or {}).get("selected_version") or {})
    sources = []
    for s in dd.get("datasources", [])[:MAX_SOURCES]:
        title = (s.get("publication_title") or s.get("comment") or "").strip()
        if len(title) > TITLE_MAX:
            title = title[:TITLE_MAX - 1] + "…"
        sources.append([s.get("type"), title, s.get("url") or "", s.get("date") or ""])
    out[did] = {
        "company": company.get("name_unknown") and None or company.get("name"),
        "investors": [i["name"] for i in (sv.get("top_investors") or [])][:4],
        "intention": sv.get("current_intention_of_investment") or [],
        "size_ha": sv.get("deal_size"),
        "year": sv.get("initiation_year"),
        "negotiation": sv.get("current_negotiation_status") or "",
        "implementation": sv.get("current_implementation_status") or "",
        "project": dd.get("project_name"),
        "nature": dd.get("nature_of_deal") or [],
        "contracts": [
            [c.get("number") or "", c.get("date") or "", c.get("expiration_date") or ""]
            for c in dd.get("contracts", [])
        ],
        "sources": sources,
    }

OUT.write_text(
    json.dumps(out, ensure_ascii=False, separators=(",", ":"))
)

n_energy = sum(
    1
    for v in out.values()
    if {"SOLAR_PARK", "WIND_FARM", "RENEWABLE_ENERGY", "BIOMASS_ENERGY_GENERATION"}
    & set(v["intention"])
)
print(f"  deals.json + deal_details.json: {len(deals)} deals")
print(f"  -> land_deal_info.json: {len(out)} deals ({n_energy} energy-related, "
      f"{OUT.stat().st_size // 1024} KB)")
