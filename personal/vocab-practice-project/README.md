# Vocab Practice Tool

CLI-based spaced repetition flashcard system for TOEIC prep. **Pure Python** -- no AI, no frameworks, just code.

## How It Works
- Leitner 5-box spaced repetition algorithm (1d → 1d → 3d → 7d → 14d)
- Interactive flashcard sessions (10 words per session)
- Tracks progress, streaks, and mastery percentage

## Features
- Word stats: correct/wrong counts, box level, last review date
- Weekly heatmap & progress bars
- Daily challenge mode
- Top struggles identification

## Usage
```bash
python vocab.py session   # Start a study session
python vocab.py stats     # View overall progress
python vocab.py week      # Weekly performance
python vocab.py reset     # Reset progress
```

## Files
- `vocab.py` -- Main application
- `vocab.csv` -- Word bank (English, Thai, phonetics, examples, synonyms, antonyms)
- `progress.json` -- Learning progress data
