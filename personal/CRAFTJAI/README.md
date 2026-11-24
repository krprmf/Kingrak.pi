# CRAFTJAI

A gamified mood journal: write a diary entry, an LLM reads the mood, and a text-to-image model turns it into a collectible character.

This app is the product version of the paper:

> K. Phairoh, A. Suchato, P. Punyabukkana, "CRAFTJAI: LLM-Enhanced Generative AI for Gamified Mood Journals," *2025 22nd International Conference on Electrical Engineering/Electronics, Computer, Telecommunications and Information Technology (ECTI-CON)*, IEEE, 2025.
> DOI: [10.1109/ECTI-CON64996.2025.11100407](https://doi.org/10.1109/ECTI-CON64996.2025.11100407) · [IEEE Xplore](https://ieeexplore.ieee.org/document/11100407/)

Related artifacts on Hugging Face: [CRAFTJAI-MoodGen-LoRA](https://huggingface.co/krprmf/CRAFTJAI-MoodGen-LoRA) · [CRAFTJAI-MoodCharacter-Dataset](https://huggingface.co/datasets/krprmf/CRAFTJAI-MoodCharacter-Dataset)

## Features

- Diary in two modes: guided chat with the JaiD mascot, or free write (Thai / English)
- Mood analysis with Gemini 2.5 Flash: 1 to 3 moods per entry (Plutchik 8 emotions + valence/arousal/dominance) and a reply from JaiD
- Character generation with FLUX.1-schnell (Cloudflare Workers AI), stored in Supabase Storage
- Collection grouped into 8 mood albums, character detail pages
- Calendar view with per-day entries and mood distribution
- Gamification: rarity based on reflection depth, achievements, streak rewards, daily limit

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · shadcn/ui · Supabase (Auth, Postgres, Storage) · Gemini API · Cloudflare Workers AI

## Getting started

```bash
npm install
```

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
NEXT_PUBLIC_APP_URL=
```

Apply the schema in `supabase/migrations/001_initial_schema.sql` to your Supabase project, then:

```bash
npm run dev
```

The app runs on http://localhost:3456.

## Docs

- `docs/research/` research notes for v2
- `docs/changelogs/` what changed and why
- `comment-feedback.md` review notes and dev log
