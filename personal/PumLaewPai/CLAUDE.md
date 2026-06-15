# CLAUDE.md — Instructions for Claude Code

> Place this in repo root. Claude Code reads this automatically.

## Project Context

This is **PumLaewPai (ปั๊มแล้วไป)** — a Streamlit web app for exploring Thailand's national parks (~156 records from DNP open data). It combines an analytics dashboard, interactive map, and AI assistant grounded in Thai government open data.

The owner is a Data Scientist at VEKIN, building this as a portfolio side project with limited time (2-3 hours per weekend). **Python-only stack.** Owner is comfortable with pandas/scripting but is new to web frameworks; do NOT introduce React/TypeScript/Tailwind unless explicitly asked.

## Tech Stack

- **Python 3.11** in `.venv/` (isolated from system anaconda)
- **Streamlit** — main web framework (pure Python, no HTML/JS)
- **Folium + streamlit-folium** — interactive map (Leaflet under the hood)
- **Pandas** — data loading + filtering
- **Plotly** (optional) — fancier charts
- **JSON files** in `data/processed/` — data source (no database)
- **Claude API** (Anthropic SDK) — chatbot
- **Streamlit Community Cloud** — deployment

## Working Principles

1. **Python-only.** Don't reach for JS/TS/HTML/CSS unless the user explicitly asks. If a feature seems to need it, propose a Streamlit-native alternative first.
2. **Ship MVP first, polish later.** Don't add features outside the current weekend's scope.
3. **Bilingual comments OK** — Thai for domain (อุทยาน, จังหวัด, ภาค), English for code logic.
4. **Always handle Thai encoding** when reading government CSV/XLSX. `nationalparksname.csv` = **TIS-620**; `nparea6467.csv` = **UTF-8-SIG**.
5. **No premature optimization.** No caching layers, no CDN, no analytics dashboards until users exist.
6. **No database until proven needed.** JSON files + `st.session_state` cover MVP.
7. **Explain new concepts** before using them — owner is learning. One sentence about WHAT and WHY before WRITING the code.

## Code Style

- Python: PEP 8, type hints where helpful (`list[dict]`, `Path`)
- snake_case for variables/functions, PascalCase for classes
- JSON keys: camelCase (`nameTh`, `areaSqKm`) — matches DNP-style
- Comments in Thai are fine for domain terms

## Folder Structure

```
PumLaewPai/
├── app.py                    # Streamlit entry point (run: streamlit run app.py)
├── pages/                    # Streamlit auto-routes these
│   ├── 1_🗺️_Map.py
│   ├── 2_📊_Insights.py
│   └── 3_🤖_Chat.py
├── lib/                      # shared helpers
│   ├── data.py               # load parks.json, filtering helpers
│   ├── stamps.py             # stamp book session state
│   └── llm.py                # Claude API wrapper
├── data/
│   ├── raw/                  # gitignored — DNP CSV/XLSX
│   └── processed/
│       ├── parks.json        # 156 parks (committed — source of truth)
│       └── *.embeddings.json # for chatbot RAG (later)
├── scripts/
│   ├── inspect_data.py       # inspect raw CSVs
│   ├── etl_parks.py          # CSV → parks.json
│   ├── geocode.py            # add lat/lng via OSM Nominatim
│   └── enrich_names.py       # add nameEn via Claude API
├── .venv/                    # gitignored — Python virtual env
├── requirements.txt          # pip install -r requirements.txt
└── .streamlit/
    └── config.toml           # theme + page config
```

## Running the App

```bash
# first time only
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# every time
source .venv/bin/activate
streamlit run app.py
# opens browser at http://localhost:8501
```

## Data Handling Rules

- **Never commit raw data files** (`.gitignore` covers `data/raw/`)
- **Commit `data/processed/*.json`** — these are the live data the app reads
- **Always cite data source** in UI footer + JSON records (`source` field)
- **Use slug as stable identifier** (e.g. `park-640`), not name
- **Lat/lng must be numeric** — validate during ETL
- **Province → region mapping** uses canonical 6-region list (เหนือ/อีสาน/กลาง/ตะวันออก/ตะวันตก/ใต้)
- **Multi-province parks** are common — store `provinces: list[str]`

## Park Data Schema

`data/processed/parks.json` is a list of objects:

```python
{
  "slug": "park-640",                  # derived from DNP contentId
  "nameTh": "เขาใหญ่",
  "nameEn": None,                       # enriched later via Claude API
  "provinces": ["นครราชสีมา", ...],     # multi-province support
  "region": "อีสาน",                    # one of 6
  "areaSqKm": 2165.55,
  "areaRai": 1353471.53,
  "areaYear": 2567,
  "latitude": None,                     # geocoded later via Nominatim
  "longitude": None,
  "dnpUrl": "https://portal.dnp.go.th/...",
  "source": {"dataset": "...", "fetchedAt": "2026-05-13"}
}
```

## Chatbot Behavior (when we build it)

- Use `st.chat_input` + `st.chat_message` (Streamlit-native chat UI)
- Answers MUST cite source data (which park, which dataset)
- Refuse to answer if no data available — don't hallucinate
- Detect language: Thai question → Thai answer
- Context-aware: if user opens the chat from a park page, default to that park
- Suggest 2-3 follow-up questions after each answer
- Never recommend dangerous trails to beginners
- RAG over in-memory embeddings JSON (no vector DB at MVP scale)

## Critical Anti-Patterns

❌ Don't use raw HTML/JS in Streamlit unless absolutely necessary — prefer `st.markdown`, `st.dataframe`, `st.metric`, etc.
❌ Don't write a Streamlit page that hits external APIs on every rerun — use `@st.cache_data` (data) or `@st.cache_resource` (clients)
❌ Don't store secrets in code — use `.streamlit/secrets.toml` or env vars
❌ Don't make absolute claims about park conditions — always disclaim "verify with park"
❌ Don't scrape with aggressive rate (respect robots.txt, 1 req/sec max)
❌ Don't add a database "just in case" — justify with a real read/write pattern that JSON can't serve
❌ Don't introduce a new dependency without listing it in `requirements.txt`
❌ Don't pivot to a non-Python tool without an explicit reason — owner is learning Python web dev

## When stuck

1. Check this file's Anti-Patterns section
2. Look at existing similar code in `pages/` or `lib/`
3. Default to Streamlit docs over generic Python/Flask patterns
4. Ask user for decisions on:
   - New dependencies (must be in `requirements.txt`)
   - Adding a database (must justify why JSON+session_state isn't enough)
   - Adding features beyond current weekend's scope

## Current Weekend

See `WEEKEND_1.md` for current scope and definition of done.
Update progress in `PROGRESS.md` after each session.
