#!/usr/bin/env python3
"""Extract awarded RE service contracts -> awarded_projects.geojson.

Primary source: Awarded_RE_Service_Contracts.xlsx (multi-tech DOE register).
Geometry: null (no coordinates in source). The webapp geocodes to
municipality/province centroids via gazetteer.json on load.

PDF extracts (scripts legacy / provenance) remain in data_sources/ but are
not the ingest path — pass --pdf only for a solar-only audit against the
May 2026 summary PDF.
"""
import argparse
import json
from collections import Counter
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "data_sources"
XLSX = DS / "Awarded_RE_Service_Contracts.xlsx"
PDF = DS / "(a) SUMMARY-OF-AWARDED-PROJECTS-AS-OF-31-May-2026.pdf"
OUT = ROOT / "app" / "public" / "data" / "awarded_projects.geojson"

# Sheet Technology → map fuel key (aligned with plant FUEL_COLORS where possible)
TECH_TO_FUEL = {
    "Solar": "Solar",
    "Wind": "Wind",
    "Hydropower": "Hydro",
    "Geothermal": "Geothermal",
    "Biomass - Commercial": "Biomass",
    "Biomass - Own-Use": "Biomass",
    "Ocean": "Ocean",
}

ISLANDS = {"Luzon", "Visayas", "Mindanao"}


def num(v):
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        f = float(v)
        return None if f != f else f
    s = str(v).replace(",", "").strip()
    try:
        f = float(s)
        return None if f != f else f
    except ValueError:
        return None


def clean_str(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def from_xlsx(path):
    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb["DATABASE"]
    rows = list(ws.iter_rows(values_only=True))
    headers = [clean_str(h) or f"col{i}" for i, h in enumerate(rows[0])]
    # Expected columns (tolerant to minor renames)
    idx = {h: i for i, h in enumerate(headers)}

    def col(*names):
        for n in names:
            if n in idx:
                return idx[n]
        raise KeyError(f"none of {names} in {headers}")

    i_tech = col("Technology")
    i_island = col("Island")
    i_region = col("Region")
    i_prov = col("Province")
    i_muni = col("City / Municipality", "Municipality", "City/Municipality")
    i_name = col("Project Name")
    i_co = col("Company Name")
    i_stage = col("Stage of Contract", "Stage")
    i_pot = col("Potential Capacity (MW)", "Potential Capacity")
    i_inst = col("Installed Capacity (MW)", "Installed Capacity")

    features = []
    for row in rows[1:]:
        tech = clean_str(row[i_tech])
        if not tech:
            continue
        name = clean_str(row[i_name])
        if not name or len(name) <= 3:
            continue
        fuel = TECH_TO_FUEL.get(tech, tech)
        island = clean_str(row[i_island])
        if island and island not in ISLANDS:
            # keep as-is; geocoder doesn't use island for placement
            pass
        features.append(
            {
                "type": "Feature",
                "geometry": None,
                "properties": {
                    "name": name,
                    "company": clean_str(row[i_co]),
                    "stage": clean_str(row[i_stage]),
                    "island": island if island in ISLANDS else island,
                    "region": clean_str(row[i_region]),
                    "province": clean_str(row[i_prov]),
                    "municipality": clean_str(row[i_muni]),
                    "potential_mw": num(row[i_pot]),
                    "installed_mw": num(row[i_inst]),
                    "fuel": fuel,
                    "tech_detail": tech,  # Sheet wording (e.g. Biomass - Own-Use)
                    "source": "DOE awarded RE service contracts (Sheet export)",
                    "geocode_status": "pending_municipality_centroid",
                },
            }
        )
    return features


def from_pdf(path):
    """Legacy solar-only PDF parser (audit). Requires pdfplumber."""
    import pdfplumber

    STAGES = {
        "Pre-Development",
        "Development",
        "Commercial Operation",
        "Construction",
        "Financing",
    }
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
    REGIONS = {
        "I", "II", "III", "IV-A", "IV-B", "V", "VI", "VII", "VIII", "IX", "X",
        "XI", "XII", "XIII", "CAR", "NCR", "ARMM", "ARMM&X",
    }

    def row_from_words(words):
        row = {k: [] for k in X}
        for w in words:
            for k, (a, b) in X.items():
                if a <= w["x0"] < b:
                    row[k].append(w)
                    break
        return {k: " ".join(w["text"] for w in sorted(row[k], key=lambda w: w["x0"])) for k in X}

    projects = []
    carry = {"island": None, "region": None, "province": None, "municipality": None}
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            words = page.extract_words()
            rows = {}
            for w in words:
                key = round(w["top"] / 3)
                rows.setdefault(key, []).append(w)
            for k in sorted(rows):
                row = row_from_words(rows[k])
                stage_full = row["stage"].strip()
                if stage_full.startswith("Commercial"):
                    stage_full = "Commercial Operation"
                if stage_full not in STAGES:
                    joined = f"{row['region']} {row['stage']}"
                    hit = next((s for s in STAGES if s in joined), None)
                    if not hit:
                        continue
                    stage_full = hit
                if not row["project"]:
                    continue
                for key in ("island", "region", "province", "municipality"):
                    v = row[key].strip()
                    if v:
                        carry[key] = v
                    else:
                        row[key] = carry[key] or ""
                island_raw = row["island"] or ""
                first = island_raw.split(" ")[0] if island_raw else ""
                if first in ISLANDS:
                    island = first
                    leftover = island_raw[len(first) :].strip()
                    if leftover and not row["region"]:
                        row["region"] = leftover
                else:
                    island = carry.get("__island")
                    if first and (first in REGIONS or len(first) <= 6):
                        row["region"] = island_raw
                carry["__island"] = island
                projects.append(
                    {
                        "type": "Feature",
                        "geometry": None,
                        "properties": {
                            "name": row["project"],
                            "company": row["company"],
                            "stage": stage_full,
                            "island": island if island in ISLANDS else carry.get("__island"),
                            "region": row["region"] or None,
                            "province": row["province"],
                            "municipality": row["municipality"],
                            "potential_mw": num(row["pot"]),
                            "installed_mw": num(row["inst"]),
                            "fuel": "Solar",
                            "tech_detail": "Solar",
                            "source": "DOE awarded service contracts (31 May 2026 PDF)",
                            "geocode_status": "pending_municipality_centroid",
                        },
                    }
                )
    return [
        p
        for p in projects
        if p["properties"]["name"]
        and p["properties"]["name"].lower() not in {"name", "project name"}
        and len(p["properties"]["name"]) > 3
    ]


def write_features(features):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {"type": "FeatureCollection", "features": features},
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )
    print(f"wrote {len(features)} projects -> {OUT}")
    print("fuel:", Counter(p["properties"]["fuel"] for p in features).most_common())
    print("tech_detail:", Counter(p["properties"].get("tech_detail") for p in features).most_common())
    print("stage:", Counter(p["properties"]["stage"] for p in features).most_common())
    print("island:", Counter(p["properties"]["island"] for p in features).most_common(6))
    pot = sum(p["properties"]["potential_mw"] or 0 for p in features)
    inst = sum(p["properties"]["installed_mw"] or 0 for p in features)
    print(f"total potential: {pot:,.1f} MW | installed: {inst:,.1f} MW")
    offshore = sum(
        1
        for p in features
        if (p["properties"].get("municipality") or "").strip().lower() == "(offshore)"
    )
    print(f"municipality '(Offshore)': {offshore}")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--pdf",
        action="store_true",
        help="Audit path: parse solar-only May 2026 PDF instead of the Sheet",
    )
    args = ap.parse_args()
    if args.pdf:
        print(f"PDF audit mode: {PDF}")
        features = from_pdf(PDF)
    else:
        print(f"Sheet ingest: {XLSX}")
        features = from_xlsx(XLSX)
    write_features(features)


if __name__ == "__main__":
    main()
