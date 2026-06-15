"""
ETL: DNP raw CSVs → data/processed/parks.json

Steps (see WEEKEND_1.md §2.4):
  1. Load nationalparksname.csv (TIS-620) + nparea6467.csv (UTF-8-SIG)
  2. Normalize: strip "อุทยานแห่งชาติ" prefix, trim columns, split multi-province
  3. Derive: slug (from DNP contentId), region (6-region map)
  4. Join: latest-year area per park
  5. Validate: row count, dup slugs, unmatched warnings
  6. Write: parks.json (UTF-8, indent=2)
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed" / "parks.json"

PARKS_CSV = RAW / "nationalparksname.csv"
AREA_CSV = RAW / "nparea6467.csv"

PREFIX = "อุทยานแห่งชาติ"

# 6-region canonical map (NESDB classification)
REGION_MAP: dict[str, str] = {
    # ภาคเหนือ
    **{p: "เหนือ" for p in [
        "เชียงราย", "เชียงใหม่", "น่าน", "พะเยา", "แพร่",
        "แม่ฮ่องสอน", "ลำปาง", "ลำพูน", "อุตรดิตถ์",
    ]},
    # ภาคตะวันออกเฉียงเหนือ (อีสาน)
    **{p: "อีสาน" for p in [
        "กาฬสินธุ์", "ขอนแก่น", "ชัยภูมิ", "นครพนม", "นครราชสีมา",
        "บึงกาฬ", "บุรีรัมย์", "มหาสารคาม", "มุกดาหาร", "ยโสธร",
        "ร้อยเอ็ด", "เลย", "ศรีสะเกษ", "สกลนคร", "สุรินทร์",
        "หนองคาย", "หนองบัวลำภู", "อำนาจเจริญ", "อุดรธานี", "อุบลราชธานี",
    ]},
    # ภาคกลาง
    **{p: "กลาง" for p in [
        "กรุงเทพมหานคร", "กำแพงเพชร", "ชัยนาท", "นครนายก", "นครปฐม",
        "นครสวรรค์", "นนทบุรี", "ปทุมธานี", "พระนครศรีอยุธยา", "พิจิตร",
        "พิษณุโลก", "เพชรบูรณ์", "ลพบุรี", "สมุทรปราการ", "สมุทรสงคราม",
        "สมุทรสาคร", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี",
        "อ่างทอง", "อุทัยธานี",
    ]},
    # ภาคตะวันออก
    **{p: "ตะวันออก" for p in [
        "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ตราด", "ปราจีนบุรี",
        "ระยอง", "สระแก้ว",
    ]},
    # ภาคตะวันตก
    **{p: "ตะวันตก" for p in [
        "กาญจนบุรี", "ตาก", "ประจวบคีรีขันธ์", "เพชรบุรี", "ราชบุรี",
    ]},
    # ภาคใต้
    **{p: "ใต้" for p in [
        "กระบี่", "ชุมพร", "ตรัง", "นครศรีธรรมราช", "นราธิวาส",
        "ปัตตานี", "พังงา", "พัทลุง", "ภูเก็ต", "ยะลา",
        "ระนอง", "สงขลา", "สตูล", "สุราษฎร์ธานี",
    ]},
}


def normalize_park_name(name: str) -> str:
    """Strip 'อุทยานแห่งชาติ' prefix + whitespace for matching."""
    n = name.strip()
    if n.startswith(PREFIX):
        n = n[len(PREFIX):].strip()
    return n


def split_provinces(raw: str) -> list[str]:
    """Split multi-province string by whitespace, drop empties."""
    return [p.strip() for p in re.split(r"\s+", raw.strip()) if p.strip()]


def derive_region(provinces: list[str]) -> tuple[str, list[str]]:
    """Return (region, unknown_provinces)."""
    unknown: list[str] = []
    for p in provinces:
        if p in REGION_MAP:
            return REGION_MAP[p], unknown
        unknown.append(p)
    return "กลาง", unknown  # fallback


def extract_content_id(url: str) -> str | None:
    """Pull contentId query param from DNP URL → used as slug suffix."""
    try:
        q = parse_qs(urlparse(url).query)
        cid = q.get("contentId", [None])[0]
        return cid if cid and cid.isdigit() else None
    except Exception:
        return None


def build_area_index(area_df: pd.DataFrame) -> dict[str, dict]:
    """
    Index area data by normalized park name → latest-year record.
    Returns {normalized_name: {areaSqKm, areaRai, year}}.
    """
    # column header has trailing space — clean once
    area_df = area_df.rename(columns=lambda c: c.strip())
    # area columns may be string (with commas) or float
    def to_float(v) -> float | None:
        if pd.isna(v):
            return None
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).replace(",", "").strip()
        try:
            return float(s)
        except ValueError:
            return None

    index: dict[str, dict] = {}
    for _, row in area_df.iterrows():
        name = normalize_park_name(str(row["หน่วยงาน"]))
        year = int(row["ปี"])
        rec = {
            "year": year,
            "areaSqKm": to_float(row["พื้นที่ (ตารางกิโลเมตร)"]),
            "areaRai": to_float(row["พื้นที่ (ไร่)"]),
            "provinces": split_provinces(str(row["จังหวัด"])),
        }
        prev = index.get(name)
        if prev is None or year > prev["year"]:
            index[name] = rec
    return index


def main() -> int:
    if not PARKS_CSV.exists() or not AREA_CSV.exists():
        print(f"ERROR: missing raw files in {RAW}", file=sys.stderr)
        return 1

    print(f"→ loading {PARKS_CSV.name} (TIS-620)")
    parks_df = pd.read_csv(PARKS_CSV, encoding="tis-620")
    parks_df = parks_df.rename(columns=lambda c: c.strip())

    print(f"→ loading {AREA_CSV.name} (UTF-8-SIG)")
    area_df = pd.read_csv(AREA_CSV, encoding="utf-8-sig")
    area_index = build_area_index(area_df)
    print(f"  area_index has {len(area_index)} unique parks")

    today = date.today().isoformat()
    records: list[dict] = []
    seen_slugs: set[str] = set()
    unmatched: list[str] = []
    unknown_provinces: set[str] = set()
    duplicate_slugs: list[str] = []

    for i, row in parks_df.iterrows():
        name_th = str(row["อุทยานแห่งชาติ"]).strip()
        province_raw = str(row["จังหวัด"]).strip()
        url = str(row["URL"]).strip()

        content_id = extract_content_id(url)
        slug = f"park-{content_id}" if content_id else f"park-row-{i}"
        if slug in seen_slugs:
            duplicate_slugs.append(slug)
            slug = f"{slug}-dup{i}"
        seen_slugs.add(slug)

        area = area_index.get(name_th)
        if area is None:
            unmatched.append(name_th)

        # provinces: union of parks-list (primary) + area-list (multi-province enrichment)
        base_provinces = split_provinces(province_raw)
        if area and area.get("provinces"):
            seen: set[str] = set()
            provinces = []
            for p in [*base_provinces, *area["provinces"]]:
                if p and p not in seen:
                    seen.add(p)
                    provinces.append(p)
        else:
            provinces = base_provinces

        region, unknowns = derive_region(provinces)
        unknown_provinces.update(unknowns)

        park = {
            "slug": slug,
            "nameTh": name_th,
            "nameEn": None,  # enriched later via Claude API
            "provinces": provinces,
            "region": region,
            "areaSqKm": area["areaSqKm"] if area else None,
            "areaRai": area["areaRai"] if area else None,
            "areaYear": area["year"] if area else None,
            "latitude": None,  # geocoded later via Nominatim
            "longitude": None,
            "dnpUrl": url,
            "source": {
                "dataset": "catalog.dnp.go.th: nationalparksname + areaofnp",
                "fetchedAt": today,
            },
        }
        records.append(park)

    # validate
    print()
    print(f"✓ wrote {len(records)} park records")
    if duplicate_slugs:
        print(f"⚠ duplicate slugs found: {duplicate_slugs}")
    if unmatched:
        print(f"⚠ {len(unmatched)} parks have no area data: {unmatched[:5]}{'...' if len(unmatched) > 5 else ''}")
    if unknown_provinces:
        print(f"⚠ unknown provinces (defaulted to 'กลาง'): {sorted(unknown_provinces)}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n✓ output: {OUT.relative_to(ROOT)}")

    # quick region distribution sanity check
    from collections import Counter
    region_counts = Counter(r["region"] for r in records)
    print(f"\nRegion distribution:")
    for region, count in region_counts.most_common():
        print(f"  {region:<10} {count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
