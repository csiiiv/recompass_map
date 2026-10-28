#!/usr/bin/env python3
"""Simplify sensitive-layer polygons to cut load size (Douglas-Peucker).

Protected areas: 14.8 MB -> target ~2-3 MB (tolerance ~0.002 deg at PH scale)
Land deals:      5.3 MB -> target ~1-2 MB
KBAs:            1.7 MB -> mild pass

Overlaps were computed on full detail; simplification changes distances by
< tolerance (~200 m), well inside the 5 km flag threshold, so re-running
03_overlaps is unnecessary. (Kept honest: distances shown remain from
full-geometry computation.)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "public" / "data"

TOLERANCES = {
    "protected_areas.geojson": 0.002,
    "land_deals.geojson": 0.0015,
    "kba.geojson": 0.001,
}


def perp_dist(p, a, b):
    """Perpendicular distance from point p to line ab."""
    px, py = p
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    if dx == dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    qx, qy = ax + t * dx, ay + t * dy
    return ((px - qx) ** 2 + (py - qy) ** 2) ** 0.5


def dp(points, tol):
    """Iterative Douglas-Peucker."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        s, e = stack.pop()
        dmax, idx = 0.0, -1
        for i in range(s + 1, e):
            d = perp_dist(points[i], points[s], points[e])
            if d > dmax:
                dmax, idx = d, i
        if dmax > tol and idx > 0:
            keep[idx] = True
            stack.append((s, idx))
            stack.append((idx, e))
    return [p for p, k in zip(points, keep) if k]


def simplify_geom(geom, tol):
    if geom is None:
        return None
    t = geom["type"]
    c = geom["coordinates"]
    if t == "Polygon":
        return {"type": t, "coordinates": [[dp(r, tol) for r in poly] for poly in [c]][0]}
    if t == "MultiPolygon":
        return {
            "type": t,
            "coordinates": [[dp(r, tol) for r in poly] for poly in c],
        }
    return geom


def main():
    for name, tol in TOLERANCES.items():
        path = DATA / name
        fc = json.loads(path.read_text())
        before = path.stat().st_size
        n_pts = 0
        n_pts_after = 0
        for f in fc["features"]:
            g = f["geometry"]
            if not g or g["type"] not in ("Polygon", "MultiPolygon"):
                continue
            # count before
            polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
            n_pts += sum(len(r) for poly in polys for r in poly)
            f["geometry"] = simplify_geom(g, tol)
            g2 = f["geometry"]
            polys2 = [g2["coordinates"]] if g2["type"] == "Polygon" else g2["coordinates"]
            n_pts_after += sum(len(r) for poly in polys2 for r in poly)
        # minify: separators without spaces
        out = json.dumps(fc, ensure_ascii=False, separators=(",", ":"))
        path.write_text(out)
        after = path.stat().st_size
        print(
            f"{name}: {before/1e6:.1f} MB -> {after/1e6:.1f} MB "
            f"({n_pts:,} -> {n_pts_after:,} pts, tol={tol})"
        )


if __name__ == "__main__":
    main()
