"""
Keyword-based retrieval over parks records.
This is the 'R' in RAG — filter parks by overlap with the user query
before passing context to Gemini, so the model answers grounded in real data.
"""
from __future__ import annotations

REGION_KEYWORDS = {
    "เหนือ": ["north", "northern", "เหนือ"],
    "อีสาน": ["northeast", "north-east", "isan", "อีสาน", "ตะวันออกเฉียงเหนือ"],
    "กลาง": ["central", "กลาง"],
    "ตะวันออก": ["east", "eastern", "ตะวันออก"],
    "ตะวันตก": ["west", "western", "ตะวันตก"],
    "ใต้": ["south", "southern", "ใต้"],
}


def score_park(park: dict, query: str) -> int:
    """Higher score = more relevant. Scoring is substring-based so it
    works for Thai (no word segmentation needed)."""
    q = query.lower()
    score = 0

    name_th = (park.get("nameTh") or "").lower()
    if name_th and name_th in q:
        score += 10

    name_en = (park.get("nameEn") or "").lower()
    if name_en and name_en in q:
        score += 10

    for prov in park.get("provinces") or []:
        if prov and prov.lower() in q:
            score += 4

    region_th = park.get("region", "")
    for kw in REGION_KEYWORDS.get(region_th, []):
        if kw in q:
            score += 5
            break

    # Activity / feature hints (very lightweight — extendable later)
    feature_terms = {
        "ภูเขา": ["mountain", "ภูเขา", "ดอย", "ภู"],
        "ทะเล": ["sea", "ทะเล", "เกาะ", "หาด", "beach", "island"],
        "น้ำตก": ["waterfall", "น้ำตก"],
        "ถ้ำ": ["cave", "ถ้ำ"],
    }
    for keywords in feature_terms.values():
        if any(k in q for k in keywords):
            for k in keywords:
                if k in name_th:
                    score += 2
                    break
    return score


def retrieve(query: str, parks: list[dict], k: int = 15) -> list[dict]:
    """Return top-k most relevant parks for the query.
    Tie-break by larger area (more famous = often larger).
    Falls back to the k largest parks if no query matches."""
    if not query.strip():
        return parks[:k]

    scored = [
        (score_park(p, query), p.get("areaSqKm") or 0, i, p)
        for i, p in enumerate(parks)
    ]
    scored.sort(key=lambda x: (-x[0], -x[1], x[2]))

    matched = [p for s, _, _, p in scored if s > 0][:k]
    if matched:
        return matched

    # No keyword hits — return the k largest parks
    return [p for _, _, _, p in scored[:k]]


def park_to_context(park: dict) -> dict:
    """Trim a park record to the fields Gemini needs as context."""
    return {
        "name_th": park.get("nameTh"),
        "name_en": park.get("nameEn"),
        "provinces": park.get("provinces", []),
        "region": park.get("region"),
        "area_sqkm": park.get("areaSqKm"),
        "area_year": park.get("areaYear"),
        "latitude": park.get("latitude"),
        "longitude": park.get("longitude"),
        "dnp_url": park.get("dnpUrl"),
    }
