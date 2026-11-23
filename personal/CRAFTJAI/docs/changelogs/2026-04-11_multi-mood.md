# Changelog: Multi-Mood per Diary Entry

**Date:** 2026-04-11
**Type:** Feature Enhancement

## What Changed
- 1 diary entry can now produce **1-3 characters** (was limited to 1)
- Gemini analyzes diary for multiple emotional segments
- Each segment gets its own mood + character prompt
- Daily limit changed from 2 to 5 (to accommodate multi-mood)

## Why
User feedback: "diary คนนึงมันแตกออกมาได้หลายตัวมากเลย" — a diary entry often contains multiple emotional situations.

## Files Changed
- `src/lib/gemini/client.ts` — Schema now returns `moods[]` array
- `src/lib/gemini/prompts.ts` — Prompt instructs 1-3 mood detection
- `src/lib/gemini/analyze-mood.ts` — Returns MoodAnalysis with moods array
- `src/types/emotion.ts` — New MoodItem type, MoodAnalysis has moods[]
- `src/app/api/analyze-mood/route.ts` — Returns moods array
- `src/app/api/generate-character/route.ts` — Accepts mood data per call, daily limit 5
- DB: Removed unique constraint on `characters.diary_entry_id`

## API Usage Impact
- Gemini: Still 1 call per diary (no increase)
- HF Image Gen: Up to 3 calls per diary (was 1) — user should be aware
