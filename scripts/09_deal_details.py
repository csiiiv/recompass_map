#!/usr/bin/env python3
"""Fetch per-deal details from the Land Matrix API into deal_details.json.

deals.json (and the /api/deals/ list endpoint it came from) carry only a
slim location schema {nid, point, level_of_accuracy}. The per-deal endpoint
https://landmatrix.org/api/deals/<id>/ additionally has:

  - location details: name, description, facility_name, comment
  - contracts: number, date, expiration date, duration
  - datasources: type, publication title, date, url, comment
  - project_name, nature_of_deal

This script fetches every deal listed in deals.json (rate-limited,
resumable — already-fetched deals are skipped unless --refresh) and stores
a slim extract to data_sources/deal_details.json keyed by deal id. Polygons
are NOT stored (areas.geojson already has them where they exist).
"""
import argparse
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "data_sources"
OUT = DS / "deal_details.json"

API = "https://landmatrix.org/api/deals/{}/"
SLEEP = 0.4  # seconds between requests (politeness)
RETRY_WAITS = (2, 5, 15)
USER_AGENT = "recompass-data-pipeline/1.0 (research; contact via repo)"


def fetch(deal_id):
    req = urllib.request.Request(API.format(deal_id), headers={"User-Agent": USER_AGENT})
    last_err = None
    for wait in RETRY_WAITS + (None,):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001 — retry any network/HTTP error
            last_err = e
            if wait is None:
                raise
            time.sleep(wait)
    raise last_err  # unreachable


def slim(deal):
    sv = deal.get("selected_version") or {}
    locs = [
        {k: loc.get(k) for k in ("nid", "name", "description", "facility_name", "level_of_accuracy")}
        for loc in sv.get("locations", [])
    ]
    contracts = [
        {k: c.get(k) for k in ("number", "date", "expiration_date", "agreement_duration", "comment")}
        for c in sv.get("contracts", [])
    ]
    sources = [
        {**{k: s.get(k) for k in ("type", "publication_title", "date", "url", "comment", "file_not_public")},
         "has_file": bool(s.get("file"))}
        for s in sv.get("datasources", [])
    ]
    nature = sv.get("nature_of_deal")
    return {
        "fully_updated_at": deal.get("fully_updated_at"),
        "project_name": sv.get("project_name") or None,
        "nature_of_deal": nature if isinstance(nature, list) and nature else None,
        "locations": locs,
        "contracts": contracts,
        "datasources": sources,
    }


def write_out(data):
    deals = data["deals"]
    data["meta"].update({
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "deals": len(deals),
        "deals_with_contracts": sum(1 for d in deals.values() if d["contracts"]),
        "deals_with_datasources": sum(1 for d in deals.values() if d["datasources"]),
    })
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--refresh", action="store_true",
                    help="re-fetch deals already present in deal_details.json")
    ap.add_argument("--limit", type=int, default=None,
                    help="fetch at most N deals (for testing)")
    args = ap.parse_args()

    deal_ids = [d["id"] for d in json.loads((DS / "deals.json").read_text())]
    if args.limit is not None:
        deal_ids = deal_ids[: args.limit]

    data = {"meta": {"endpoint": API}, "deals": {}}
    if OUT.exists() and not args.refresh:
        prev = json.loads(OUT.read_text())
        if prev.get("meta", {}).get("endpoint") == API:
            data["deals"].update(prev.get("deals", {}))

    fetched = skipped = failed = 0
    for i, did in enumerate(deal_ids, 1):
        if str(did) in data["deals"]:
            skipped += 1
            continue
        try:
            data["deals"][str(did)] = slim(fetch(did))
        except Exception as e:  # noqa: BLE001 — log and continue with the rest
            print(f"  deal {did}: FAILED ({e})", file=sys.stderr)
            failed += 1
            continue
        fetched += 1
        if fetched % 10 == 0:
            write_out(data)  # checkpoint (crash-resumable)
            print(f"  {i}/{len(deal_ids)} fetched…", flush=True)
        time.sleep(SLEEP)

    write_out(data)
    m = data["meta"]
    print(f"  deals.json:      {len(deal_ids)} deals to fetch")
    print(f"  fetched:         {fetched} (skipped {skipped} cached, {failed} failed)")
    print(f"  -> deal_details.json: {m['deals']} deals | "
          f"{m['deals_with_contracts']} with contracts | "
          f"{m['deals_with_datasources']} with datasources")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
