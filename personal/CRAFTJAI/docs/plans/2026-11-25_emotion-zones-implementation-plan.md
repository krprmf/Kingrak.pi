# Emotion Zones and Consistent Creatures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow CRAFTJAI from 8 to 14 emotions in 4 zones, make every creature look the same on every page by generating from approved master images with FLUX.2 klein 4B, add a watercolor heart map to the Mirror, and let creatures grow with hidden visit thresholds.

**Architecture:** `src/lib/constants/emotions.ts` stays the single source of emotion data and gains zone, body sentence, stage elements and a safe lookup. Pure helpers in `src/lib/creatures/` (prompt builder, master lookup, growth, heart-map geometry, retry logic) carry the logic and the tests; pages and the API route only call them. Approved masters live in `public/creatures/` and the API route fetches them by URL from its own origin.

**Tech Stack:** Next.js 16 App Router (read `node_modules/next/dist/docs/` before touching framework APIs), Supabase Postgres + storage, Gemini 2.5 Flash, Cloudflare Workers AI (`@cf/black-forest-labs/flux-2-klein-4b`, fallback `@cf/black-forest-labs/flux-1-schnell`), `node --test` through `tsx`.

**Spec:** [2026-11-25_emotion-zones-and-creatures-design.md](2026-11-25_emotion-zones-and-creatures-design.md)

## Global Constraints

- UI copy is English, no emoji, no em-dash. Cozy tokens from `src/app/globals.css`.
- Prompts never contain "anime", "masterpiece", "best quality", "bed", "bath", "naked".
- Original creatures only; stressed must not have frizzy orange hair, bored must not be a slouching purple figure with a phone.
- No reward is tied to a specific mood. No "N of total" counters, no progress bars, no visit numbers in the UI.
- One Supabase project serves local and live. Migrations are run by the owner in the Supabase SQL Editor. New enum values cannot be removed.
- Never run `next build` while the dev server runs; restart the dev server (`preview_start craftjai-dev`, port 3456) after a build.
- Commits: chain `git add <paths> && git commit`, check `git show --stat HEAD` before pushing; never commit `.env.local`. Push as krprmf (`gh auth switch -u krprmf`, `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push`, switch back to KingrakP). Deploy: `rtk proxy npx -y vercel@66.6.0 deploy --prod --yes`, confirm with `rtk proxy npx -y vercel@66.6.0 ls craftjai`.
- Every task ends with the owner testing it locally before the commit, and each change is explained lecture-style.
- Cloudflare free tier is 10,000 neurons per day; check the `/diary` quota chip before any generation work.

## Review Focus

1. **Gemini scene text containing a banned word** (for example "resting in bed"): the prompt sent to Cloudflare has the word replaced, not rejected by the filter. Test in Task 3.
2. **Character rows with no valence or arousal** (old rows whose diary has null V-A): the drop sits inside its zone, never at NaN or (0,0). Test in Task 5.
3. **A mood string the code does not know** (a new enum value read by old code, or a typo in data): pages render with the fallback look instead of crashing. Test in Task 1.
4. **No master for an emotion or stage yet**: the diary still gets a picture (lower stage master, or the text-only schnell path). Test in Task 4.
5. **Cloudflare fails for a reason other than the content filter** (quota exhausted, 5xx): the user still gets the master image when one exists; the error surfaces only when there is nothing to fall back to. Test in Task 4.

---

### Task 1: Test runner and unknown-mood guard (spec step 0)

**Files:**
- Modify: `package.json` (devDependency `tsx`, script `"test": "tsx --test \"src/**/*.test.ts\""`)
- Modify: `src/lib/constants/emotions.ts`
- Create: `src/lib/constants/emotions.test.ts`
- Modify (read through `getEmotion` instead of `EMOTION_MAP[x]`): `src/app/(game)/home/page.tsx:117,188`, `src/app/(game)/character/[id]/page.tsx:26`, `src/app/(game)/reveal/page.tsx:212,266`, `src/components/journal/journal-book.tsx:169,185`, `src/components/calendar/calendar-view.tsx:126,147,148,158,164,189`, `src/components/mascot/jaid-ghost.tsx:30`

**Interfaces:**
- Produces: `isEmotionKey(value: unknown): value is EmotionKey`; `getEmotion(mood: string | null | undefined): EmotionInfo` where `EmotionInfo = (typeof EMOTION_MAP)[EmotionKey]`-compatible; `FALLBACK_EMOTION` (name `"Visitor"`, hex `"#b8694b"`, quote `"A feeling still finding its name"`).

- [ ] **Step 1: Install tsx and add the test script**

Run: `npm install -D tsx`, then add the `test` script above.

- [ ] **Step 2: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { getEmotion, isEmotionKey, FALLBACK_EMOTION } from "./emotions";

test("known mood returns its creature", () => {
  assert.equal(getEmotion("joy").name, "Sunny");
});
test("unknown, null and empty moods return the fallback", () => {
  for (const m of ["not-a-mood", null, undefined, ""]) assert.equal(getEmotion(m), FALLBACK_EMOTION);
});
test("isEmotionKey narrows only real keys", () => {
  assert.equal(isEmotionKey("anger"), true);
  assert.equal(isEmotionKey("toString"), false);
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npm test`. Expected: FAIL, `getEmotion` is not exported.

- [ ] **Step 4: Implement `isEmotionKey`, `getEmotion`, `FALLBACK_EMOTION` in `emotions.ts`**

Use `Object.hasOwn(EMOTION_MAP, value)` so prototype keys like `toString` are rejected.

- [ ] **Step 5: Run tests, expect PASS**

- [ ] **Step 6: Replace every listed `EMOTION_MAP[x]` read with `getEmotion(x)`**

Iterations over `ALL_EMOTIONS` stay as they are. Run `npx tsc --noEmit` and `npx eslint src`: no output.

- [ ] **Step 7: Owner test**

Owner opens `/home`, `/collection`, `/calendar`, `/profile`, one `/character/[id]`: everything looks the same as before.

- [ ] **Step 8: Commit, push, deploy**

```bash
git add package.json package-lock.json src/lib/constants/emotions.ts src/lib/constants/emotions.test.ts "src/app/(game)" src/components && git commit -m "feat(craftjai): pages tolerate moods they do not know"
```

Deploy now (the guard must be live before Task 2's migration).

---

### Task 2: 14 emotions, zones, V-A per character, no denominators (spec step 1)

**Files:**
- Create: `supabase/migrations/003_emotion_zones.sql`
- Modify: `src/lib/constants/emotions.ts` (14 entries, `ZONES`, remove the unused `emoji` field)
- Modify: `src/lib/constants/emotions.test.ts`
- Modify: `src/lib/gemini/client.ts` (enum from `ALL_EMOTIONS`), `src/lib/gemini/analyze-mood.ts` (validate with `isEmotionKey`), `src/lib/gemini/prompts.ts` (14 definitions, zone list)
- Modify: `src/app/api/generate-character/route.ts` (insert `valence`, `arousal`)
- Modify: `src/types/character.ts` (`valence: number | null; arousal: number | null`)
- Modify (drop denominators): `src/app/(game)/home/page.tsx:183` title, `src/app/(game)/profile/page.tsx:74`, `src/app/(game)/collection/feelings/page.tsx:41`, `src/app/(auth)/login/page.tsx:207` aria-label, `src/lib/gamification/achievements.ts:40` (remove the `mood_explorer` condition, keep its definition)

**Interfaces:**
- Consumes: `getEmotion`, `isEmotionKey` (Task 1).
- Produces: `type ZoneKey = "yellow" | "red" | "blue" | "green"`; `ZONES: Record<ZoneKey, { label: string; hex: string; element: string }>`; each `EMOTION_MAP` entry has `zone: ZoneKey`, `body: string` (locked sentence), `stages: readonly [string, string, string]` (element per stage), `never: string` plus the existing `animal`, `name`, `color`, `hex`, `quote`.

**Zones:**

| key | label | hex | element |
|---|---|---|---|
| yellow | Bright | `#e3b261` | sunlight, sparks, stars |
| red | Restless | `#d9605a` | storm, embers, thunder |
| blue | Heavy | `#6b8fd6` | rain, night, moon, clouds |
| green | Easy | `#8fa88a` | meadow, leaves, pond, breeze |

**Emotions** (names of the 6 new ones are proposals; the owner confirms in Step 8):

| key | zone | name | animal | hex | body (locked sentence) | stages 1, 2, 3 |
|---|---|---|---|---|---|---|
| joy | yellow | Sunny | dog | `#facc15` | a small round golden-yellow mochi-shaped creature with a bouncy squishy body, two floppy dog-like ears shaped like sunflower petals, a tiny button snout and big shiny dark eyes | a small glowing sun gem on its forehead / a soft sun halo behind its head / a warm full sunburst of golden rays behind its head |
| anticipation | yellow | Ember | fox | `#f97316` | a slim orange creature standing on tiptoe, a big fluffy fox-like tail, pointed ears and bright curious eyes | one firefly circling it / three fireflies circling it / a small swarm of fireflies around it |
| surprise | yellow | Zippy | bird | `#fbbf24` | a round puffed-up amber creature with huge round eyes, tiny wings and a little bird-like crest | a crest with one star / a crest with three stars / a crest with five stars |
| proud | yellow | Plume | peacock | `#ca8a04` | a gold creature standing tall with its chest out, a fan-shaped peacock-like tail and a small confident smile | three sunray tail feathers / five sunray tail feathers / seven glowing sunray tail feathers |
| anger | red | Blaze | tiger | `#ef4444` | a compact red creature with raised shoulders, tiger-like stripes and short round ears | glowing ember stripes / warm softly glowing stripes / stripes giving off tiny soft sparks |
| fear | red | Shiver | rabbit | `#a3476b` | a small plum creature hunched down, long rabbit-like ears folded back and big glossy eyes | a tiny thundercloud above its head / a thundercloud with a silver lining / a small rainbow above its head |
| disgust | red | Grim | mouse | `#b45309` | a rust-brown creature with a wrinkled nose turning its face away and round mouse-like ears | a sour puff of smoke beside it / a faint fading puff / a small flower where the puff was |
| stressed | red | Prickle | hedgehog | `#be123c` | a round crimson creature with hedgehog-like spines along its back, raised worried eyebrows and a small sweat drop | spines crackling with tiny static sparks / softened rounded spines / spine tips with tiny pink blossoms |
| sadness | blue | Luna | cat | `#3b82f6` | a drooping blue creature with soft cat-like ears and lowered shoulders | a small rain cloud above its head / a light drizzle from the cloud / a small rainbow above its head |
| lonely | blue | Lumen | whale | `#4f46e5` | a small indigo creature with a little whale-like tail fin, holding a tiny lantern in both hands | a dim small lantern / a brighter lantern / a lantern with a second small light answering in the distance |
| bored | blue | Drift | sloth | `#94a3b8` | a flat, melting grey-blue creature with droopy sloth-like eyes and long soft arms | a plain grey cloud above it / a cloud with faint colors / a cloud with a soft star pattern |
| tired | blue | Dozy | lamb | `#a5b4fc` | a fluffy lavender-blue creature with a soft cloud-like wool body like a lamb, floppy pink-lined ears, rosy cheeks and half-closed sleepy eyes | a small glowing crescent moon above its head / a glowing half moon above its head / a glowing full moon above its head |
| trust | green | Oakley | bear | `#4ade80` | a big warm green creature with a round bear-like face and open arms | a small sprout on its back / a small bush on its back / a little tree on its back |
| calm | green | Lotus | capybara | `#5eead4` | a round chibi mint creature sitting still, a capybara-like face with tiny dot eyes half closed and small rounded ears | a lily pad on its head / a lotus bud on the lily pad / an open pink lotus on the lily pad |

`never` for all: `"no clothes, no collar, no text"`. `color` keeps a plain color word (for the `characters.color` column).

- [ ] **Step 1: Write the failing tests**

```ts
test("there are 14 emotions and every zone has at least two", () => {
  assert.equal(ALL_EMOTIONS.length, 14);
  for (const z of Object.keys(ZONES)) assert.ok(ALL_EMOTIONS.filter((k) => EMOTION_MAP[k].zone === z).length >= 2);
});
test("every emotion has a body sentence and three stage elements without banned words", () => {
  const banned = /\b(anime|masterpiece|best quality|bed|bath|naked)\b/i;
  for (const k of ALL_EMOTIONS) {
    const e = EMOTION_MAP[k];
    assert.equal(e.stages.length, 3);
    assert.ok(!banned.test(e.body) && !e.stages.some((s) => banned.test(s)));
  }
});
```

- [ ] **Step 2: Run, expect FAIL** (`ALL_EMOTIONS.length` is 8)

- [ ] **Step 3: Write `003_emotion_zones.sql`**

```sql
alter type mood_type add value if not exists 'proud';
alter type mood_type add value if not exists 'stressed';
alter type mood_type add value if not exists 'lonely';
alter type mood_type add value if not exists 'bored';
alter type mood_type add value if not exists 'tired';
alter type mood_type add value if not exists 'calm';

alter table public.characters
  add column if not exists valence real check (valence >= -1 and valence <= 1),
  add column if not exists arousal real check (arousal >= 0 and arousal <= 1);

update public.characters c
set valence = d.valence, arousal = d.arousal
from public.diary_entries d
where c.diary_entry_id = d.id and c.valence is null;
```

- [ ] **Step 4: Owner runs 003 in the Supabase SQL Editor** and checks: `select unnest(enum_range(null::mood_type));` lists 14 values; `select count(*) from characters where valence is null;` is 0 or only rows whose diary has null V-A.

- [ ] **Step 5: Implement the emotion data, Gemini changes, route insert and denominator removal**

Prompt definitions: copy the ten pair definitions from spec section 5 verbatim; keep "anxiety, worry" under FEAR and move "pressure, overwhelmed" to STRESSED. Counters become plain counts, for example `` `${met.size} feelings have visited you` ``. The "feelings met" dots on Home and Passport show only feelings that have visited (no grey placeholder dots for the rest), so nothing reads as a set to complete. The login page decoration may show all 14 colors.

- [ ] **Step 6: Run `npm test`, `npx tsc --noEmit`, `npx eslint src`: all pass, no output from the last two**

- [ ] **Step 7: Owner test**

Write two diaries locally: one about being sleepy after work, one about finishing a hard task. Expected: the first comes back as `tired` (Dozy), the second as `proud` (Plume). No "of 8" anywhere.

- [ ] **Step 8: Owner confirms the 6 new names** (Plume, Prickle, Lumen, Drift, Dozy, Lotus) or gives replacements; update the table.

- [ ] **Step 9: Commit, push, deploy** (migration already ran in Step 4)

```bash
git add supabase/migrations/003_emotion_zones.sql src docs/plans/2026-11-25_emotion-zones-implementation-plan.md && git commit -m "feat(craftjai): 14 emotions in 4 zones, V-A per character, no set counters"
```

---

### Task 3: Creature prompt builder and master-making script (spec step 2)

**Files:**
- Create: `src/lib/creatures/prompt.ts`, `src/lib/creatures/prompt.test.ts`
- Create: `scripts/creatures.ts` (local only, reads `.env.local`, never imported by the app)
- Create: `public/creatures/` (approved masters, `{emotion}-stage{n}.jpg`, 512x512)
- Create: `src/lib/creatures/masters.ts`

**Interfaces:**
- Consumes: `EMOTION_MAP`, `EmotionKey` (Task 2).
- Produces: `sanitizeScene(scene: string): string`; `buildCreaturePrompt(args: { emotion: EmotionKey; stage: 1 | 2 | 3; scene: string; mode: "master" | "scene" }): string`; `APPROVED_MASTERS: ReadonlySet<string>` of keys like `"tired-3"`.

Prompt shapes (exact):
- scene mode: `` `The ${body} from image 0, with the exact same face, body and colors, ${stageElement}, ${sanitizeScene(scene)}. 3D vinyl toy figure style, soft lighting, ${never}` ``
- master mode: `` `Character reference of the ${body}, ${stageElement}. It stands alone, front view, full body visible, arms relaxed, nothing under it, no props, plain soft cream background. 3D vinyl toy figure style, soft studio lighting, ${never}` ``

`sanitizeScene` replacements (whole words, case-insensitive): bed to "cozy cushion", bath to "warm water", anime, masterpiece, "best quality", naked removed; collapse double spaces.

- [ ] **Step 1: Write the failing tests**

```ts
test("scene prompt keeps the body sentence verbatim and the stage element", () => {
  const p = buildCreaturePrompt({ emotion: "tired", stage: 3, scene: "eating noodles", mode: "scene" });
  assert.ok(p.includes(EMOTION_MAP.tired.body));
  assert.ok(p.includes(EMOTION_MAP.tired.stages[2]));
  assert.ok(p.endsWith("no clothes, no collar, no text"));
});
test("banned words in a Gemini scene never reach the prompt", () => {
  const p = buildCreaturePrompt({ emotion: "sadness", stage: 1, scene: "Resting in BED after a bath, anime style", mode: "scene" });
  assert.doesNotMatch(p, /\b(bed|bath|anime)\b/i);
  assert.match(p, /cozy cushion/);
});
test("master prompt asks for a lone standing figure on a plain background", () => {
  assert.match(buildCreaturePrompt({ emotion: "joy", stage: 1, scene: "", mode: "master" }), /stands alone.*plain soft cream background/);
});
```

- [ ] **Step 2: Run, expect FAIL; implement `prompt.ts`; run, expect PASS**

- [ ] **Step 3: Write `scripts/creatures.ts`** with two commands, run via `npx tsx scripts/creatures.ts`:
  - `candidates <emotion> <count>`: klein 4B text-only (no `input_image_0`) with the master-mode prompt for stage 1, writes JPGs to the session scratchpad.
  - `master <emotion> <stage> <referenceFile>`: klein 4B with the reference as `input_image_0` and the master-mode prompt for that stage, writes `public/creatures/{emotion}-stage{stage}.jpg` at 512x512 (resize the reference to 512 first with `sharp`).

Request: multipart `FormData` with `prompt`, `input_image_0` (Blob, image/jpeg), `width` `512`, `height` `512`; response `result.image` base64. Print neurons left from `getImageQuota()` after each run.

- [ ] **Step 4: Make masters with the owner, a few creatures per day**

For each emotion: show candidates in the brainstorm companion, owner picks, make stage 1, 2, 3 masters from the pick, owner approves, add `"{emotion}-{n}"` to `APPROVED_MASTERS`. Start with tired from `docs/plans/assets/2026-11-25_spike-tired-master.jpg` (stage 3). Order: one creature per zone first (tired, joy, stressed, calm), then the rest. Check the quota chip before each session.

- [ ] **Step 5: Commit after each approved batch**

```bash
git add scripts/creatures.ts src/lib/creatures/prompt.ts src/lib/creatures/prompt.test.ts src/lib/creatures/masters.ts public/creatures && git commit -m "feat(craftjai): creature masters for <emotions>"
```

No deploy needed until Task 4.

---

### Task 4: Generate diary pictures from masters with klein 4B (spec step 3)

**Files:**
- Create: `src/lib/creatures/masters.test.ts`, `src/lib/image-gen/retry.ts`, `src/lib/image-gen/retry.test.ts`
- Modify: `src/lib/creatures/masters.ts`, `src/lib/image-gen/generate-image.ts`, `src/app/api/generate-character/route.ts`, `src/lib/gemini/prompts.ts` (section 3: `character_prompt` now holds the scene only)

**Interfaces:**
- Consumes: `buildCreaturePrompt`, `APPROVED_MASTERS` (Task 3).
- Produces:
  - `masterFor(emotion: EmotionKey, stage: 1 | 2 | 3): { file: string; stage: 1 | 2 | 3 } | null`, the requested stage if approved, else the highest approved lower stage, else `null`.
  - `generateWithRetry<T>(run: (prompt: string) => Promise<T>, prompts: { main: string; plain: string }, fallback: (() => Promise<T>) | null): Promise<{ result: T; source: "main" | "plain" | "fallback" }>`; filter errors are those with `code` 8007 or 3030.
  - `generateCreatureImage(args: { emotion: EmotionKey; stage: 1 | 2 | 3; scene: string; origin: string }): Promise<{ buffer: Buffer; model: string; stageUsed: 1 | 2 | 3 | null }>`. It uses klein with the master when `masterFor` finds one, otherwise the old schnell text path with the body sentence plus scene.

- [ ] **Step 1: Write the failing tests**

```ts
// masters.test.ts
const approved = new Set(["tired-1", "tired-3"]);
test("falls back to the highest approved lower stage", () => {
  assert.deepEqual(masterFor("tired", 2, approved), { file: "/creatures/tired-stage1.jpg", stage: 1 });
  assert.deepEqual(masterFor("tired", 3, approved), { file: "/creatures/tired-stage3.jpg", stage: 3 });
});
test("no master at all returns null", () => assert.equal(masterFor("bored", 1, approved), null));

// retry.test.ts
test("filter rejection retries once with the plain prompt", async () => { /* run rejects {code:3030} for main, resolves for plain: source "plain" */ });
test("two filter rejections use the fallback", async () => { /* source "fallback" */ });
test("quota or server errors also use the fallback when there is one", async () => { /* run rejects {code:4006}: source "fallback", run called once */ });
test("no fallback rethrows the last error", async () => { /* rejects */ });
```

Make `masterFor` take the approved set as an optional second-level parameter (`masterFor(emotion, stage, approved = APPROVED_MASTERS)`) so tests do not depend on which masters exist.

- [ ] **Step 2: Run, expect FAIL; implement `masterFor` and `generateWithRetry`; run, expect PASS**

- [ ] **Step 3: Implement `generateCreatureImage`** in `generate-image.ts`: fetch master bytes from `new URL(file, origin)`, klein multipart call at 512x512, plain prompt = `buildCreaturePrompt` with scene `"sitting calmly in a cozy, bright room"`, fallback = the master bytes. Output webp 512 via `sharp` as today.

- [ ] **Step 4: Wire the route**: pass `origin: new URL(request.url).origin`, `stage: 1` for now, save `generation_model` from the result, `evolution_level: stageUsed ?? 1`. Gemini section 3 asks for "what the creature is doing, where, and diary details, without describing the creature's body", keeping the banned-word rule.

- [ ] **Step 5: `npm test`, `npx tsc --noEmit`, `npx eslint src`: pass**

- [ ] **Step 6: Owner test** (costs about 41 neurons per picture): write a diary that maps to an emotion with a master (for example sleepy for tired). Expected: the picture shows the same creature as the master in a scene from the diary; quota chip drops by about 40, not about 330. Then one emotion without a master still gets a picture.

- [ ] **Step 7: Commit, push, deploy**

```bash
git add src/lib/creatures src/lib/image-gen src/app/api/generate-character/route.ts src/lib/gemini/prompts.ts && git commit -m "feat(craftjai): diary pictures from approved masters with FLUX.2 klein 4B"
```

---

### Task 5: Heart map on the Mirror, feelings shelf by zone (spec step 4)

**Files:**
- Create: `src/lib/creatures/heart-map.ts`, `src/lib/creatures/heart-map.test.ts`, `src/components/calendar/heart-map.tsx`
- Modify: `src/app/(game)/calendar/page.tsx` (fetch the user's characters `id, mood, valence, arousal`; render the map below the month view), `src/app/(game)/collection/feelings/page.tsx` (sections per zone in order yellow, red, blue, green)

**Interfaces:**
- Consumes: `ZONES`, `getEmotion` (Task 2), character `valence`/`arousal` (Task 2).
- Produces: `dropPosition(zone: ZoneKey, valence: number | null, arousal: number | null, seed: string): { x: number; y: number }` in 0..1, origin bottom-left (x = (valence + 1) / 2, y = arousal), clamped into the zone quadrant with a 0.04 margin (red x 0-0.5 y 0.5-1, yellow x 0.5-1 y 0.5-1, blue x 0-0.5 y 0-0.5, green x 0.5-1 y 0-0.5). Missing V-A: quadrant center plus a deterministic jitter (max 0.12) from a hash of `seed`.

- [ ] **Step 1: Write the failing tests**

```ts
test("a low-arousal joy stays inside yellow", () => {
  const p = dropPosition("yellow", 0.8, 0.3, "a");
  assert.ok(p.y >= 0.54 && p.x >= 0.54);
});
test("tired keeps its real position inside blue", () => {
  assert.deepEqual(dropPosition("blue", -0.3, 0.1, "a"), { x: 0.35, y: 0.1 });
});
test("missing V-A lands inside the zone and is stable for the same seed", () => {
  const a = dropPosition("green", null, null, "char-1");
  assert.deepEqual(a, dropPosition("green", null, null, "char-1"));
  assert.ok(a.x >= 0.54 && a.x <= 0.96 && a.y >= 0.04 && a.y <= 0.46 && Number.isFinite(a.x));
});
```

- [ ] **Step 2: Run, expect FAIL; implement; run, expect PASS**

- [ ] **Step 3: Build `HeartMap`** (server component, SVG viewBox 300x300): blurred group (`feGaussianBlur stdDeviation 9`) of circles r 26 opacity 0.22 in each drop's zone color; corner words `restless` (top-left), `bright` (top-right), `heavy` (bottom-left), `easy` (bottom-right) in `.font-game`, opacity 0.6; title "Where your heart has been", subtitle "the more you write, the deeper the color". No numbers, no axes. Matches the approved watercolor mockup.

- [ ] **Step 4: Group the feelings shelf by zone** with the zone `label` as a small heading; inside a zone keep the current "most recently visited first" order. Books for feelings that have not visited keep the current quiet empty look: no lock icon, no "missing" or "locked" text.

- [ ] **Step 5: `npm test`, `npx tsc --noEmit`, `npx eslint src`: pass**

- [ ] **Step 6: Owner test**: `/calendar` shows the watercolor map with one drop per existing character, darker where they stack; `/collection/feelings` shows four zone groups; no counts anywhere.

- [ ] **Step 7: Commit (deploy at the next milestone)**

```bash
git add src/lib/creatures/heart-map.ts src/lib/creatures/heart-map.test.ts src/components/calendar/heart-map.tsx "src/app/(game)/calendar/page.tsx" "src/app/(game)/collection/feelings/page.tsx" && git commit -m "feat(craftjai): watercolor heart map on the Mirror, feelings shelf by zone"
```

---

### Task 6: Creatures grow with hidden visit thresholds (spec step 5)

**Files:**
- Create: `src/lib/creatures/growth.ts`, `src/lib/creatures/growth.test.ts`
- Modify: `src/app/api/generate-character/route.ts`

**Interfaces:**
- Consumes: `generateCreatureImage` (Task 4).
- Produces: `GROWTH_THRESHOLDS = { stage2: 5, stage3: 15 } as const` (visit number at which the stage starts); `stageForVisit(previousVisits: number): 1 | 2 | 3`.

- [ ] **Step 1: Write the failing test**

```ts
test("stage follows the visit number", () => {
  assert.deepEqual([0, 3, 4, 13, 14, 40].map(stageForVisit), [1, 1, 2, 2, 3, 3]);
});
```

- [ ] **Step 2: Run, expect FAIL; implement; run, expect PASS**

- [ ] **Step 3: Wire the route**: before generating, count the user's existing characters with this `mood` (`select("*", { count: "exact", head: true })`), pass `stageForVisit(count)` as `stage`. Nothing about stages or visits is shown in the UI.

- [ ] **Step 4: `npm test`, `npx tsc --noEmit`, `npx eslint src`: pass**

- [ ] **Step 5: Owner test**: in the SQL Editor, check `select mood, count(*), max(evolution_level) from characters where user_id = '<own id>' group by mood;` after a new diary; a mood with 4 or more earlier visits gets `evolution_level` 2 and a stage 2 picture when that master exists.

- [ ] **Step 6: Commit, push, deploy (milestone)**

```bash
git add src/lib/creatures/growth.ts src/lib/creatures/growth.test.ts src/app/api/generate-character/route.ts && git commit -m "feat(craftjai): creatures grow with hidden visit thresholds"
```
