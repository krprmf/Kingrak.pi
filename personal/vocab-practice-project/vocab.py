#!/usr/bin/env python3
import csv, json, os, sys, random
from datetime import datetime, timedelta
from pathlib import Path

DIR = Path(__file__).parent
CSV = DIR / "vocab.csv"
PROGRESS = DIR / "progress.json"
SESSION_SIZE = 10
BOXES = {1: 0, 2: 1, 3: 3, 4: 7, 5: 14}  # box: days until next review

# ── Data ──

def load_vocab():
    words = {}
    with open(CSV, newline="", encoding="utf-8") as f:
        for row in csv.reader(f):
            if row and row[0] != "Vocabulary":
                words[row[0].strip()] = {
                    "eng": row[1].strip() if len(row) > 1 else "",
                    "thai": row[2].strip() if len(row) > 2 else "",
                    "example": row[3].strip() if len(row) > 3 else "",
                    "phonetic": row[4].strip() if len(row) > 4 else "",
                    "synonyms": row[5].strip() if len(row) > 5 else "",
                    "antonyms": row[6].strip() if len(row) > 6 else "",
                }
    return words

def load_progress():
    if PROGRESS.exists():
        with open(PROGRESS, encoding="utf-8") as f:
            return json.load(f)
    return {"words": {}, "stats": {"total_sessions": 0, "last_session": None, "streak": 0}, "history": []}

def save_progress(prog):
    with open(PROGRESS, "w", encoding="utf-8") as f:
        json.dump(prog, f, ensure_ascii=False, indent=2)

# ── Leitner logic ──

def pick_cards(vocab, prog, n=SESSION_SIZE):
    due, new = [], []
    for word in vocab:
        wp = prog["words"].get(word)
        if not wp:
            new.append(word)
        else:
            box = wp["box"]
            last = wp["last_review"]
            days_since = (datetime.now() - datetime.strptime(last, "%Y-%m-%d")).days
            if days_since >= BOXES[box]:
                due.append((word, box))
    due.sort(key=lambda x: x[1])
    picks = [w for w, _ in due[:n]]
    if len(picks) < n:
        picks += new[:n - len(picks)]
    random.shuffle(picks)
    return picks

# ── Display helpers ──

def bar(current, total, width=20):
    filled = int(width * current / total) if total else 0
    return "█" * filled + "░" * (width - filled)

# ── Commands ──

def run_session(vocab, prog):
    cards = pick_cards(vocab, prog)
    if not cards:
        print("\n  🎉 No words due for review! Come back later.")
        return
    today = datetime.now().strftime("%Y-%m-%d")
    correct, up, down = 0, 0, 0
    print(f"\n  📚 Session: {len(cards)} words\n")
    for i, word in enumerate(cards):
        print(f"  [{i+1}/{len(cards)}]  📖  {word}")
        input("  (press enter to reveal)")
        m = vocab[word]
        print(f"  ➜  {m['eng']}")
        if m['phonetic']:
            print(f"     🔊 {m['phonetic']}")
        if m['thai']:
            print(f"     {m['thai']}")
        if m['example']:
            print(f"     💬 \"{m['example']}\"")
        if m['synonyms']:
            print(f"     ≈  {m['synonyms']}")
        if m['antonyms']:
            print(f"     ≠  {m['antonyms']}")
        while True:
            ans = input("  Know it? (y/n): ").strip().lower()
            if ans in ("y", "n"):
                break
        wp = prog["words"].get(word, {"box": 1, "last_review": today, "correct": 0, "wrong": 0})
        if ans == "y":
            correct += 1
            wp["box"] = min(wp["box"] + 1, 5)
            wp["correct"] = wp.get("correct", 0) + 1
            up += 1
        else:
            if wp["box"] > 1:
                down += 1
            wp["box"] = 1
            wp["wrong"] = wp.get("wrong", 0) + 1
        wp["last_review"] = today
        prog["words"][word] = wp
        print()

    # update stats
    stats = prog["stats"]
    stats["total_sessions"] = stats.get("total_sessions", 0) + 1
    last = stats.get("last_session")
    if last:
        days_gap = (datetime.now() - datetime.strptime(last, "%Y-%m-%d")).days
        if days_gap <= 1:
            stats["streak"] = stats.get("streak", 0) + (1 if days_gap == 1 else 0)
        else:
            stats["streak"] = 1
    else:
        stats["streak"] = 1
    stats["last_session"] = today

    prog.setdefault("history", []).append({
        "date": today, "reviewed": len(cards), "correct": correct
    })
    save_progress(prog)

    # mini summary
    total = len(vocab)
    mastered = sum(1 for w in prog["words"].values() if w["box"] >= 4)
    pct = int(mastered / total * 100) if total else 0
    print(f"  ✅ Session done!")
    print(f"     {correct}/{len(cards)} correct")
    if up: print(f"     {up} words leveled up ⬆️")
    if down: print(f"     {down} words need more practice ⬇️")
    print(f"     Overall: {pct}% mastered  {bar(mastered, total)}")

    # daily challenge — pick 2 from this session
    challenge = random.sample(cards, min(2, len(cards)))
    print(f"\n  📝 Today's challenge: Try using these in real life!")
    for j, w in enumerate(challenge, 1):
        ex = vocab[w].get("example", "")
        print(f"     {j}. \"{w}\"")
        if ex:
            print(f"        e.g. {ex}")
    print()

def show_stats(vocab, prog):
    total = len(vocab)
    counts = {"🆕 New": 0, "🔴 Learning": 0, "🟡 Reviewing": 0, "🟢 Almost there": 0, "⭐ Mastered": 0}
    for word in vocab:
        wp = prog["words"].get(word)
        if not wp:
            counts["🆕 New"] += 1
        elif wp["box"] == 1:
            counts["🔴 Learning"] += 1
        elif wp["box"] <= 3:
            counts["🟡 Reviewing"] += 1
        elif wp["box"] == 4:
            counts["🟢 Almost there"] += 1
        else:
            counts["⭐ Mastered"] += 1

    mastered = counts["🟢 Almost there"] + counts["⭐ Mastered"]
    pct = int(mastered / total * 100) if total else 0
    streak = prog["stats"].get("streak", 0)

    print(f"\n  🎯 TOEIC Vocab Progress")
    print(f"  {'━' * 34}")
    print(f"\n  📊 Overall: {pct}% mastered")
    print(f"     {bar(mastered, total)}  {mastered} / {total} words")
    print(f"\n  🔥 Streak: {streak} day{'s' if streak != 1 else ''}")
    print(f"\n  📦 Word Status:")
    for label, count in counts.items():
        b = bar(count, total, 15)
        print(f"     {label:<18} {count:>3} words  {b}")

    today = datetime.now().strftime("%Y-%m-%d")
    today_entries = [h for h in prog.get("history", []) if h["date"] == today]
    if today_entries:
        rev = sum(h["reviewed"] for h in today_entries)
        cor = sum(h["correct"] for h in today_entries)
        pct_today = int(cor / rev * 100) if rev else 0
        print(f"\n  📅 Today: {rev} reviewed, {cor} correct ({pct_today}%)")
    print(f"     Total sessions: {prog['stats'].get('total_sessions', 0)}")
    print()

def show_week(vocab, prog):
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    week_start = monday.strftime("%Y-%m-%d")
    week_end = (monday + timedelta(days=6)).strftime("%Y-%m-%d")
    history = prog.get("history", [])
    week_entries = [h for h in history if week_start <= h["date"] <= week_end]

    total_rev = sum(h["reviewed"] for h in week_entries)
    total_cor = sum(h["correct"] for h in week_entries)
    sessions = len(week_entries)
    acc = int(total_cor / total_rev * 100) if total_rev else 0

    print(f"\n  📅 Week of {monday.strftime('%b %d')} - {(monday + timedelta(days=6)).strftime('%b %d')}")
    print(f"  {'━' * 34}")
    print(f"\n  📊 This week:")
    print(f"     Sessions: {sessions}")
    print(f"     Words reviewed: {total_rev}")
    print(f"     Accuracy: {acc}%")

    wrong_counts = {}
    for word, wp in prog["words"].items():
        if wp.get("wrong", 0) > 0 and wp["box"] <= 2:
            wrong_counts[word] = wp["wrong"]
    top_wrong = sorted(wrong_counts.items(), key=lambda x: -x[1])[:5]
    if top_wrong:
        print(f"\n  🏆 Top struggles:")
        for w, c in top_wrong:
            print(f"     {w:<20} {'❌' * min(c, 5)}")

    mastered = [w for w, wp in prog["words"].items() if wp["box"] >= 4 and wp["last_review"] >= week_start]
    if mastered:
        print(f"\n  💪 Newly mastered this week:")
        print(f"     {', '.join(mastered[:10])}")
        if len(mastered) > 10:
            print(f"     ...and {len(mastered) - 10} more")

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    print(f"\n  {' '.join(f'{d:>3}' for d in days)}")
    day_status = []
    for i in range(7):
        d = (monday + timedelta(days=i)).strftime("%Y-%m-%d")
        if d > today.strftime("%Y-%m-%d"):
            day_status.append(" --")
        elif any(h["date"] == d for h in history):
            day_status.append(" ✅")
        else:
            day_status.append(" ❌")
    print(f"  {''.join(day_status)}")
    print()

def reset_progress():
    ans = input("  ⚠️  Reset all progress? (yes/no): ").strip().lower()
    if ans == "yes":
        save_progress({"words": {}, "stats": {"total_sessions": 0, "last_session": None, "streak": 0}, "history": []})
        print("  ✅ Progress reset!")
    else:
        print("  Cancelled.")

# ── Main ──

def main():
    vocab = load_vocab()
    prog = load_progress()
    cmd = sys.argv[1] if len(sys.argv) > 1 else "session"

    if cmd == "stats":
        show_stats(vocab, prog)
    elif cmd == "week":
        show_week(vocab, prog)
    elif cmd == "reset":
        reset_progress()
    else:
        run_session(vocab, prog)

if __name__ == "__main__":
    main()
