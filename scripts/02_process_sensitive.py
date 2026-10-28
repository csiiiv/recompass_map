#!/usr/bin/env python3
"""Process protected areas (WDPA), KBAs, MPAs, and Land Matrix into GeoJSON."""
import io
import json
import zipfile
from pathlib import Path

import shapefile

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "data_sources"
OUTDIR = ROOT / "app" / "public" / "data"
OUTDIR.mkdir(parents=True, exist_ok=True)

# WDPA 2026 field names (dbf fields truncated to 10 chars)
WDPA_KEEP = {
    "SITE_ID": "wdpa_id",
    "NAME_ENG": "name",
    "NAME": "orig_name",
    "DESIG": "desig",
    "DESIG_TYPE": "desig_type",
    "IUCN_CAT": "iucn_cat",
    "STATUS": "status",
    "STATUS_YR": "status_yr",
    "GOV_TYPE": "gov_type",
    "REP_AREA": "rep_area_km2",
    "REP_M_AREA": "rep_m_area_km2",
    "REALM": "realm",
    "NO_TAKE": "no_take",
    "ISO3": "iso",
}


def shp_to_features(reader, keep=None, rename=None, limit=None):
    feats = []
    fields = [f[0] for f in reader.fields[1:]]  # skip DeletionFlag
    for sr in reader.iterShapeRecords():
        rec = sr.record
        props = {}
        for i, f in enumerate(fields):
            v = rec[i]
            if isinstance(v, float) and v != v:
                v = None
            if isinstance(v, str):
                v = v.strip() or None
            props[f] = v
        if keep:
            props = {rename[k]: props.get(k) for k in keep if props.get(k) is not None}
        geom = None
        st = sr.shape.shapeType
        if st in (1, 11, 21):  # point
            geom = {"type": "Point", "coordinates": [round(sr.shape.points[0][0], 6), round(sr.shape.points[0][1], 6)]}
        elif st in (8, 18, 28):  # multipoint — take first point
            geom = {"type": "Point", "coordinates": [round(sr.shape.points[0][0], 6), round(sr.shape.points[0][1], 6)]}
        elif st in (3, 13, 23):  # polyline
            parts = list(sr.shape.parts) + [len(sr.shape.points)]
            lines = [
                [[round(x, 6), round(y, 6)] for x, y in sr.shape.points[parts[i] : parts[i + 1]]]
                for i in range(len(parts) - 1)
            ]
            geom = {"type": "MultiLineString", "coordinates": lines}
        elif st in (5, 15, 25):  # polygon
            parts = list(sr.shape.parts) + [len(sr.shape.points)]
            rings = [
                [[round(x, 6), round(y, 6)] for x, y in sr.shape.points[parts[i] : parts[i + 1]]]
                for i in range(len(parts) - 1)
            ]
            # naive: each ring is its own polygon (fine for overlap purposes)
            geom = {"type": "MultiPolygon", "coordinates": [[r] for r in rings]}
        feats.append({"type": "Feature", "geometry": geom, "properties": props})
        if limit and len(feats) >= limit:
            break
    return feats


def rings_to_multipoly(points, parts):
    rings = []
    parts = list(parts) + [len(points)]
    for i in range(len(parts) - 1):
        ring = [[round(x, 6), round(y, 6)] for x, y in points[parts[i] : parts[i + 1]]]
        if len(ring) >= 4:
            rings.append(ring)
    return rings


def read_wdpa():
    """WDPA PHL: 3 inner zips each holding polygons+points shapefiles; merge them."""
    all_feats = []
    outer = zipfile.ZipFile(DS / "WDPA_WDOECM_Oct2026_Public_PHL_shp.zip")
    for inner_name in [n for n in outer.namelist() if n.endswith(".zip")]:
        inner = zipfile.ZipFile(outer.open(inner_name))
        for kind in ("polygons", "points"):
            prefix = f"WDPA_WDOECM_Oct2026_Public_PHL_shp-{kind}"
            names = {n.split("/")[-1]: n for n in inner.namelist()}
            shp_io = io.BytesIO(inner.read(names[f"{prefix}.shp"]))
            dbf_io = io.BytesIO(inner.read(names[f"{prefix}.dbf"]))
            try:
                r = shapefile.Reader(shp=shp_io, dbf=dbf_io)
            except Exception as e:
                print(f"  !! {inner_name}/{kind}: {e}")
                continue
            n = len(r)
            feats = shp_to_features(r, keep=WDPA_KEEP, rename=WDPA_KEEP)
            # polygons carry a 'kind' marker
            for f in feats:
                f["properties"]["geom_kind"] = "polygon" if kind == "polygons" else "point"
            all_feats.extend(feats)
            print(f"  {inner_name}/{kind}: {n} records")
    return all_feats


def read_kba():
    z = zipfile.ZipFile(DS / "Philippines_KBA.zip")
    names = {n.split("/")[-1]: n for n in z.namelist()}
    r = shapefile.Reader(shp=io.BytesIO(z.read(names["Philippines_KBA.shp"])), dbf=io.BytesIO(z.read(names["Philippines_KBA.dbf"])))
    print(f"  KBA: {len(r)} records, fields {[f[0] for f in r.fields[1:]]}")
    feats = []
    for sr in r.iterShapeRecords():
        props = {}
        fields = [f[0] for f in r.fields[1:]]
        for i, f in enumerate(fields):
            v = sr.record[i]
            if isinstance(v, float) and v != v:
                v = None
            if isinstance(v, str):
                v = v.strip() or None
            props[f] = v
        rings = rings_to_multipoly(sr.shape.points, sr.shape.parts)
        geom = {"type": "MultiPolygon", "coordinates": [[ring] for ring in rings]} if rings else None
        feats.append({"type": "Feature", "geometry": geom, "properties": props})
    return feats


def read_mpa():
    z = zipfile.ZipFile(DS / "marineprotectedareas.zip")
    names = {n.split("/")[-1]: n for n in z.namelist()}
    r = shapefile.Reader(
        shp=io.BytesIO(z.read(names["MarineProtectedAreas.shp"])),
        dbf=io.BytesIO(z.read(names["MarineProtectedAreas.dbf"])),
        encoding="latin-1",
        encodingErrors="replace",
    )
    print(f"  MPA: {len(r)} records")
    return shp_to_features(r)


def read_landmatrix():
    g = json.loads((DS / "areas.geojson").read_text())
    print(f"  Land Matrix: {len(g['features'])} features")
    out = []
    for f in g["features"]:
        p = dict(f.get("properties") or {})
        f["properties"] = p
        out.append(f)
    return out


def write(name, feats):
    path = OUTDIR / name
    with_geom = sum(1 for f in feats if f["geometry"])
    path.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False))
    print(f"  -> {name}: {len(feats)} features ({with_geom} with geometry, {path.stat().st_size/1e6:.1f} MB)")


if __name__ == "__main__":
    print("WDPA protected areas:")
    write("protected_areas.geojson", read_wdpa())
    print("KBAs:")
    write("kba.geojson", read_kba())
    print("MPAs:")
    write("mpa.geojson", read_mpa())
    print("Land Matrix:")
    write("land_deals.geojson", read_landmatrix())
