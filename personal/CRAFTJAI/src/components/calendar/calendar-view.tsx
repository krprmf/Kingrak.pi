"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EMOTION_MAP, type EmotionKey } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import { Flame, X } from "lucide-react";
import Link from "next/link";

interface Entry {
  id: string;
  content: string;
  primary_mood: string;
  mascot_response: string | null;
  created_at: string;
}

interface Character {
  id: string;
  diary_entry_id: string;
  mood: string;
  animal_name: string;
  image_url: string;
  rarity: string;
  power_level: number;
  created_at: string;
}

interface CalendarViewProps {
  streak: { current_streak: number; longest_streak: number; total_entries: number } | null;
  entries: Entry[];
  characters: Character[];
}

export function CalendarView({ streak, entries, characters }: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  const monthName = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group entries by day
  const entriesByDay: Record<number, Entry[]> = {};
  entries.forEach((e) => {
    const day = new Date(e.created_at).getDate();
    if (!entriesByDay[day]) entriesByDay[day] = [];
    entriesByDay[day].push(e);
  });

  // Map characters by diary_entry_id
  const charsByEntry: Record<string, Character[]> = {};
  characters.forEach((c) => {
    if (!charsByEntry[c.diary_entry_id]) charsByEntry[c.diary_entry_id] = [];
    charsByEntry[c.diary_entry_id].push(c);
  });

  // Mood distribution
  const moodDist: Record<string, number> = {};
  entries.forEach((e) => {
    moodDist[e.primary_mood] = (moodDist[e.primary_mood] || 0) + 1;
  });

  const selectedEntries = selectedDay ? entriesByDay[selectedDay] ?? [] : [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Journal Calendar</h1>

      {/* Streak stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-orange-500 flex items-center justify-center gap-1">
            <Flame className="w-6 h-6" />
            {streak?.current_streak ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Current Streak</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-violet-500">{streak?.longest_streak ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Best Streak</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{streak?.total_entries ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Entries</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar grid */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{monthName}</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {dayHeaders.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">
                {d}
              </div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEntries = entriesByDay[day];
              const isToday = day === now.getDate();
              const isSelected = day === selectedDay;
              const primaryMood = dayEntries?.[0]?.primary_mood as EmotionKey | undefined;
              const emotion = primaryMood ? EMOTION_MAP[primaryMood] : null;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(dayEntries ? day : null)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all cursor-pointer ${
                    isToday ? "ring-2 ring-violet-400" : ""
                  } ${isSelected ? "ring-2 ring-violet-600 shadow-md scale-105" : ""} ${
                    dayEntries ? "font-medium hover:scale-105" : "text-muted-foreground"
                  }`}
                  style={
                    dayEntries
                      ? { backgroundColor: `${emotion?.hex}${isSelected ? "30" : "15"}`, color: emotion?.hex }
                      : {}
                  }
                  disabled={!dayEntries}
                >
                  <span className="text-xs">{day}</span>
                  {dayEntries && <span className="text-sm">{emotion?.emoji}</span>}
                  {dayEntries && dayEntries.length > 1 && (
                    <span className="text-[10px] opacity-60">x{dayEntries.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="rounded-xl border bg-card p-4 min-h-[300px]">
          <AnimatePresence mode="wait">
            {selectedDay && selectedEntries.length > 0 ? (
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {monthName.split(" ")[0]} {selectedDay}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedEntries.map((entry) => {
                  const emotion = EMOTION_MAP[entry.primary_mood as EmotionKey];
                  const entryChars = charsByEntry[entry.id] ?? [];
                  const time = new Date(entry.created_at).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={entry.id} className="space-y-3 border-b pb-4 last:border-0">
                      {/* Time + mood */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{time}</span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: `${emotion?.hex}20`, color: emotion?.hex }}
                        >
                          {emotion?.emoji} {entry.primary_mood}
                        </span>
                      </div>

                      {/* Diary content */}
                      <p className="text-sm leading-relaxed line-clamp-3">{entry.content}</p>

                      {/* Characters from this entry */}
                      {entryChars.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {entryChars.map((char) => {
                            const rarity = RARITY_CONFIG[char.rarity as RarityType];
                            return (
                              <Link
                                key={char.id}
                                href={`/character/${char.id}`}
                                className="shrink-0 rounded-lg overflow-hidden border-2 hover:scale-105 transition-transform"
                                style={{ borderColor: rarity.color }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={char.image_url}
                                  alt={char.animal_name}
                                  className="w-16 h-16 object-cover"
                                />
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Mascot response */}
                      {entry.mascot_response && (
                        <div className="rounded-lg bg-violet-50 p-2">
                          <p className="text-xs text-violet-500 font-medium">🐾 JaiD:</p>
                          <p className="text-xs mt-0.5">{entry.mascot_response}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm text-muted-foreground">
                  Click a day to see your diary history
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mood distribution */}
      {entries.length > 0 && (
        <div className="rounded-xl border bg-card p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Mood Distribution</h2>
          <div className="space-y-2">
            {Object.entries(moodDist)
              .sort((a, b) => b[1] - a[1])
              .map(([mood, count]) => {
                const emotion = EMOTION_MAP[mood as EmotionKey];
                const pct = Math.round((count / entries.length) * 100);
                return (
                  <div key={mood} className="flex items-center gap-3">
                    <span className="text-sm w-28 capitalize">
                      {emotion?.emoji} {mood}
                    </span>
                    <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: emotion?.hex }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
