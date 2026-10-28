#!/usr/bin/env python3
"""Build a municipality/province centroid gazetteer from the plants inventory
(coordinate-bearing rows) -> app/public/data/gazetteer.json.

Used client-side to place coordinate-less awarded-contract projects at their
municipality (or province) centroid, clearly marked as approximate.
"""
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "public" / "data"

def norm(s):
    return (s or "").strip().lower().replace("city", "").replace("  ", " ").strip(" ,.")

def main():
    plants = json.loads((DATA / "plants.geojson").read_text())["features"]
    by_muni = defaultdict(list)
    by_prov = defaultdict(list)
    for f in plants:
        if not f["geometry"]:
            continue
        p = f["properties"]
        m, prov = p.get("municipality"), p.get("province")
        lon, lat = f["geometry"]["coordinates"]
        if m and prov:
            by_muni[(norm(m), norm(prov))].append((lon, lat))
        if prov:
            by_prov[norm(prov)].append((lon, lat))

    def centroid(pts):
        # geographic mean is fine for flagging-scale placement
        n = len(pts)
        return [round(sum(p[0] for p in pts) / n, 5), round(sum(p[1] for p in pts) / n, 5)]

    gaz = {"municipality": {}, "province": {}}
    for (m, prov), pts in by_muni.items():
        if len(pts) >= 1:
            gaz["municipality"].setdefault(m, centroid(pts))
    for prov, pts in by_prov.items():
        gaz["province"][prov] = centroid(pts)

    (DATA / "gazetteer.json").write_text(json.dumps(gaz))
    print(f"gazetteer: {len(gaz['municipality'])} municipalities, {len(gaz['province'])} provinces")

    # coverage check against awarded projects
    awarded = json.loads((DATA / "awarded_projects.geojson").read_text())["features"]
    hit_m = hit_p = miss = 0
    for f in awarded:
        p = f["properties"]
        m, prov = norm(p.get("municipality")), norm(p.get("province"))
        # municipality strings can be multi: 'Aringay and Caba' -> try each part
        parts = [x for x in m.replace(" and ", "|").split("|") if x]
        if any(x in gaz["municipality"] for x in parts):
            hit_m += 1
        elif prov in gaz["province"]:
            hit_p += 1
        else:
            miss += 1
    print(f"awarded coverage: {hit_m} municipality-level, {hit_p} province-level, {miss} unmatched")

if __name__ == "__main__":
    main()
