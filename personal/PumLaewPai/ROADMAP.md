# Roadmap

> Outline ของ weekend 2-4 — รายละเอียดจะ flesh out ตอนใกล้ถึง

---

## Weekend 2 — Park Details + Trails

**Goal:** ผู้ใช้คลิกหมุดบนแผนที่ → ดูข้อมูลละเอียดของอุทยานนั้นได้

**Scope:**
- [ ] `/park/[slug]` route + dynamic page
- [ ] Hero section + tabs (Overview / Trails / Visitors / Stay)
- [ ] Scrape trail data จาก portal.dnp.go.th (Python script)
- [ ] เก็บลง `trails` table
- [ ] ใช้ Claude API enrich (classify difficulty, best season) — script รันครั้งเดียว
- [ ] Visitor stats chart (Recharts) — yearly trend, Thai vs foreign
- [ ] Breadcrumb navigation

**Stretch:**
- [ ] "Similar parks" section (top 3 nearby with similar attractions)
- [ ] Share button (Facebook / LINE / copy link)

**Definition of done:**
- 10 อุทยานหลัก (เขาใหญ่, ภูกระดึง, ดอยอินทนนท์, ฯลฯ) มีข้อมูลครบทุก tab
- ที่เหลือ 123 อุทยานมีข้อมูลพื้นฐานจาก data.go.th

---

## Weekend 3 — AI Chatbot with RAG

**Goal:** มี chatbot widget ตอบคำถามเรื่องอุทยานได้ พร้อม citation

**Scope:**
- [ ] Schema: `park_chunks(park_id, content, embedding)`
- [ ] Script: chunk + embed ข้อมูลทุกอุทยานด้วย BGE-M3
- [ ] Floating chat widget (`/components/chat-widget.tsx`)
- [ ] `/api/chat` route: hybrid retrieval + Claude API generation
- [ ] Context-aware: รู้ว่า user อยู่หน้าไหน
- [ ] Inline citations (เลขกำกับ → highlight แหล่งข้อมูล)
- [ ] Suggested questions (3-5 ใต้ chat box)
- [ ] Streaming response

**Eval (สำคัญ — โชว์ senior signal):**
- [ ] เขียน eval set 30 คำถาม manual
- [ ] Measure: retrieval precision, answer faithfulness
- [ ] หน้า `/eval` แสดงผล eval (โชว์ใน portfolio)

**Stretch:**
- [ ] Tool use: chatbot สร้าง chart ได้
- [ ] Multi-turn memory

---

## Weekend 4 — Stamp Book + Launch

**Goal:** มี user-facing feature ที่ unique + launch ออกสู่สาธารณะ

**Scope:**
- [ ] Supabase Auth (Google / email magic link)
- [ ] Schema: `user_stamps(user_id, park_id, visited_at, notes)`
- [ ] `/my-trips` page — list + map highlight
- [ ] "Mark as visited" button บน park detail
- [ ] Progress stats widget (visited / total)
- [ ] Shareable progress card (download as image)
- [ ] Insights page (`/insights`) — top 10 / hidden gems / trends

**Launch:**
- [ ] Polish: 404 page, loading states, error boundaries
- [ ] Update README + add screenshots/GIF
- [ ] Write blog post (Medium / dev.to / personal blog)
- [ ] LinkedIn launch post
- [ ] Post ในกลุ่ม FB ที่เกี่ยวข้อง (เที่ยวอุทยาน, hiking)
- [ ] Submit Product Hunt (international audience)
- [ ] TikTok demo clip (30 sec) — optional

---

## Beyond MVP (อย่ารีบ — ทำเมื่ออยาก)

### Features ที่อยากเพิ่ม
- Trip planner: AI suggest itinerary 2-3 days
- Comparison tool (เปรียบเทียบ 2-3 อุทยาน side-by-side)
- Photo gallery (user-contributed)
- Reviews/tips section (with moderation)
- Mobile app (React Native ใช้ logic เดียวกัน)
- English translation (i18n)

### Technical improvements
- Move embeddings to a dedicated vector DB (Qdrant Cloud)
- Add caching layer (Vercel KV)
- Optimize images with next/image + CDN
- Add OG image generator (dynamic preview cards)
- Sentry for error tracking
- Plausible for analytics

### Monetization (optional, ไม่ใช่จุดหลัก)
- Booking.com / Agoda affiliate link สำหรับที่พัก
- Shopee/Lazada affiliate สำหรับ hiking gear
- Google AdSense (only if traffic > 1k DAU)
- Sponsored content from outdoor brands
- Premium tier: offline maps, advanced trip planner

---

## Decision Log

> เก็บไว้เป็น log เผื่ออนาคตลืมว่าทำไมตัดสินใจแบบนี้

| Date | Decision | Reason |
|---|---|---|
| Day 0 | Next.js over Streamlit | Recruiter signal + production-grade web |
| Day 0 | Supabase over Firebase | pgvector built-in + SQL familiarity |
| Day 0 | Leaflet over Mapbox | No API key needed for MVP |
| ... | | |
