#!/usr/bin/env python3
"""Compute overlap flags: for each plant, which sensitive layers it sits inside
or within 5 km of. Uses point-in-polygon + approximate euclidean ring checks
(no shapely needed; adequate for flagging at this scale).

Outputs app/public/data/overlaps.json keyed by plant index.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "public" / "data"
BUFFER_KM = 5.0


def rings_of(geom):
    """Yield (ring_coords, is_polygon_ring) tuples from a geometry."""
    g = geom
    if g is None:
        return
    t = g["type"]
    if t == "Polygon":
        for ring in g["coordinates"]:
            yield ring, True
    elif t == "MultiPolygon":
        for poly in g["coordinates"]:
            for ring in poly:
                yield ring, True
    elif t == "LineString":
        yield g["coordinates"], False
    elif t == "MultiLineString":
        for line in g["coordinates"]:
            yield line, False


def point_in_ring(pt, ring):
    x, y = pt
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def dist_to_ring_km(pt, ring):
    """min distance from pt to ring segments, converted to km (lat-adjusted)."""
    x, y = pt
    kx = 111.32 * math.cos(math.radians(y))  # km per degree lon
    ky = 110.57
    best = float("inf")
    n = len(ring)
    for i in range(n - 1):
        ax, ay = ring[i]
        bx, by = ring[i + 1]
        dx, dy = (bx - ax) * kx, (by - ay) * ky
        px, py = (x - ax) * kx, (y - ay) * ky
        seg2 = dx * dx + dy * dy
        if seg2 == 0:
            d2 = px * px + py * py
        else:
            t = max(0.0, min(1.0, (px * dx + py * dy) / seg2))
            qx, qy = px - t * dx, py - t * dy
            d2 = qx * qx + qy * qy
        if d2 < best:
            best = d2
    return math.sqrt(best)


def bbox_hit(pt, bbox, pad=0.05):
    return bbox[0] - pad <= pt[0] <= bbox[2] + pad and bbox[1] - pad <= pt[1] <= bbox[3] + pad


def feature_bbox(geom):
    xs, ys = [], []
    for ring, _ in rings_of(geom):
        for x, y in ring:
            xs.append(x)
            ys.append(y)
    if not xs:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]


def centroid_of(geom):
    ring = next(rings_of(geom), None)
    if not ring:
        return None
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return [sum(xs) / len(xs), sum(ys) / len(ys)]


def overlaps_for(plants, sensitive, layer_id, label_key):
    """For each plant point, find sensitive features inside/within BUFFER_KM."""
    # pre-index polygons with bboxes
    indexed = []
    for i, f in enumerate(sensitive):
        geom = f["geometry"]
        if geom is None:
            continue
        if geom["type"] == "Point":
            c = geom["coordinates"]
            bb = [c[0], c[1], c[0], c[1]]
            indexed.append((i, None, bb, c))
            continue
        bb = feature_bbox(geom)
        if bb is None:
            continue
        indexed.append((i, geom, bb, None))
    result = {}
    for pi, p in enumerate(plants):
        if p["geometry"] is None:
            continue
        pt = p["geometry"]["coordinates"]
        hits = []
        for si, geom, bb, center in indexed:
            # bbox pre-filter with ~5km padding (~0.045 deg)
            if not (bb[0] - 0.045 <= pt[0] <= bb[2] + 0.045 and bb[1] - 0.045 <= pt[1] <= bb[3] + 0.045):
                continue
            if geom is None:  # point feature (MPA pin)
                dx = (pt[0] - center[0]) * 111.32 * math.cos(math.radians(pt[1]))
                dy = (pt[1] - center[1]) * 110.57
                d = math.sqrt(dx * dx + dy * dy)
                if d <= BUFFER_KM:
                    hits.append({"i": si, "rel": "within 5 km", "d_km": round(d, 2)})
                continue
            inside = any(point_in_ring(pt, ring) for ring, is_poly in rings_of(geom) if is_poly)
            if inside:
                hits.append({"i": si, "rel": "inside", "d_km": 0.0})
                continue
            d = min((dist_to_ring_km(pt, ring) for ring, _ in rings_of(geom)), default=math.inf)
            if d <= BUFFER_KM:
                hits.append({"i": si, "rel": "within 5 km", "d_km": round(d, 2)})
        if hits:
            result[pi] = [
                {**h, "layer": layer_id, "name": _name(sensitive[h["i"]], label_key)} for h in hits
            ]
    return result


def _name(f, label_key):
    p = f["properties"]
    for k in label_key:
        v = p.get(k)
        if v:
            return str(v)
    return "Unnamed"


def main():
    plants = json.loads((DATA / "plants.geojson").read_text())["features"]
    layers = {
        "protected_areas": (
            json.loads((DATA / "protected_areas.geojson").read_text())["features"],
            ["name"],
        ),
        "kba": (json.loads((DATA / "kba.geojson").read_text())["features"], ["IntName", "NatName"]),
        "mpa": (json.loads((DATA / "mpa.geojson").read_text())["features"], ["NAME", "SITE_CODE"]),
        "land_deals": (json.loads((DATA / "land_deals.geojson").read_text())["features"], ["name", "facility_name"]),
        # precise location pins for deals that have no polygon; approximate
        # ones are display-only (see scripts/08_land_locations.py)
        "land_deal_sites": (
            [
                f
                for f in json.loads((DATA / "land_deal_sites.geojson").read_text())["features"]
                if f["properties"].get("precise")
            ],
            ["name", "facility_name"],
        ),
    }

    all_overlaps = {pi: [] for pi in range(len(plants))}
    for layer_id, (feats, keys) in layers.items():
        res = overlaps_for(plants, feats, layer_id, keys)
        n_plants = len(res)
        n_inside = sum(1 for v in res.values() for h in v if h["rel"] == "inside")
        n_near = sum(1 for v in res.values() for h in v if h["rel"] != "inside")
        print(f"{layer_id}: {n_plants} plants flagged ({n_inside} inside, {n_near} within 5km)")
        for pi, hits in res.items():
            all_overlaps[pi].extend(hits)

    out = {str(pi): hits for pi, hits in all_overlaps.items() if hits}
    (DATA / "overlaps.json").write_text(json.dumps(out, ensure_ascii=False))
    flagged = len(out)
    print(f"\n-> overlaps.json: {flagged}/{len(plants)} plants flagged")
    from collections import Counter

    c = Counter(h["layer"] for v in out.values() for h in v)
    print("flags by layer:", c.most_common())


if __name__ == "__main__":
    main()
