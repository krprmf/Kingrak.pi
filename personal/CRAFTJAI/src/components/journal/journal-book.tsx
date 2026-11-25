"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { getEmotion, type EmotionKey } from "@/lib/constants/emotions";
import { btnPrimary, panel } from "@/components/game/ui";
import { DateTicket, Doodle, GhostNote, MoodStamp, PaperSheet, TapedPhoto, TornNote, WashiTape } from "./scrapbook";

export type JournalEntry = {
  id: string;
  createdAt: string; // ISO timestamp (UTC)
  content: string;
  mood: EmotionKey | null;
  reply: string | null;
  characters: { id: string; imageUrl: string; name: string; mood: EmotionKey }[];
};

type Day = { key: string; date: Date; entries: JournalEntry[] };

// Older ghost replies were written in Thai; only show English ones.
const THAI_SENTENCE = /[\u0E00-\u0E7F]{4,}/;

// Days must follow the reader's own clock (a 1 a.m. entry in Bangkok is "today" there,
// not "yesterday" in UTC), so the book is only drawn in the browser.
const noop = () => () => {};
const useOnClient = () => useSyncExternalStore(noop, () => true, () => false);

/** Group entries (oldest first) into one page per local calendar day. */
function groupByDay(entries: JournalEntry[]): Day[] {
  const days: Day[] = [];
  for (const e of entries) {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const last = days[days.length - 1];
    if (last?.key === key) last.entries.push(e);
    else days.push({ key, date: d, entries: [e] });
  }
  return days;
}

// One journal book, one page per day. Opens on the newest day; flip back to
// earlier days with the buttons, a swipe, or the left/right arrow keys.
export function JournalBook({ entries }: { entries: JournalEntry[] }) {
  const onClient = useOnClient();
  const days = useMemo(() => (onClient ? groupByDay(entries) : []), [entries, onClient]);
  const [index, setIndex] = useState<number | null>(null); // null = newest day
  const [dir, setDir] = useState(0); // -1 = flipping back in time, 1 = forward
  const current = index ?? days.length - 1;

  const go = useCallback(
    (step: -1 | 1) => {
      const next = current + step;
      if (next < 0 || next >= days.length) return;
      setDir(step);
      setIndex(next);
    },
    [current, days.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!onClient) {
    // Same size as the book, so nothing jumps when it appears
    return <div className="m-auto h-full w-full max-w-md" />;
  }

  if (days.length === 0) {
    return (
      <div className="m-auto w-full max-w-sm">
        <PaperSheet className="rounded-[18px] shadow-[0_10px_30px_rgba(74,52,38,0.25)]">
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-lg font-bold text-cozy-cocoa">Your journal is still empty</p>
            <p className="text-sm text-cozy-mocha">Write your first page at the desk and it will appear here.</p>
            <Link href="/diary" className={`${btnPrimary} h-12 px-5`}>
              <PenLine className="h-5 w-5" /> Go to the desk
            </Link>
          </div>
        </PaperSheet>
      </div>
    );
  }

  const day = days[current];

  return (
    <div className="m-auto flex h-full w-full max-w-md flex-col gap-3 lg:max-w-5xl">
      {/* The book: a cloth cover peeking out, page edges, and the current day on top */}
      <div className="relative min-h-0 flex-1 [perspective:2000px]">
        <div className="absolute -inset-1.5 rounded-[22px] bg-cozy-clay-dark shadow-[0_14px_34px_rgba(74,52,38,0.35)]" />
        <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-[16px] bg-[#eadcc4]" />

        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={day.key}
            custom={dir}
            variants={flip}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.4, 0.1, 0.2, 1] }}
            // phone: one page turning on its left edge; desktop: a spread turning on the spine
            className="absolute inset-0 origin-left overflow-hidden rounded-[16px] [backface-visibility:hidden] lg:origin-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
          >
            <DaySpread day={day} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page controls */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={current === 0}
          className={`${panel} flex h-11 cursor-pointer items-center gap-1 px-3 text-sm font-semibold text-cozy-cocoa transition-opacity disabled:cursor-default disabled:opacity-40`}
        >
          <ChevronLeft className="h-4.5 w-4.5" /> Earlier
        </button>
        <span className="text-sm text-cozy-mocha">
          Day {current + 1} of {days.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={current === days.length - 1}
          className={`${panel} flex h-11 cursor-pointer items-center gap-1 px-3 text-sm font-semibold text-cozy-cocoa transition-opacity disabled:cursor-default disabled:opacity-40`}
        >
          Later <ChevronRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}

// Forward: the current page turns away to the left, revealing the next one underneath.
// Back: the earlier page turns in from the left, covering the current one.
const flip = {
  enter: (dir: number) => ({ rotateY: dir < 0 ? -100 : 0, opacity: dir < 0 ? 0.6 : 1, zIndex: dir < 0 ? 2 : 1 }),
  center: { rotateY: 0, opacity: 1, zIndex: 2 },
  exit: (dir: number) => ({ rotateY: dir > 0 ? -100 : 0, opacity: dir > 0 ? 0.6 : 0, zIndex: dir > 0 ? 3 : 0 }),
};

/**
 * One day as a scrapbook spread.
 * Desktop: left page = date ticket, mood stamps and the day's pictures; right page = what you wrote.
 * Phone: the same two sheets stacked into one scrolling page.
 */
function DaySpread({ day }: { day: Day }) {
  const seed = day.key;
  const weekday = day.date.toLocaleDateString("en-US", { weekday: "long" });
  const date = day.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const moods = [...new Set(day.entries.map((e) => e.mood).filter((m): m is EmotionKey => !!m))];
  const accent = moods[0] ? getEmotion(moods[0]).hex : "#b8694b";
  const photos = day.entries.flatMap((e) => e.characters);
  const photoSize = photos.length === 1 ? "w-[72%]" : photos.length === 2 ? "w-[47%]" : "w-[40%]";

  return (
    <div className="h-full overflow-y-auto lg:grid lg:grid-cols-2 lg:overflow-hidden">
      {/* Left page: date, moods, pictures */}
      <PaperSheet side="left" className="lg:h-full">
        <div className="relative space-y-6 px-6 pb-8 pt-6 lg:h-full lg:overflow-y-auto">
          <Doodle kind="sprig" color={accent} className="right-3 top-24 h-24 w-16" />
          <Doodle kind="star" color="#b98838" className="bottom-6 left-4 h-10 w-8" />

          <div className="flex items-start justify-between gap-3">
            <DateTicket weekday={weekday} date={date} seed={seed} />
            <div className="flex -space-x-3 pt-1">
              {moods.map((m, i) => (
                <MoodStamp key={m} mood={m} color={getEmotion(m).hex} seed={seed} i={i} />
              ))}
            </div>
          </div>

          {photos.length > 0 ? (
            <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-8 pb-4 pt-2">
              {photos.map((c, i) => (
                <TapedPhoto key={c.id} href={`/character/${c.id}`} src={c.imageUrl} name={c.name} seed={seed} i={i} size={photoSize} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-cozy-mocha [font-family:var(--font-itim)]">no pictures this time, just words</p>
          )}
        </div>
      </PaperSheet>

      {/* Right page: what you wrote, and what the ghost said */}
      <PaperSheet side="right" className="lg:h-full">
        <div className="relative space-y-7 px-6 pb-10 pt-6 lg:h-full lg:overflow-y-auto">
          <Doodle kind="heart" color={accent} className="right-4 top-4 h-10 w-8" />
          <div className="relative ml-3 inline-block bg-[#d9bf98] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cozy-cocoa shadow-sm">
            <WashiTape seed={seed} i={9} className="-left-4 -top-3 w-9" />
            what happened
          </div>

          {day.entries.map((entry, i) => {
            const time = new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const reply = entry.reply && !THAI_SENTENCE.test(entry.reply) ? entry.reply : null;
            return (
              <section key={entry.id} className="space-y-4">
                <TornNote time={time} seed={entry.id} i={i}>
                  {entry.content}
                </TornNote>
                {reply && <GhostNote text={reply} seed={entry.id} i={i} />}
              </section>
            );
          })}
        </div>
      </PaperSheet>
    </div>
  );
}
