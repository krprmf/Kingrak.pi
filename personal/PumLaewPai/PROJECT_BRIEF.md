# PumLaewPai — Thailand National Park Explorer

> AI-powered web application for exploring Thailand's national parks (~156 records from DNP open data). Combines analytics dashboard, interactive map, hiking trip planner, and grounded AI assistant.

---

## Project Vision

แก้ปัญหา: ข้อมูลอุทยานแห่งชาติของไทยกระจัดกระจาย — ต้องค้นหลายเว็บถึงจะวางแผนได้ + สาย "ปั๊มสมุดอุทยาน" ไม่มีเครื่องมือ track progress

แนวทาง: รวมข้อมูลจากหลายแหล่ง → สร้างเว็บที่:
1. ดูภาพรวม + วิเคราะห์ insight ได้ (dashboard)
2. ค้นหา/เปรียบเทียบอุทยานได้ (search + filter)
3. ถามคำถามเชิงลึกได้ (AI chatbot grounded ในข้อมูลจริง)
4. Track ความคืบหน้าสำหรับสาย stamp collector

## Target Users

- สาย hiking / trekking ที่วางแผนทริปด้วยตัวเอง
- ครอบครัวที่หาที่เที่ยวธรรมชาติช่วงวันหยุด
- สาย "ปั๊มสมุดอุทยานแห่งชาติ" (trending 2024-2026)
- นักท่องเที่ยวต่างชาติที่อยากเที่ยวอุทยานไทย

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Streamlit** (Python) | Pure Python web app — no HTML/JS/CSS needed. Perfect for data scientists. |
| Map | Folium + streamlit-folium | Python wrapper around Leaflet; renders inline in Streamlit |
| Charts | Streamlit built-in + Plotly | One-line charts from DataFrames |
| Data | JSON files | ~156 parks ≈ 80KB; loaded with pandas at runtime |
| Persistence (stamp book) | `st.session_state` + local JSON | In-session memory; per-user file persistence — no auth needed |
| LLM | Claude API (Anthropic SDK) | Best for Thai language + reasoning |
| Embeddings | sentence-transformers (local) or Claude | Thai support; in-memory cosine search |
| Deploy | Streamlit Community Cloud | Free, 1-click deploy from GitHub, public URL |
| Analytics | Streamlit Cloud built-in | Free |

> **MVP architecture decision:** Python-only stack (Streamlit). Owner is a data scientist — TypeScript/React stack was abandoned to remove learning-curve risk. Static JSON committed to repo; re-evaluate database only when (a) stamp book needs cross-device sync, or (b) records grow past ~10k.

## Core Features (MVP)

### 1. Interactive Map Dashboard (`/`)
- Leaflet map with all 133 national parks
- Clustered markers
- Click marker → popup with summary + link to detail
- Filter sidebar:
  - Region (เหนือ/ใต้/อีสาน/กลาง/ตะวันออก/ตะวันตก)
  - Type (น้ำตก/ภูเขา/ทะเล/ถ้ำ/...)
  - Difficulty (easy/medium/hard) — derived
  - Best season — derived

### 2. Park Detail Page (`/park/[slug]`)
- Hero section: name, location, area, image
- Tabs:
  - Overview: description, what to see
  - Trails: hiking routes with distance, difficulty, time
  - When to visit: best season chart (from tourist data)
  - Accommodation: bungalows, camping, contact
  - Visitor stats: yearly trend chart
- "Add to my stamp book" button

### 3. Analytics Page (`/insights`)
- "Top 10 most visited parks"
- "Hidden gems" (high area, low visitors)
- "International vs Thai tourist trends"
- "Best parks by region"
- Pre-computed insights with source links

### 4. AI Chatbot Widget (floating bottom-right)
- Click → expand to chat window
- Context-aware: knows current page (which park user is viewing)
- Suggested questions:
  - "อยาก hike ระดับเริ่มต้น ใกล้กรุงเทพ ช่วงธ.ค. แนะนำหน่อย"
  - "ภูกระดึงเปิดเมื่อไหร่"
  - "เปรียบเทียบเขาใหญ่กับแก่งกระจาน"
- All answers cite source data
- Suggests follow-up parks/trips

### 5. Stamp Book Tracker (`/my-trips`) — Phase 2
- **localStorage-based** (no login, per-device)
- Mark parks as visited
- Progress map: highlight visited parks
- Stats: "23/156 visited, completed northern region"
- Shareable progress card (download as PNG)
- Future: optional Supabase Auth for cross-device sync (Phase 3+)

## Data Sources

### Primary (Open Government Data)
- `data.go.th` — รายชื่ออุทยาน 133 แห่ง (CSV/XLSX)
- `data.go.th` — ประเภทแหล่งท่องเที่ยว 16 ประเภท
- `data.go.th` — สถิตินักท่องเที่ยวรายปี (XLSX)
- `data.go.th` — จำนวนที่พักในอุทยาน
- `catalog.dnp.go.th` — ข้อมูลเพิ่มเติมจากกรมอุทยาน

### Secondary (Web Scraping — with attribution)
- `portal.dnp.go.th` — เส้นทางเดินป่าแต่ละอุทยาน
- Public blog data — เสริม description (sparingly, paraphrased only)

### LLM Enrichment
- ใช้ Claude API จัด normalize / classify:
  - Difficulty level จากคำอธิบายเส้นทาง
  - Best season จาก description + visitor patterns
  - Activity tags (camping, swimming, viewpoint, ...)

## Disclaimers (must include)

- "Independent open-source project, not affiliated with Department of National Parks or any government agency"
- "Data sourced from data.go.th and DNP portal — may not reflect latest updates. Please verify with the park before traveling."
- All data sources credited in `/about` page and README

## License & Attribution

- Code: MIT License
- Data: Open Government License (credit data.go.th)
- Images: Unsplash / user contributions only (NOT scraped from gov sites)
- Map tiles: OpenStreetMap (CC BY-SA)

## Out of Scope (don't promise)

- Real-time weather (no reliable free API for Thailand)
- Real-time accommodation booking
- Real-time entry fees
- User reviews / ratings (moderation overhead too high for MVP)
- Mobile app (web responsive only)

## Success Metrics (12 months)

- 1,000+ unique visitors/month
- 50+ GitHub stars
- 1+ mention in Thai tech/travel media
- Portfolio piece in resume → +interview opportunities

## Anti-Goals

- ไม่กระทบงานหลักที่ VEKIN
- ไม่ใช้เวลาเกิน 3 ชม./สัปดาห์ หลัง MVP launch
- ไม่ scope creep — ship ugly แต่ ship
- ไม่ promise feature ที่ data ไม่รองรับ
