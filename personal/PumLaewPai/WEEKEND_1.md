# Weekend 1 — Data Foundation + First Streamlit App

**Goal:** มี clean dataset 156 อุทยาน + Streamlit app รันได้ในเครื่อง + deploy ขึ้น Streamlit Cloud

**Time budget:** 3-4 ชม. รวม (กระจาย 2 วันได้)

**Stack:** Python only — Streamlit · Folium · Pandas · JSON (no database)

**Definition of done:**
- ✅ `data/processed/parks.json` มี 156 records (committed to git)
- ✅ `app.py` รันแล้วเห็น filter + ตาราง + chart
- ☐ GitHub repo สร้างแล้ว, README อ่านรู้เรื่อง
- ☐ Streamlit Cloud deploy เห็น URL public

---

## ✅ Phase 1: Data (DONE)

ทำเสร็จไปแล้วในรอบก่อน:

| Step | Status | Output |
|---|---|---|
| Download CSVs จาก DNP | ✅ | `data/raw/{nationalparksname,nparea6467}.{csv,xlsx}` |
| Inspect encoding + schema | ✅ | `data/processed/inspection_report.md` |
| ETL CSV → JSON | ✅ | `data/processed/parks.json` (156 records, 79KB) |

Re-run if data refreshes:
```bash
source .venv/bin/activate
python3 scripts/etl_parks.py
```

---

## ✅ Phase 2: Streamlit Setup (DONE)

Virtual env + dependencies installed:

```bash
python3 -m venv .venv               # done
source .venv/bin/activate
pip install -r requirements.txt     # done
```

Installed: `streamlit`, `folium`, `streamlit-folium`, `pandas`, `openpyxl`, `chardet`

---

## 🚧 Phase 3: First App (NOW — 30 นาที)

### 3.1 Run `app.py`

```bash
source .venv/bin/activate
streamlit run app.py
# opens http://localhost:8501 in browser
```

ที่จะเห็น:
- Header + caption
- Sidebar: เลือกภาค + ค้นหาอุทยาน
- 3 metric cards (total parks, filtered count, total area)
- Bar chart: จำนวนอุทยานต่อภาค
- ตาราง 156 อุทยานพร้อมลิงก์ DNP

> **No map yet** — ต้อง geocode lat/lng ก่อน (Phase 4)

### 3.2 ปรับ theme (optional)

แก้ `.streamlit/config.toml` เพื่อเปลี่ยนสี:

```toml
[theme]
primaryColor = "#2D6A4F"        # green = nature
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F1FAEE"
textColor = "#1B2D2A"
font = "sans serif"
```

Reload — เปลี่ยนสีทันที

---

## 🗺️ Phase 4: Add Map (60 นาที)

ต้อง geocode lat/lng ของ 156 อุทยานก่อน ใช้ OSM Nominatim (free, 1 req/sec):

```bash
python3 scripts/geocode.py   # ยังไม่มี — Claude Code จะเขียนให้
# expect: parks.json ได้รับ lat/lng เพิ่มเข้ามา
```

แล้วเพิ่มหน้า `pages/1_🗺️_Map.py`:

```python
import streamlit as st
import folium
from streamlit_folium import st_folium
from lib.data import load_parks

st.title("🗺️ แผนที่อุทยาน")

parks = load_parks()
m = folium.Map(location=[13.7, 100.5], zoom_start=6, tiles="OpenStreetMap")

for p in parks:
    if p["latitude"] and p["longitude"]:
        folium.Marker(
            [p["latitude"], p["longitude"]],
            popup=f"<b>{p['nameTh']}</b><br>{', '.join(p['provinces'])}",
            tooltip=p["nameTh"],
        ).add_to(m)

st_folium(m, width=900, height=600)
```

✅ Checkpoint: เห็นหมุด 156 จุดบนแผนที่ไทย

---

## 🚀 Phase 5: Deploy (30 นาที)

### 5.1 Create GitHub repo

```bash
gh repo create pumlaewpai --public --description "AI-powered Thailand National Park Explorer (Streamlit)"
git init
git add .
git commit -m "Initial commit: data + Streamlit app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pumlaewpai.git
git push -u origin main
```

### 5.2 Deploy ผ่าน Streamlit Community Cloud

1. ไป https://share.streamlit.io
2. Login ด้วย GitHub
3. Click "New app" → เลือก repo + branch `main` + entry `app.py`
4. Click "Deploy"
5. รอ ~2 นาที → ได้ URL เช่น `https://pumlaewpai.streamlit.app`

> **Streamlit Cloud อ่าน `requirements.txt` อัตโนมัติ** — ไม่ต้อง config อะไรเพิ่ม

✅ Checkpoint: เปิด URL public แล้วเห็นแอป

---

## 📝 Phase 6: README (15 นาที)

แก้ `README.md` (สร้างได้เลย):

```markdown
# ปั๊มแล้วไป (PumLaewPai)

🏞️ Thailand National Parks Explorer — built in Python with Streamlit

🌐 [Live Demo](https://pumlaewpai.streamlit.app)

## Features
- Interactive map of 156 national parks
- Filter by region/province
- AI assistant (coming soon)
- Stamp book progress tracker (coming soon)

## Tech Stack
Streamlit · Folium · Pandas · Claude API

## Data Sources
- [data.go.th](https://data.go.th)
- [catalog.dnp.go.th](https://catalog.dnp.go.th)

## Run Locally
\`\`\`bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
\`\`\`

## Disclaimer
Independent project, not affiliated with any government agency.
Verify info with the park before traveling.

## License
MIT
```

---

## Troubleshooting

**`streamlit: command not found`**
→ Activate venv first: `source .venv/bin/activate`

**`ModuleNotFoundError: No module named 'streamlit_folium'`**
→ `pip install -r requirements.txt` ใน venv

**Streamlit หน้าเปล่า**
→ ดู terminal — Streamlit จะ print error message ละเอียด

**Map ไม่ขึ้นหมุด**
→ ยังไม่ geocode (lat/lng = None) → ดู Phase 4

**Streamlit Cloud build fails**
→ ดู logs ในหน้า deploy. ปัญหาที่เจอบ่อย: เพิ่ม dep ในเครื่องแต่ลืมเติม `requirements.txt`

---

## Time check

ถ้าใช้เวลาเกิน 5 ชม. → cut scope:
1. ตัด map (Phase 4) — แค่หน้า table ก็ launch ได้
2. ตัด README polish — แก้ทีหลัง
3. ตัด theme config — Streamlit default ก็สวยพอ

**Done is better than perfect.** Ship table+filter ก่อน, map + chatbot ค่อยตามมา
