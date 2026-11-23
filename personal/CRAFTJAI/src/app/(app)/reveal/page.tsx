"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EMOTION_MAP, type EmotionKey } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import type { MoodItem } from "@/types/emotion";
import { toast } from "sonner";
import { ACHIEVEMENT_DEFS } from "@/lib/gamification/achievements";

interface GeneratedCharacter {
  image_url: string;
  rarity: RarityType;
  power_level: number;
  animal_name: string;
  mood: EmotionKey;
}

function RevealContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const entryId = searchParams.get("entryId");

  const [phase, setPhase] = useState<"loading" | "moods" | "generating" | "reveal">("loading");
  const [moods, setMoods] = useState<MoodItem[]>([]);
  const [mascotResponse, setMascotResponse] = useState("");
  const [characters, setCharacters] = useState<GeneratedCharacter[]>([]);
  const [genProgress, setGenProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load moods: try sessionStorage first, then fallback to API
  useEffect(() => {
    const stored = sessionStorage.getItem("craftjai_reveal");
    if (stored) {
      const data = JSON.parse(stored);
      setMoods(data.moods ?? []);
      setMascotResponse(data.mascot_response ?? "");
      sessionStorage.removeItem("craftjai_reveal");
      setPhase("moods");
      return;
    }

    // Fallback: fetch from DB if sessionStorage is empty
    if (!entryId) {
      setError("No mood data found. Please write a diary entry first.");
      return;
    }

    fetch(`/api/entry?id=${entryId}`)
      .then((res) => res.json())
      .then(({ entry }) => {
        if (!entry) {
          setError("Entry not found.");
          return;
        }
        setMoods([
          {
            primary_mood: entry.primary_mood,
            valence: entry.valence ?? 0,
            arousal: entry.arousal ?? 0.5,
            dominance: entry.dominance ?? 0.5,
            confidence: entry.mood_confidence ?? 0.5,
            segment: entry.content,
            context: {
              location: entry.context_location ?? "unknown",
              activity: entry.context_activity ?? "unknown",
              social_setting: entry.context_social_setting ?? "alone",
            },
            character_prompt: entry.character_prompt ?? "",
          },
        ]);
        setMascotResponse(entry.mascot_response ?? "");
        setPhase("moods");
      })
      .catch(() => {
        setError("Failed to load mood data.");
      });
  }, [entryId]);

  // After showing moods, start generating
  useEffect(() => {
    if (phase !== "moods") return;
    const timer = setTimeout(() => {
      setPhase("generating");
    }, 2500);
    return () => clearTimeout(timer);
  }, [phase]);

  const generateAll = useCallback(async () => {
    if (!entryId || moods.length === 0) return;

    const results: GeneratedCharacter[] = [];
    for (let i = 0; i < moods.length; i++) {
      setGenProgress(i + 1);
      try {
        const res = await fetch("/api/generate-character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, mood: moods[i] }),
        });

        if (!res.ok) {
          const { error } = await res.json();
          console.error(`Character ${i + 1} failed:`, error);
          continue;
        }

        const { character, newAchievements } = await res.json();
        results.push(character);

        // Show achievement toasts
        if (newAchievements?.length) {
          newAchievements.forEach((key: string) => {
            const def = ACHIEVEMENT_DEFS.find((a) => a.key === key);
            if (def) {
              toast.success(`${def.icon} Achievement Unlocked: ${def.label}!`, {
                description: def.desc,
                duration: 5000,
              });
            }
          });
        }
      } catch (err) {
        console.error(`Character ${i + 1} error:`, err);
      }
    }

    if (results.length === 0) {
      setError("Failed to generate characters. Please try again.");
      return;
    }

    setCharacters(results);
    setPhase("reveal");
  }, [entryId, moods]);

  useEffect(() => {
    if (phase === "generating") {
      generateAll();
    }
  }, [phase, generateAll]);

  const LOADING_MESSAGES = [
    "Analyzing your emotions...",
    "Mixing colors...",
    "Drawing your character...",
    "Adding personality...",
    "Final touches...",
  ];

  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    if (phase !== "generating") return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-amber-50">
        <div className="text-center space-y-4 px-6">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.push("/diary")} variant="outline" className="cursor-pointer">
            Back to Diary
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-amber-50 overflow-y-auto">
      <div className="text-center max-w-2xl px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Phase: Show detected moods */}
          {phase === "moods" && moods.length > 0 && (
            <motion.div
              key="moods"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground">Detected {moods.length} emotion{moods.length > 1 ? "s" : ""}</p>
              <div className="flex justify-center gap-4">
                {moods.map((m, i) => {
                  const emotion = EMOTION_MAP[m.primary_mood];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.3 }}
                      className="text-center"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2"
                        style={{ backgroundColor: `${emotion.hex}20` }}
                      >
                        {emotion.emoji}
                      </div>
                      <p className="text-sm font-medium capitalize" style={{ color: emotion.hex }}>
                        {m.primary_mood}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Phase: Generating */}
          {phase === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <p className="text-lg font-medium">{LOADING_MESSAGES[msgIndex]}</p>
              <p className="text-sm text-muted-foreground">
                Generating {genProgress}/{moods.length} characters...
              </p>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-violet-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase: Reveal all characters */}
          {phase === "reveal" && characters.length > 0 && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold">
                {characters.length === 1 ? "Your character!" : `${characters.length} characters from your diary!`}
              </h2>

              <div className={`grid gap-4 ${characters.length === 1 ? "max-w-xs mx-auto" : characters.length === 2 ? "grid-cols-2 max-w-lg mx-auto" : "grid-cols-3 max-w-2xl mx-auto"}`}>
                {characters.map((char, i) => {
                  const emotion = EMOTION_MAP[char.mood];
                  const rarity = RARITY_CONFIG[char.rarity];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      transition={{ delay: i * 0.3, type: "spring", duration: 0.8 }}
                      className="rounded-2xl overflow-hidden border-3 shadow-lg bg-white"
                      style={{ borderColor: rarity.color }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={char.image_url}
                        alt={char.animal_name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-3 text-center">
                        <p className="font-semibold">{char.animal_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {emotion?.emoji} {char.mood}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: rarity.color }}
                          >
                            {rarity.icon} {rarity.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PWR {char.power_level}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Mascot JaiD response */}
              {mascotResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: characters.length * 0.3 + 0.3 }}
                  className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-left max-w-md mx-auto"
                >
                  <p className="text-xs text-violet-500 font-medium mb-1">
                    🐾 JaiD says:
                  </p>
                  <p className="text-sm">{mascotResponse}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: characters.length * 0.3 + 0.6 }}
                className="flex gap-3 justify-center pt-2"
              >
                <Button
                  variant="outline"
                  onClick={() => router.push("/collection")}
                  className="cursor-pointer"
                >
                  View Collection
                </Button>
                <Button
                  onClick={() => router.push("/diary")}
                  className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                >
                  Write Another
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function RevealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="animate-spin text-2xl">⏳</span></div>}>
      <RevealContent />
    </Suspense>
  );
}
