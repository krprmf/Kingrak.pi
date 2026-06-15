"""
Geocode parks via OSM Nominatim (free, no API key).
Reads data/processed/parks.json → updates lat/lng in place.
Caches results in data/processed/geocode_cache.json so reruns are idempotent.

Nominatim usage policy: max 1 req/sec, identify with User-Agent.
"""
from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARKS = ROOT / "data" / "processed" / "parks.json"
CACHE = ROOT / "data" / "processed" / "geocode_cache.json"

USER_AGENT = "PumLaewPai/0.1 (https://github.com/Kingrak; contact: kingrak.pi@gmail.com)"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

RATE_LIMIT_SEC = 1.1  # be a good citizen


def nominatim_search(query: str) -> tuple[float, float] | None:
    params = urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": 1, "countrycodes": "th"}
    )
    url = f"{NOMINATIM_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"    ! error: {e}")
    return None


def build_queries(park: dict) -> list[str]:
    name = park["nameTh"].replace("(เตรียมการ)", "").strip()
    province = park["provinces"][0] if park["provinces"] else ""
    queries = [
        f"อุทยานแห่งชาติ{name}",
        f"{name} National Park",
        f"อุทยานแห่งชาติ {name} {province}".strip(),
    ]
    # last-resort fallback: just the primary province (centroid)
    if province:
        queries.append(f"จังหวัด{province}")
    return queries


def main() -> int:
    parks = json.loads(PARKS.read_text(encoding="utf-8"))
    cache: dict[str, dict] = (
        json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    )

    total = len(parks)
    new_hits = 0
    failed: list[str] = []

    for i, p in enumerate(parks, 1):
        slug = p["slug"]
        cached = cache.get(slug)
        if cached and cached.get("lat") is not None:
            p["latitude"] = cached["lat"]
            p["longitude"] = cached["lng"]
            continue

        coords = None
        used_query = None
        for q in build_queries(p):
            print(f"[{i:3d}/{total}] {p['nameTh'][:30]:<30} → {q!r}")
            coords = nominatim_search(q)
            time.sleep(RATE_LIMIT_SEC)
            if coords:
                used_query = q
                break

        if coords:
            p["latitude"], p["longitude"] = coords
            cache[slug] = {"lat": coords[0], "lng": coords[1], "query": used_query}
            new_hits += 1
            print(f"    ✓ {coords[0]:.4f}, {coords[1]:.4f}")
        else:
            cache[slug] = {"lat": None, "lng": None, "query": None}
            failed.append(p["nameTh"])
            print(f"    ✗ not found")

        # save cache progressively (resume-safe)
        if i % 10 == 0:
            CACHE.write_text(
                json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"    [checkpoint] cache saved at {i}/{total}")

    # final save
    CACHE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    PARKS.write_text(
        json.dumps(parks, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print()
    have_coords = sum(1 for p in parks if p["latitude"] is not None)
    print(f"✓ done. {have_coords}/{total} parks have coordinates "
          f"({new_hits} new this run)")
    if failed:
        print(f"⚠ {len(failed)} failed: {failed[:5]}"
              + ("..." if len(failed) > 5 else ""))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
