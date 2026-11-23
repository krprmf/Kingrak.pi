# CRAFTJAI v2 — Updated Research & Technology Stack (2026)

> Researched: April 2026
> Based on: CRAFTJAI (IEEE ECTI-CON 2025) by Kingrak Phairoh, Atiwong Suchato, Proadpran Punyabukkana

---

## 1. What Changed Since the Paper (2025 vs 2026)

| Component | Paper (2025) | Recommended Update (2026) |
|---|---|---|
| LLM for Mood Analysis | Gemini 1.5 Pro | Gemini 3.1 Pro / Claude 4.6 |
| Prompt Technique | CoT + Few-shot | Structured JSON Output + Function Calling |
| Emotion Model | Plutchik's Wheel (8 emotions) | Geneva Emotion Wheel / Valence-Arousal-Dominance (continuous) |
| Text-to-Image Model | FLUX.1 [schnell] | FLUX.2 [dev] / FLUX.2 [klein] |
| Fine-tuning Method | LoRA (rank 16) | DoRA (rank 24-32) |
| Character Consistency | None (each generation independent) | IP-Adapter FaceID + ControlNet OpenPose |
| Emotion-Conditioned Generation | Prompt-based only | EmotiCrafter Valence-Arousal Embedding |
| Dataset | Manual curation | LLM-assisted + automated quality filtering |

---

## 2. LLM Upgrade — Mood Analysis

### 2.1 Best Models Now (Free/Cheap)

| Model | Cost | Strengths | Free Tier |
|---|---|---|---|
| **Gemini 3.1 Flash** | $0.25/MTok | Multimodal (text+image+audio), fast | 15 RPM free |
| **Claude Haiku 4.5** | $1/MTok | Great nuance in text, structured output | Limited free |
| **DeepSeek V3** | $0.27/MTok | Best budget option, strong reasoning | Free tier available |
| **Gemini 3.1 Pro** | ~$3.50/MTok | Best overall multimodal emotion analysis | 5 RPM free |
| **Claude 4.6 Opus** | Premium | Superior long-context diary understanding | Via Claude Code |

**Recommendation:** Use **Gemini 3.1 Flash** for production (free + fast + multimodal). Use **Claude 4.6** for complex/long diary entries.

### 2.2 Prompt Engineering — Beyond CoT & Few-shot

**Old way (Paper):**
```
Analyze the following diary entry...
### Instructions:
1. Identify one primary emotion...
2. Identify a location...
```

**New way (2026) — Structured JSON Output:**
```json
{
  "system": "You are an emotion analysis expert. Respond ONLY in the specified JSON schema.",
  "response_schema": {
    "mood": {
      "primary": "string (from emotion list)",
      "valence": "float (-1 to 1)",
      "arousal": "float (0 to 1)",
      "confidence": "float (0 to 1)"
    },
    "context": {
      "location": "string",
      "activity": "string",
      "social_setting": "string"
    },
    "character_prompt": "string (detailed character description)"
  }
}
```

**Why this is better:**
- No parsing errors — model outputs valid JSON guaranteed
- Valence-Arousal gives continuous emotion spectrum (not just 8 buckets)
- Confidence score enables quality filtering
- Single API call does mood + context + character prompt (was 2 calls before)

### 2.3 Emotion Model Upgrade

**Paper:** Plutchik's Wheel — 8 discrete emotions (joy, trust, fear, sadness, surprise, disgust, anger, anticipation)

**Recommended:** Hybrid approach

```
Layer 1: Plutchik's 8 emotions (keep for character mapping — backward compatible)
Layer 2: Valence-Arousal-Dominance (continuous, for intensity/power level)
  - Valence: positive ↔ negative (-1 to 1)
  - Arousal: calm ↔ excited (0 to 1)
  - Dominance: submissive ↔ dominant (0 to 1)
```

**Benefit for Gamification:**
- Valence → character color intensity
- Arousal → character pose (calm sitting vs dynamic action)
- Dominance → character "power level" / rarity

---

## 3. Text-to-Image Upgrade

### 3.1 Model Comparison

| Model | Quality | Speed | Open Source | Fine-tunable | Best For |
|---|---|---|---|---|---|
| **FLUX.2 [dev]** | Excellent | Medium | Yes (HF) | Yes (DoRA/LoRA) | Best overall for characters |
| **FLUX.2 [klein]** (4B) | Great | Fast | Yes | Yes | Runs on consumer GPU (13GB) |
| **SD 3.5 Large** | Great | Medium | Yes | Yes | Good multi-subject |
| **Midjourney V7** | Excellent | Fast | No | No (Omni Ref only) | Best quality but closed |
| FLUX.1 [schnell] (paper) | Good | Fast | Yes | Limited | Outdated |

**Recommendation:** **FLUX.2 [dev]** for quality, **FLUX.2 [klein]** for budget/speed

### 3.2 Fine-tuning — LoRA → DoRA

**Paper:** LoRA rank 16, lr 0.0005, 1000 steps

**Recommended:** DoRA (Decomposed Low-Rank Adaptation)

| | LoRA (Paper) | DoRA (Recommended) |
|---|---|---|
| Quality vs Full Fine-tune | ~80-85% | ~90-95% |
| Inference Overhead | None | None |
| Training Cost | Low | Low (same as LoRA) |
| What it does differently | Updates direction only | Decomposes into magnitude + direction |

**Recommended Hyperparameters:**
```
Method: DoRA
Rank: 24-32 (up from 16)
Learning Rate: 0.0005 (keep same)
Training Steps: 1500-2000 (up from 1000)
Boost Factor: 3.0 (keep same)
Mask Generation: Yes (keep same)
```

### 3.3 Character Consistency (NEW)

The paper's biggest weakness — each generation was independent, no consistency.

**2026 Solution Stack:**
```
1. IP-Adapter FaceID Plus → preserves character face identity
2. ControlNet OpenPose → consistent pose/composition
3. DoRA fine-tuned model → consistent style
4. ADetailer → auto-enhance faces/hands post-generation
```

This means: the same "Joy Dog" character will look recognizably the same across different diary entries — critical for the collection/Pokemon mechanic.

---

## 4. New Architecture — EmotiCrafter Integration

**EmotiCrafter** (January 2026) introduced Valence-Arousal embeddings mapped directly into text-to-image features. Instead of relying only on text prompts to convey emotion:

```
Old: "a sad blue cat sitting alone in the rain" (prompt-only emotion)
New: prompt + V-A embedding vector [valence=-0.7, arousal=0.3] injected into model
```

**Result:** More nuanced emotional expression, especially for negative emotions (disgust, fear) which the paper identified as weak points.

---

## 5. Competitive Landscape (2026)

| App | What it does | vs CRAFTJAI |
|---|---|---|
| **Rosebud** | AI journaling + insights | No character generation |
| **Mindsera** | AI journaling + coaching | No gamification/collection |
| **Dayora** | Mood tracking + AI analysis | No visual characters |
| **BOMI** | AI diary + character companion | Fixed character, not generated from mood |
| **Life Note** | 1000+ AI mentors | No mood-to-character |
| **eQuoo** | Gamified mental health | No AI generation |

**Key finding: CRAFTJAI's diary-to-character + collection concept has NO direct competitor.** This is a genuine market gap.

---

## 6. Updated CRAFTJAI v2 Pipeline

```
                          CRAFTJAI v2 Pipeline
                          ====================

User writes diary entry
        │
        ▼
[Gemini 3.1 Flash / Claude 4.6]
  - Structured JSON output
  - Plutchik emotion + V-A-D values
  - Context extraction
  - Character prompt generation
        │
        ▼
[FLUX.2 dev + DoRA fine-tuned models]
  - 8 mood-specific DoRA models (upgraded from LoRA)
  - IP-Adapter for character consistency
  - EmotiCrafter V-A embedding for emotion intensity
  - ControlNet for pose consistency
        │
        ▼
[Post-processing]
  - ADetailer for face/hand enhancement
  - Rarity classification (based on V-A-D values)
  - Power level assignment (based on arousal + dominance)
        │
        ▼
[Gamification Layer]
  - Add to user's collection
  - Check streak / evolution triggers
  - Assign rarity (Common / Uncommon / Rare / Legendary)
  - Notify if new emotion type unlocked
```

---

## 7. Gamification — Ethical Design

**Warning from 2025 research:** Gacha mechanics can trigger compulsive behaviors (reward frequencies above 55 sessions). 

**CRAFTJAI v2 approach — Ethical collection:**
- No paid gacha / no real-money loot boxes
- Rarity based on emotional depth of writing, not randomness
- Daily limit (1-2 characters per day) to prevent compulsive use
- Focus on "meaningful collection" not "addictive collection"
- Collection rewards self-reflection, not spending

---

## 8. What This Means for the Research

### New Contributions (beyond the original paper):
1. **DoRA fine-tuning** on FLUX.2 for emotion-conditioned character generation (first application in mood journaling)
2. **Hybrid emotion model** combining Plutchik + V-A-D for richer character variation
3. **Character consistency pipeline** using IP-Adapter + ControlNet + DoRA (solves the paper's consistency limitation)
4. **Ethical gamification framework** for wellness apps with collection mechanics
5. **Full product implementation** as PWA — bridging research to real-world application

### Potential Publication Venues:
- **CHI 2027** (top HCI conference) — fits perfectly
- **CSCW 2027** — if social features are implemented
- **IEEE ACII** — Affective Computing focus
- **JMIR Mental Health** — journal, high impact in digital health

---

## 9. References (New)

- EmotiCrafter: Emotion-Conditioned Image Generation (arXiv, Jan 2026)
- DoRA: Weight-Decomposed Low-Rank Adaptation (NVIDIA, 2025)
- FLUX.2 by Black Forest Labs (Nov 2025)
- Geneva Emotion Wheel — Scherer (2005), updated applications 2025
- IP-Adapter: Text Compatible Image Prompt Adapter (2024)
- Gacha Mechanics and Gambling Behavior (arXiv, 2025)
- APA Recognition of AI-Assisted Tools (Jan 2026)
- Contextual AI Journaling — CHI 2025
- Designing for AI-Augmented Journaling — CHI 2025
