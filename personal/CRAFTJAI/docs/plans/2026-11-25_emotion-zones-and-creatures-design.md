# Design: emotion zones, 14 creatures, heart map and consistent character images

**Date:** 2026-11-25
**Status:** Draft v2 (builder check done), waiting for the owner's approval
**Builds on:** [2026-11-24_v2-concept-memoir-mirror.md](2026-11-24_v2-concept-memoir-mirror.md) (product goal, gamification principles, guardrail)

## 1. Why

- **A real mislabel.** Diaries about being sleepy or lazy come back as `sadness` (Luna). Real rows: "heyyy im lazyy lazyy" got valence -0.3, arousal 0.1, sadness. Gemini reads the low energy correctly, but the prompt only allows Plutchik's 8 emotions, and the only low-energy one is sadness.
- **The paper asks for it.** The IEEE paper's conclusion names two limits: the system "is limited to eight predefined emotions" and shows "lower visual appeal in negative emotion categories". Its future work is "expanding the emotional taxonomy". This design is that future work.
- **The mirror goal.** CRAFTJAI is a life picture book and a self-reflection mirror. The owner wants to see "which zone my heart lives in most", without numbers, by looking at a picture that fills in as they keep writing.
- **The picture book needs the same friend on every page.** Text-only prompts cannot keep a character's look stable (see section 8).

## 2. Goals, non-goals, anti-goals

**Goals**
1. 14 emotions in 4 zones, so low-energy feelings (tired, bored, lonely, calm) get their own creature.
2. Every creature belongs to a zone with a shared element and color family, so the world reads as one system.
3. Creatures look like "emotion beings" (body shape and posture express the feeling) with a small animal hint, and grow in 3 stages.
4. The same creature looks the same in every diary picture.
5. A cumulative "heart map" on the Mirror page.
6. Image generation fits the Cloudflare free tier much better than today.

**Non-goals (this round)**
- Tapping a drop on the heart map to open that diary.
- Month filter on the heart map.
- Regenerating art for characters that already exist.
- Paid image providers.

**Anti-goals (a failure even if it works)**
- Any reward tied to a specific mood (for example "write an angry entry to complete the set"). It pushes users to fake moods and breaks the mirror. Growth is a side effect, never a target.
- Progress bars, EXP numbers or "3 more visits to evolve".
- Creatures that copy Inside Out characters or Pokemon. The repo is public and tied to the paper.
- Negative-zone creatures that look scary or pitiful.

## 3. Constraints

- **Cloudflare Workers AI free tier:** 10,000 neurons per day for the whole app, reset 00:00 UTC (07:00 Thailand). Measured 2026-11-25.
- **Content filters with false positives:** FLUX.1 schnell rejects with code 8007 (words "anime", "masterpiece, best quality", bed scenes). FLUX.2 klein 4B rejected "walking along a path in a sunny park" with code 3030. Keep "anime", "bed", "bath", "naked" out of prompts.
- **Data:** `mood_type` is a Postgres enum (`supabase/migrations/001_initial_schema.sql`). Existing diary entries and characters must stay valid.
- **UI:** English copy, no emoji, no em-dash. Cozy paper look (`globals.css` cozy tokens).
- **Original creatures only.** Concepts may be inspired by Inside Out (feelings with bodies) and Pokemon (types, species, growth), never their looks or names.

## 4. Approaches considered

| Topic | Options | Chosen | Why |
|---|---|---|---|
| Taxonomy | Keep 8 and add Calm + Tired; replace with full Mood Meter (4 zones, many words); hybrid | **Hybrid:** Mood Meter zones as the frame, the paper's 8 kept and placed in zones, 6 new from the owner's own feelings | Keeps old data and the paper link, adds granularity the paper asked for |
| Creature colors | Keep paper colors per creature; zone element + color family | **Zone element + color family** | Map drops and creatures share one color system; soft elements make negative creatures cuter |
| Heart map | 2x2 grid with %; dot map by V-A; creature bubbles | **Dot map, styled as watercolor drops, no numbers** | Owner likes reading the picture, not a chart |
| Growth trigger | Visits of that emotion (hidden); total pages; Pokemon EXP bar | **Visits of that emotion, thresholds hidden** | Feels like a bond; no visible target means no reason to fake moods |
| Consistent images | Text only (today); reference image (FLUX.2 klein); paste a fixed sprite over a generated background; train a LoRA | **Reference image with FLUX.2 klein 4B** | Spike kept identity almost perfectly, poses still follow the scene, about 8x cheaper per image. Sprite overlay is the fallback idea; LoRA is too heavy for 14 creatures and Workers AI does not host image LoRAs |

## 5. Emotions and zones

The zone is a fixed property of the emotion. It is **not** computed from valence and arousal, because Gemini sometimes gives a label and V-A values that disagree (a "joy" with arousal 0.3 would land in green).

| Zone | Energy, feel | Element | Color family | Emotions |
|---|---|---|---|---|
| Yellow | High, pleasant | Sunlight, sparks, stars | Yellow, gold, orange | joy, anticipation, surprise, **proud** |
| Red | High, unpleasant | Storm, embers, thunder | Red, brick, plum | anger, fear, disgust, **stressed** |
| Blue | Low, unpleasant | Rain, night, moon, clouds | Blue, indigo, grey-blue, lavender | sadness, **lonely**, **bored**, **tired** |
| Green | Low, pleasant | Meadow, leaves, pond, breeze | Green, sage, mint | trust, **calm** |

Bold = new. New enum values: `proud`, `stressed`, `lonely`, `bored`, `tired`, `calm`.

**Definitions for the Gemini prompt** (the pairs that get confused):

- **sadness:** hurt or disappointed by something that happened. **lonely:** missing closeness, wanting someone there.
- **fear:** worried that something bad will happen. **stressed:** too much on the plate right now, under pressure, overwhelmed.
- **joy:** something good or fun happened. **proud:** "I did it", effort paid off.
- **bored:** nothing feels interesting, everything is flat. **tired:** no energy, body or mind wants rest or sleep.
- **calm:** peaceful, relaxed, nothing pushing, can be alone. **trust:** safe and warm with someone.

The other existing definitions in `src/lib/gemini/prompts.ts` stay, with "anxiety, worry" kept under fear and "pressure, overwhelmed" moved to stressed.

## 6. Creatures

### 6.1 Design rules (all 14)

1. **Emotion being first:** body shape and posture express the feeling (sad droops, stressed bristles, calm sits still).
2. **One small animal hint** so each is recognizable (ears, tail, spines, wool).
3. **Zone element on the body**, and the element is what grows.
4. **Color from the zone family.**
5. **Locked body description:** one sentence per creature, reused word for word in every prompt. Mood intensity goes in the pose, never in the body sentence.
6. **Never list per creature** (for example no collar, no clothes, no text).
7. **Growth meaning:** in yellow and green the element blooms; in red and blue the element softens (a storm cloud gains a silver lining). Feelings you live with become gentler.

### 6.2 Roster (draft; final look is decided per creature when its master is approved)

| Zone | Emotion | Body | Animal hint | Element, stage 1 to 3 |
|---|---|---|---|---|
| Yellow | joy | Round bouncy mochi | Floppy dog ears | Sun gem, halo, full sunburst |
| Yellow | anticipation | Stretching on tiptoe, peeking | Fox tail | 1 firefly, 3 fireflies, a swarm |
| Yellow | surprise | Round, wide eyes, puffed up | Bird crest | Star crest with 1, 3, 5 points |
| Yellow | proud | Chest out, standing tall | Peacock tail | Sunray tail feathers 3, 5, 7 |
| Red | anger | Dense, shoulders up | Tiger stripes | Ember stripes, warm embers, soft sparks |
| Red | fear | Shrunk, ears down | Rabbit ears | Thundercloud, silver lining, small rainbow |
| Red | disgust | Wrinkled nose, turning away | Round mouse ears | Sour smoke puff, fading puff, small flower |
| Red | stressed | Rigid, spines up | Hedgehog spines | Static spines, softened spines, spine tips with blossoms |
| Blue | sadness | Drooping, shoulders down | Cat ears | Rain cloud on head, drizzle, rainbow |
| Blue | lonely | Small, alone, holding a lantern | Little whale | Small lantern, brighter lantern, an answering light |
| Blue | bored | Flat, melting | Sleepy sloth eyes | Plain grey cloud, faint color, star pattern |
| Blue | tired | Soft, slumped, half-closed eyes | Lamb wool | Crescent moon, half moon, full moon |
| Green | trust | Big, warm, open arms | Bear | Sprout, small bush, little tree on its back |
| Green | calm | Sitting still, eyes half closed | Capybara | Lily pad, bud, open lotus |

- Joy uses concept A (sun mochi) from the 2026-11-24 round.
- Stressed must not resemble Inside Out's Anxiety (no frizzy orange hair). Bored must not resemble Ennui (no slouching purple figure with a phone).
- Spike notes: stressed came out looking angry (furrowed brows, fists): its pose words need "raised worried eyebrows, sweat drop, wobbly mouth". Calm came out like a hippo: needs "round chibi capybara, tiny dot eyes". Tired and joy worked.

### 6.3 Growth

- `characters.evolution_level` (exists, unused) stores the stage **at the time the picture was made**, so old pages keep the stage they had.
- Stage for a new character = based on how many characters of that emotion the user already has. Thresholds are hidden in the UI; no counters or bars are shown.
- *Builder's call (proposed):* stage 2 from the 5th visit, stage 3 from the 15th. Keep the thresholds in one constant so they can be tuned.

## 7. Heart map (Mirror page)

- Lives on the Mirror page (`/calendar`), cumulative over all time.
- One drop per character (a 3-mood diary gives 3 drops).
- Drop color = zone color. Drops are soft watercolor circles that blur and stack; where many overlap, color deepens.
- Drop position = the character's own valence (x) and arousal (y), **clamped inside its emotion's zone quadrant**, so a yellow drop never sits in green.
- No numbers, no axis lines, no "most" label. Four faint corner words for orientation (draft: restless, bright, heavy, easy).
- Mockup (watercolor option) was approved in the brainstorm on 2026-11-25.

**Data needed:** characters do not store V-A today (only the diary's primary mood does). Add `valence` and `arousal` columns to `characters`, filled from each mood item at creation. Backfill old rows from their diary entry's values.

**Feelings shelf** (`/collection/feelings`) groups creatures by zone.

### 7.1 No "N of total" counters (decided by the owner, 2026-11-25)

Counting toward a full set is a reward for specific moods, which the anti-goals forbid. So:

- Drop the denominator everywhere: Home `Feelings met: 5/8`, Passport `feelings met · 5 of 8`, feelings shelf `5 of 8 feelings have visited` become a plain count such as `6 feelings have visited you`.
- Achievement `mood_explorer` ("Discover all 8 moods"): users who already unlocked it keep it; it is no longer awarded (remove its condition from `achievements.ts`, keep the definition so old unlocks still render).
- Locked or silhouette slots for creatures that have not visited are not shown as "missing".

## 8. Consistent character images

### 8.1 Evidence (spikes on 2026-11-25)

- **Today's setup wastes quota:** FLUX.1 schnell on Cloudflare outputs 1024x1024 (4 tiles) at 8 steps, and step cost is charged per tile: about **326 neurons per image**. The app then downsizes to 512. That allows about 30 images per day for everyone.
- **Text-only has a ceiling:** schnell on Workers AI rejects a `seed`, so every image starts from new noise. The same prompt only narrows the result. Simple shapes (joy) stayed close between stages; detailed ones (stressed, calm) drifted.
- **Reference images work:** `@cf/black-forest-labs/flux-2-klein-4b` with the tired creature as `input_image_0` kept face, wool, ears, colors and moon almost identical across a desk, bus and noodle-shop scene.
- **The reference must be clean:** a reference that included a cushion copied the cushion into every scene, even merging it into the body. A clean master (creature alone, standing, full body, plain background) let the pose follow the scene (sitting at a desk typing, holding chopsticks). A scene whose pose is close to the master's (standing on a bus) copies the master pose.
- **Cost:** 8 klein calls used about 329 neurons (about 41 each, including one rejected call), versus 326 for one schnell image.
- **Request format:** multipart form-data with `prompt`, `input_image_0` (max 512x512), `width`, `height`; response is JSON with `result.image` as base64.
- Spike images: brainstorm companion in the session scratchpad (not in the repo).

### 8.2 Pipeline

**Once per creature stage (42 masters):**
1. Generate candidates from text until the owner likes one.
2. Use klein with that image as reference to make the clean master: creature alone, standing, front view, full body, plain cream background, no props.
3. Owner approves the master. Store it (proposed: Supabase storage, a `masters/{emotion}-stage{n}.jpg` path, or `public/` in the repo; builder's call).
4. Record the creature's locked body sentence and never list next to it (proposed home: `EMOTION_MAP` in `src/lib/constants/emotions.ts`).

Masters can be made one zone at a time across several days to stay inside the daily quota.

**Per diary mood item:**
1. Gemini returns the emotion, V-A-D and a **scene description only** (what the creature is doing, where, diary details). It no longer writes the creature's body.
2. Server builds the prompt: `The {body sentence} from image 0, with the exact same face, body and colors, {element for this stage}, {scene}. 3D vinyl toy figure style, soft lighting, no text`.
3. Call klein 4B with the stage master as `input_image_0`, 512x512.
4. On a filter rejection (8007 or 3030), retry once with the body sentence and a plain cozy scene.
5. If that also fails, use the master image itself as the character picture so the user always gets one. *(builder may refine)*

### 8.3 How masters get made (decided)

- No admin page. The assistant runs a local script per creature, shows candidates in the brainstorm companion browser tab, and the owner picks, the same way as the 2026-11-25 spikes.
- Masters spend the same 10,000 neurons per day as the live app. Make them a few creatures per day and check the `/diary` quota chip first; at about 41 neurons per klein call, one creature (a few candidates, 3 clean stage masters) costs roughly 300 to 500 neurons.
- Starting images that already exist: `docs/plans/assets/2026-11-25_spike-tired-master.jpg` (tired stage 3, clean master) and the joy stage 1 and 3 spikes in the same folder. Everything else starts from text.

## 9. Rollout order (proposal)

**Shared database (fact, checked 2026-11-25):** `.env.local` and Vercel use the same hosted Supabase project. There is no separate dev database. Today only the owner and test guests use the live app; the 5-friend test has not started. So every migration is live the moment it runs, and new enum values cannot be removed. *(builder's call)* Before adding any enum value, ship and deploy a small "unknown mood" guard: every place that reads `EMOTION_MAP[mood]` (for example `journal-book.tsx`, `home/page.tsx`, `profile/page.tsx`) falls back gracefully. Then deploy each later step together with its migration.

0. **Guard:** pages tolerate moods they do not know. Deploy.
1. **Taxonomy and data:** enum values, `characters.valence/arousal` + backfill, `EMOTION_MAP` with zone, element, body sentence; Gemini definitions. Works with today's image pipeline.
2. **Masters:** make and approve masters zone by zone.
3. **Image pipeline:** switch generation to klein 4B with masters; retry and fallback.
4. **Mirror heart map** and **feelings shelf by zone**.
5. **Growth:** stage selection by visit count.

Each step is a commit and is tested by the owner locally before the next.

## 10. Left to the builder

- Exact thresholds for growth (one tunable constant).
- Where masters are stored and how they are loaded.
- Heart map rendering details (SVG blur, drop size, corner words final copy).
- Placeholder art for emotions whose masters are not ready yet.
- Exact names for the 6 new creatures (owner reviews).

## 11. Open items outside this design

- Parked and uncommitted: rarity fix (count real diary words) and streak fix (`effectiveStreak`, migration 002). Not related, but in the same working tree.
- Daily character limit counts days in UTC.
- Temporary AI quota chip on `/diary` (`SHOW_AI_QUOTA=1`) stays until testing ends.
- BFL license terms for FLUX.2 klein 4B to be read before any public launch.
