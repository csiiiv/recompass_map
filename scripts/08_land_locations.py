#!/usr/bin/env python3
"""Build the land_deal_sites point layer from Land Matrix locations.geojson.

locations.geojson complements areas.geojson: every deal there already has a
polygon here, but 210 deals exist ONLY as location points. This script keeps
one point per polygon-less deal at the best available accuracy:

  - EXACT_LOCATION / COORDINATES  -> kept for display AND 5 km overlap test
  - APPROXIMATE_LOCATION          -> display only
  - ADMINISTRATIVE_REGION / COUNTRY centroids -> dropped (province/island
    centroids would falsely flag every nearby plant in the overlap analysis)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "data_sources"
OUT = ROOT / "app" / "public" / "data" / "land_deal_sites.geojson"

RANK = {"EXACT_LOCATION": 0, "COORDINATES": 1, "APPROXIMATE_LOCATION": 2}
KEEP = set(RANK)

locations = json.loads((DS / "locations.geojson").read_text())["features"]
areas = json.loads((DS / "areas.geojson").read_text())["features"]
polygon_deals = {f["properties"].get("deal_id") for f in areas}

kept = {}
for f in locations:
    p = f.get("properties") or {}
    acc = p.get("level_of_accuracy")
    if p.get("deal_id") in polygon_deals:
        continue  # already covered by a polygon
    if acc not in KEEP:
        continue  # too coarse
    if not f.get("geometry"):
        continue
    did = p["deal_id"]
    if did not in kept or RANK[acc] < RANK[kept[did]["properties"]["level_of_accuracy"]]:
        kept[did] = f

feats = sorted(kept.values(), key=lambda f: f["properties"]["deal_id"])
for f in feats:
    p = f["properties"]
    p["precise"] = p["level_of_accuracy"] in ("EXACT_LOCATION", "COORDINATES")

OUT.write_text(
    json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False)
)

n_precise = sum(1 for f in feats if f["properties"]["precise"])
print(f"  locations: {len(locations)} pts / {len({f['properties'].get('deal_id') for f in locations})} deals")
print(f"  areas:     {len(areas)} polygons / {len(polygon_deals)} deals")
print(f"  -> land_deal_sites.geojson: {len(feats)} pts ({n_precise} precise, {len(feats)-n_precise} approximate)")
