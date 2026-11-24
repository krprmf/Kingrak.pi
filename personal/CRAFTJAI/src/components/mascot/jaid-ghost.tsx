"use client";

import { useEffect } from "react";
import Image from "next/image";
import { EMOTION_MAP, type EmotionKey } from "@/lib/constants/emotions";
import { useDialogue, useTalkOnHold } from "@/components/room/dialogue";

// The room's companion, shown to users as "โกส": a shy, see-through blanket ghost.
// (Component keeps the old JaiD name in code.) Mostly faint, "always here, even when
// you don't see me". Talks through the room's dialogue box on hover / press-and-hold.
// The glow takes the color of your latest mood, a tiny mirror.

export const GHOST_NAME = "โกส";

interface JaiDGhostProps {
  lastResponse?: string | null;
  lastMood?: EmotionKey | null;
  /** Position inside the room stage, in % (same system as the hotspots). */
  box: { left: number; top: number; width: number };
}

const DEFAULT_MESSAGE = `Hi, I'm ${GHOST_NAME}. How was your day? You can tell me anything.`;

// Older replies were generated in Thai; the app is English now.
const THAI_SENTENCE = /[\u0E00-\u0E7F]{4,}/;

export function JaiDGhost({ lastResponse, lastMood, box }: JaiDGhostProps) {
  const { line, say, quiet } = useDialogue();
  const talking = line?.id === "ghost";
  const glow = lastMood ? EMOTION_MAP[lastMood].hex : "#e3b261";
  const message = lastResponse && !THAI_SENTENCE.test(lastResponse) ? lastResponse : DEFAULT_MESSAGE;

  const talk = () =>
    say({
      id: "ghost",
      speaker: GHOST_NAME,
      text: message,
      accent: lastMood ? glow : "#7a5a46",
      portrait: <Image src="/images/jaid-ghost.webp" alt="" width={368} height={512} className="h-9 w-auto" />,
    });
  const handlers = useTalkOnHold(talk);

  // Say hello once when the room opens, then go quiet.
  useEffect(() => {
    const show = setTimeout(talk, 900);
    const hide = setTimeout(() => quiet(), 7000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
    // greet only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute z-10"
      style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%` }}
    >
      {/* Soft shadow on the floor (stays put while the ghost bobs) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[4%] left-1/2 h-[12%] w-[75%] -translate-x-1/2 rounded-full bg-[#4a3426]/25 blur-md"
      />

      {/* The ghost: see-through, glowing in your mood color, gently drifting */}
      <button
        type="button"
        aria-label={`Talk to ${GHOST_NAME}`}
        className="cj-ghost group relative block w-full cursor-pointer touch-none select-none outline-none"
        {...handlers}
      >
        <Image
          src="/images/jaid-ghost.webp"
          alt={`${GHOST_NAME}, a shy little ghost wrapped in a knitted blanket`}
          width={368}
          height={512}
          draggable={false}
          className={`pointer-events-none h-auto w-full transition-opacity duration-500 ${
            talking ? "opacity-95" : "opacity-75 group-hover:opacity-90"
          }`}
          style={{ filter: `drop-shadow(0 0 14px ${glow}aa) drop-shadow(0 0 4px ${glow}66)` }}
        />
      </button>
    </div>
  );
}
