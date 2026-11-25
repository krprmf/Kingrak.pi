"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getEmotion, ALL_EMOTIONS, type EmotionKey } from "@/lib/constants/emotions";
import { btnPrimary, panel } from "@/components/game/ui";
import { PaperSheet, WashiTape } from "@/components/journal/scrapbook";

export type MirrorEntry = {
  id: string;
  createdAt: string; // ISO timestamp (UTC)
  content: string;
  mood: EmotionKey | null;
  reply: string | null;
  characters: { id: string; imageUrl: string; name: string }[];
};

// Days and months follow the reader's own clock, so this view is only drawn in the browser.
const noop = () => () => {};
const useOnClient = () => useSyncExternalStore(noop, () => true, () => false);
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// The mirror: a month of ink dots (one per mood that visited that day), the chosen
// day's pictures and words, and a small reflection on the month.
export function CalendarView({ entries, longestStreak }: { entries: MirrorEntry[]; longestStreak: number }) {
  const onClient = useOnClient();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map: Record<string, MirrorEntry[]> = {};
    for (const e of entries) (map[dayKey(new Date(e.createdAt))] ??= []).push(e);
    return map;
  }, [entries]);

  if (!onClient) return <div className="m-auto h-full w-full max-w-5xl" />;

  const first = new Date(month.y, month.m, 1);
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthEntries = entries.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === month.y && d.getMonth() === month.m;
  });
  const daysWritten = new Set(monthEntries.map((e) => dayKey(new Date(e.createdAt)))).size;

  // How often each feeling visited this month
  const counts = ALL_EMOTIONS.map((m) => ({ mood: m, n: monthEntries.filter((e) => e.mood === m).length }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n);
  // Only name a "most visited" feeling when it really is ahead of the rest
  const top = counts.length && (counts.length === 1 || counts[0].n > counts[1].n) ? counts[0] : null;

  const shift = (step: -1 | 1) => {
    setSelected(null);
    setMonth(({ y, m }) => {
      const d = new Date(y, m + step, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const isCurrentMonth = month.y === today.getFullYear() && month.m === today.getMonth();
  const selectedEntries = selected ? byDay[selected] ?? [] : [];

  return (
    <div className="m-auto h-full w-full max-w-5xl overflow-hidden rounded-[16px] shadow-[0_14px_34px_rgba(74,52,38,0.3)] ring-[6px] ring-cozy-clay-dark">
      <PaperSheet className="h-full">
        <div className="h-full overflow-y-auto p-5 sm:p-6 lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-8">
          {/* Month */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className={`${panel} flex h-10 w-10 cursor-pointer items-center justify-center text-cozy-cocoa`}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="relative bg-[#e9d3b0] px-5 py-1.5 text-center shadow-[0_3px_6px_rgba(74,52,38,0.18)]">
                <WashiTape seed={monthName} i={1} className="-left-5 -top-2.5 w-10" />
                <p className="text-lg font-bold uppercase tracking-wider text-cozy-cocoa">{monthName}</p>
              </div>
              <button
                type="button"
                onClick={() => shift(1)}
                disabled={isCurrentMonth}
                aria-label="Next month"
                className={`${panel} flex h-10 w-10 cursor-pointer items-center justify-center text-cozy-cocoa disabled:cursor-default disabled:opacity-40`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="py-1 text-xs font-semibold text-cozy-mocha">
                  {d}
                </span>
              ))}
              {Array.from({ length: first.getDay() }).map((_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = new Date(month.y, month.m, i + 1);
                const key = dayKey(date);
                const dayEntries = byDay[key] ?? [];
                const moods = [...new Set(dayEntries.map((e) => e.mood).filter((m): m is EmotionKey => !!m))];
                const isToday = key === dayKey(today);
                const isSel = key === selected;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={dayEntries.length === 0}
                    onClick={() => setSelected(isSel ? null : key)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border-2 text-sm transition-transform ${
                      dayEntries.length ? "cursor-pointer bg-white/80 hover:-rotate-2 hover:scale-105" : "border-transparent text-cozy-mocha/50"
                    } ${isSel ? "scale-105 border-cozy-clay" : dayEntries.length ? "border-cozy-paper" : ""} ${
                      isToday && !isSel ? "ring-2 ring-cozy-honey" : ""
                    }`}
                  >
                    <span className={dayEntries.length ? "font-semibold text-cozy-cocoa" : ""}>{i + 1}</span>
                    {/* one ink dot per feeling that visited this day */}
                    {moods.length > 0 && (
                      <span className="mt-0.5 flex gap-0.5">
                        {moods.slice(0, 3).map((m) => (
                          <span key={m} className="h-2 w-2 rounded-full" style={{ backgroundColor: getEmotion(m).hex }} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* A small reflection on the month */}
            <div className="space-y-3 rounded-xl bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cozy-mocha">this month</p>
              {monthEntries.length === 0 ? (
                <p className="text-sm text-cozy-mocha [font-family:var(--font-itim)]">A quiet month. Nothing written yet.</p>
              ) : (
                <>
                  <p className="text-sm text-cozy-cocoa [font-family:var(--font-itim)]">
                    You wrote on {daysWritten} day{daysWritten === 1 ? "" : "s"}.{" "}
                    {!top && counts.length > 1 && <>{counts.length} feelings visited equally. </>}
                    {top && (
                      <>
                        <span style={{ color: getEmotion(top.mood).hex }} className="font-semibold">
                          {getEmotion(top.mood).name}
                        </span>{" "}
                        ({top.mood}) visited most, {top.n} time{top.n === 1 ? "" : "s"}.
                      </>
                    )}{" "}
                    Longest streak so far: {longestStreak} day{longestStreak === 1 ? "" : "s"}.
                  </p>
                  {/* the month's feelings as one strip */}
                  <div className="flex h-3 overflow-hidden rounded-full border border-cozy-mocha/20">
                    {counts.map((c) => (
                      <span key={c.mood} title={`${c.mood}: ${c.n}`} style={{ flex: c.n, backgroundColor: getEmotion(c.mood).hex }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs capitalize text-cozy-mocha">
                    {counts.map((c) => (
                      <span key={c.mood} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getEmotion(c.mood).hex }} />
                        {c.mood} {c.n}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Chosen day */}
          <section className="mt-6 lg:mt-0">
            <AnimatePresence mode="wait">
              {selected && selectedEntries.length > 0 ? (
                <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                  <p className="text-lg font-bold text-cozy-cocoa">
                    {new Date(selectedEntries[0].createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                  {selectedEntries.map((e) => (
                    <div key={e.id} className="space-y-2.5 border-b-2 border-dashed border-cozy-paper pb-4 last:border-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-cozy-mocha">
                          {new Date(e.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                        {e.mood && (
                          <span className="rounded-full px-2 py-0.5 font-semibold capitalize text-white" style={{ backgroundColor: getEmotion(e.mood).hex }}>
                            {e.mood}
                          </span>
                        )}
                      </div>
                      {e.characters.length > 0 && (
                        <div className="flex gap-2">
                          {e.characters.map((c) => (
                            <Link key={c.id} href={`/character/${c.id}`} className="block w-16 shrink-0 bg-white p-1 shadow-[0_3px_8px_rgba(74,52,38,0.2)] transition-transform hover:scale-105">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={c.imageUrl} alt={c.name} className="aspect-square w-full object-cover" />
                            </Link>
                          ))}
                        </div>
                      )}
                      <p className="line-clamp-4 whitespace-pre-line text-sm text-cozy-cocoa [font-family:var(--font-itim)]">{e.content}</p>
                    </div>
                  ))}
                  <Link href="/collection" className={`${btnPrimary} h-11 w-full text-sm`}>
                    Open my journal
                  </Link>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center">
                  <p className="text-sm text-cozy-mocha [font-family:var(--font-itim)]">Tap a day with ink dots to look back at it.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </PaperSheet>
    </div>
  );
}
