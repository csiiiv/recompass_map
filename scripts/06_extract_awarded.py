#!/usr/bin/env python3
"""Extract awarded solar projects from the DOE summary PDF (31 May 2026)
using pdfplumber word positions -> awarded_projects.geojson.

Geometry: null (source has no coordinates). The webapp geocodes these to
municipality centroids on load (from a committed gazetteer built off the
plants inventory provinces/municipalities).
"""
import json
from collections import Counter
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "data_sources" / "(a) SUMMARY-OF-AWARDED-PROJECTS-AS-OF-31-May-2026.pdf"
OUT = ROOT / "app" / "public" / "data" / "awarded_projects.geojson"

ISLANDS = {"Luzon", "Visayas", "Mindanao"}
REGIONS = {
    "I", "II", "III", "IV-A", "IV-B", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "CAR", "NCR", "ARMM", "ARMM&X", "I", "II",
}

# x0 boundaries measured from page 1 word positions (points)
X = {
    "island": (0, 100),
    "region": (100, 145),
    "province": (145, 208),
    "municipality": (208, 272),
    "project": (272, 412),
    "company": (412, 592),
    "stage": (592, 660),
    "pot": (660, 700),
    "inst": (700, 780),
}

STAGES = {"Pre-Development", "Development", "Commercial Operation", "Construction", "Financing"}


def row_from_words(words):
    row = {k: [] for k in X}
    for w in words:
        for k, (a, b) in X.items():
            if a <= w["x0"] < b:
                row[k].append(w)
                break
    out = {}
    for k in X:
        out[k] = " ".join(w["text"] for w in sorted(row[k], key=lambda w: w["x0"]))
    return out


def num(v):
    if not v:
        return None
    v = v.replace(",", "")
    try:
        f = float(v)
        return None if f != f else f
    except ValueError:
        return None


def main():
    projects = []
    carry = {"island": None, "region": None, "province": None, "municipality": None}

    with pdfplumber.open(PDF) as pdf:
        for page in pdf.pages:
            words = page.extract_words()
            # group into rows by top coordinate (3pt tolerance)
            rows = {}
            for w in words:
                key = round(w["top"] / 3)
                rows.setdefault(key, []).append(w)

            for k in sorted(rows):
                ws = rows[k]
                row = row_from_words(ws)
                stage = row["stage"]
                # match stage allowing split across cells
                stage_full = f"{row['stage']}".strip()
                if not any(s in stage_full or s in row["pot"] for s in ()):
                    pass
                # normalize stage: sometimes 'Commercial Operation' splits
                if stage_full.startswith("Commercial"):
                    stage_full = "Commercial Operation"
                if stage_full not in STAGES:
                    # try region spillover (e.g., stage words in region col)
                    joined = f"{row['region']} {row['stage']}"
                    if any(s in joined for s in STAGES):
                        for s in STAGES:
                            if s in joined:
                                stage_full = s
                                break
                    else:
                        continue

                if not row["project"]:
                    continue

                rec = dict(row)
                rec["stage"] = stage_full
                for k in ("island", "region", "province", "municipality"):
                    v = rec[k].strip()
                    # island col may contain island+region+province merged
                    if k == "island" and v and not any(v.startswith(i) for i in ISLANDS):
                        # merged text like 'Luzon CAR Benguet' or just region
                        pass
                    if v:
                        carry[k] = v
                    else:
                        rec[k] = carry[k]

                # split merged island cell: 'Luzon   II   Isabela'-style
                island_raw = rec["island"] or ""
                first = island_raw.split(" ")[0] if island_raw else ""
                if first in ISLANDS:
                    island = first
                    # leftover region text in the island cell
                    leftover = island_raw[len(first):].strip()
                    if leftover and not rec["region"]:
                        rec["region"] = leftover
                else:
                    # continuation row where island col holds region code:
                    # keep carried island, treat cell as region if it looks like one
                    island = carry.get("__island") or (
                        rec["region"] and None
                    )
                    if first and (first in REGIONS or first.replace("-", "").replace("&", "A").isupper() == first.upper() and len(first) <= 6):
                        rec["region"] = island_raw
                carry["__island"] = island

                projects.append(
                    {
                        "type": "Feature",
                        "geometry": None,
                        "properties": {
                            "name": rec["project"],
                            "company": rec["company"],
                            "stage": stage_full,
                            "island": island if island in ISLANDS else carry.get("__island"),
                            "region": (rec["region"] or None),
                            "province": rec["province"],
                            "municipality": rec["municipality"],
                            "potential_mw": num(rec["pot"]),
                            "installed_mw": num(rec["inst"]),
                            "fuel": "Solar",
                            "source": "DOE awarded service contracts (31 May 2026)",
                            "geocode_status": "pending_municipality_centroid",
                        },
                    }
                )

    # clean noise rows (page furniture)
    projects = [
        p
        for p in projects
        if p["properties"]["name"]
        and p["properties"]["name"].lower() not in {"name", "project name"}
        and len(p["properties"]["name"]) > 3
    ]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {"type": "FeatureCollection", "features": projects},
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )
    print(f"wrote {len(projects)} projects -> {OUT}")
    print("stage:", Counter(p["properties"]["stage"] for p in projects).most_common())
    print("island:", Counter(p["properties"]["island"] for p in projects).most_common())
    bad_prov = sum(1 for p in projects if not p["properties"]["province"])
    print("rows without province:", bad_prov)
    tot = sum(p["properties"]["potential_mw"] or 0 for p in projects)
    print(f"total potential: {tot:,.1f} MW (PDF grand total: 31,584.26)")
    for p in projects[:4]:
        q = p["properties"]
        print(f"  {q['name'][:40]:42s} | {q['province'][:12]:14s} | {q['municipality'][:14]:16s} | {q['company'][:24]:26s} | {q['stage']} | {q['potential_mw']}")


if __name__ == "__main__":
    main()
