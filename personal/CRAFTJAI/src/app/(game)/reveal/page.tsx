"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { GameScene } from "@/components/game/scene";
import { paperCard, btnPrimary, btnSecondary } from "@/components/game/ui";
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
    "Reading your day...",
    "Mixing the colors of your feelings...",
    "Drawing your little friend...",
    "Adding a bit of personality...",
    "Almost there...",
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

  // The ghost, floating while it works
  const ghost = (
    <div className="cj-ghost mx-auto w-24 sm:w-28">
      <Image src="/images/jaid-ghost.webp" alt="โกส" width={368} height={512} className="h-auto w-full opacity-90" />
    </div>
  );

  if (error) {
    return (
      <GameScene title="Oh no" subtitle="Something went wrong">
        <div className={`${paperCard} m-auto w-full max-w-sm space-y-4 p-6 text-center`}>
          {ghost}
          <p className="text-cozy-cocoa">{error}</p>
          <button type="button" onClick={() => router.push("/diary")} className={`${btnPrimary} h-12 w-full`}>
            Back to the desk
          </button>
        </div>
      </GameScene>
    );
  }

  return (
    <GameScene
      title={phase === "reveal" ? "A new page!" : "Making your page"}
      subtitle={phase === "reveal" ? "Your day became a scene" : "โกส is working on it"}
    >
      <div className="m-auto w-full max-w-2xl overflow-y-auto py-2 text-center">
        <AnimatePresence mode="wait">
          {/* Phase: detected moods */}
          {(phase === "loading" || phase === "moods") && (
            <motion.div
              key="moods"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`${paperCard} mx-auto max-w-md space-y-5 p-6`}
            >
              {ghost}
              <p className="text-cozy-mocha">
                {moods.length > 0
                  ? `I felt ${moods.length} feeling${moods.length > 1 ? "s" : ""} in your day`
                  : "Reading your day..."}
              </p>
              <div className="flex justify-center gap-5">
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
                      {/* A glowing orb in the mood's color */}
                      <span
                        className="mx-auto mb-2 block h-14 w-14 rounded-full ring-4 ring-white"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, #ffffffcc, ${emotion.hex} 60%)`,
                          boxShadow: `0 0 24px ${emotion.hex}88`,
                        }}
                      />
                      <p className="text-sm font-semibold capitalize" style={{ color: emotion.hex }}>
                        {m.primary_mood}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Phase: generating */}
          {phase === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`${paperCard} mx-auto max-w-md space-y-4 p-6`}
            >
              {ghost}
              <p className="text-lg font-semibold text-cozy-cocoa">{LOADING_MESSAGES[msgIndex]}</p>
              <p className="flex items-center justify-center gap-2 text-sm text-cozy-mocha">
                <Loader2 className="h-4 w-4 animate-spin" />
                Drawing {genProgress} of {moods.length}
              </p>
            </motion.div>
          )}

          {/* Phase: reveal */}
          {phase === "reveal" && characters.length > 0 && (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div
                className={`mx-auto grid gap-4 ${
                  characters.length === 1 ? "max-w-xs" : characters.length === 2 ? "max-w-lg grid-cols-2" : "max-w-2xl grid-cols-3"
                }`}
              >
                {characters.map((char, i) => {
                  const emotion = EMOTION_MAP[char.mood];
                  const rarity = RARITY_CONFIG[char.rarity];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      transition={{ delay: i * 0.3, type: "spring", duration: 0.8 }}
                      className="overflow-hidden rounded-[22px] border-4 bg-cozy-cream shadow-[0_6px_0_rgba(74,52,38,0.18)]"
                      style={{ borderColor: emotion?.hex ?? "#efdcc4" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={char.image_url} alt={char.animal_name} className="aspect-square w-full object-cover" />
                      <div className="space-y-1 p-3 text-center">
                        <p className="font-bold text-cozy-cocoa">{char.animal_name}</p>
                        <p className="flex items-center justify-center gap-1.5 text-xs capitalize text-cozy-mocha">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: emotion?.hex }} />
                          {char.mood}
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-0.5">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                            style={{ backgroundColor: rarity.color }}
                          >
                            {rarity.label}
                          </span>
                          <span className="text-xs text-cozy-mocha">PWR {char.power_level}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* What the ghost says, in the same style as the room's dialogue box */}
              {mascotResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: characters.length * 0.3 + 0.3 }}
                  className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 border-cozy-paper bg-cozy-cream/90 px-3 py-2 text-left text-cozy-cocoa shadow-[0_4px_0_rgba(74,52,38,0.18)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/70 ring-2 ring-cozy-paper">
                    <Image src="/images/jaid-ghost.webp" alt="" width={368} height={512} className="h-9 w-auto" />
                  </span>
                  <p className="text-sm leading-snug">
                    <span className="mr-1 font-semibold text-cozy-mocha">โกส:</span>
                    {mascotResponse}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: characters.length * 0.3 + 0.6 }}
                className="flex flex-wrap justify-center gap-3 pt-1"
              >
                <Link href="/collection" className={`${btnSecondary} h-12 px-5`}>
                  See it in my book
                </Link>
                <Link href="/home" className={`${btnPrimary} h-12 px-5`}>
                  Back to my room
                </Link>
              </motion.div>
              <Link href="/diary" className="inline-block text-sm font-semibold text-cozy-mocha hover:text-cozy-clay">
                Write another page
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameScene>
  );
}

export default function RevealPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-[#fde8d7]">
          <Loader2 className="h-8 w-8 animate-spin text-cozy-clay" />
        </div>
      }
    >
      <RevealContent />
    </Suspense>
  );
}
