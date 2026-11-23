"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EMOTION_MAP, type EmotionKey } from "@/lib/constants/emotions";

interface JaiDProps {
  lastResponse?: string | null;
  lastMood?: EmotionKey | null;
}

export function JaiD({ lastResponse, lastMood }: JaiDProps) {
  const [showBubble, setShowBubble] = useState(false);

  const defaultMessage = "เขียนไดอารี่วันนี้ยัง? มาเล่าให้ใจดีฟังสิ~";

  const moodColor = lastMood ? EMOTION_MAP[lastMood].hex : "#b0b0b0";
  const moodColorLight = lastMood ? `${EMOTION_MAP[lastMood].hex}25` : "#e5e7eb";

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-8">
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-[76px] right-0 w-64 rounded-2xl bg-white/95 backdrop-blur-sm border shadow-xl p-4 mb-2"
            style={{ borderColor: moodColorLight }}
          >
            <p className="text-xs font-medium mb-1.5" style={{ color: moodColor }}>
              JaiD (ใจดี)
            </p>
            <p className="text-sm leading-relaxed">
              {lastResponse || defaultMessage}
            </p>
            <div
              className="absolute -bottom-2 right-8 w-4 h-4 bg-white/95 border-b border-r rotate-45"
              style={{ borderColor: moodColorLight }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* JaiD: Ghibli-style heart spirit */}
      <motion.button
        onClick={() => setShowBubble(!showBubble)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        className="relative w-[68px] h-[68px] cursor-pointer outline-none"
        title="JaiD (ใจดี)"
      >
        {/* Soft glow */}
        <motion.div
          className="absolute inset-[-8px] rounded-full blur-2xl"
          style={{ backgroundColor: moodColor, opacity: 0.2 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />

        {/* Floating body */}
        <motion.div
          className="relative w-full h-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 68 68" fill="none" className="w-full h-full drop-shadow-lg">
            {/* Soft round heart body — Ghibli style, very round and puffy */}
            <path
              d="M34 58C34 58 6 42 6 22C6 10 14 4 24 4C29 4 32.5 7 34 11C35.5 7 39 4 44 4C54 4 62 10 62 22C62 42 34 58 34 58Z"
              fill={moodColor}
              fillOpacity="0.85"
            />
            {/* Inner soft gradient overlay */}
            <path
              d="M34 58C34 58 6 42 6 22C6 10 14 4 24 4C29 4 32.5 7 34 11C35.5 7 39 4 44 4C54 4 62 10 62 22C62 42 34 58 34 58Z"
              fill="url(#ghibliGrad)"
            />

            {/* Big soft highlight — Ghibli shiny cheek */}
            <ellipse
              cx="20" cy="18" rx="8" ry="10"
              fill="white" fillOpacity="0.3"
              transform="rotate(-10 20 18)"
            />
            <ellipse
              cx="48" cy="18" rx="5" ry="7"
              fill="white" fillOpacity="0.15"
              transform="rotate(10 48 18)"
            />

            {/* === Ghibli Eyes === */}
            {/* Left eye white */}
            <ellipse cx="24" cy="26" rx="5.5" ry="6" fill="white" />
            {/* Left eye iris */}
            <ellipse cx="25.5" cy="27" rx="3.5" ry="4" fill="#1a1a2e" />
            {/* Left eye pupil highlight big */}
            <circle cx="27" cy="25" r="1.5" fill="white" />
            {/* Left eye pupil highlight small */}
            <circle cx="24" cy="29" r="0.8" fill="white" fillOpacity="0.6" />

            {/* Right eye white */}
            <ellipse cx="44" cy="26" rx="5.5" ry="6" fill="white" />
            {/* Right eye iris */}
            <ellipse cx="42.5" cy="27" rx="3.5" ry="4" fill="#1a1a2e" />
            {/* Right eye pupil highlight big */}
            <circle cx="44" cy="25" r="1.5" fill="white" />
            {/* Right eye pupil highlight small */}
            <circle cx="41" cy="29" r="0.8" fill="white" fillOpacity="0.6" />

            {/* Gentle Ghibli smile — soft curved line */}
            <path
              d="M28 37 Q34 43 40 37"
              stroke="#1a1a2e"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />

            {/* Rosy cheeks — Ghibli signature */}
            <ellipse cx="17" cy="34" rx="4.5" ry="3" fill={moodColor} fillOpacity="0.35" />
            <ellipse cx="51" cy="34" rx="4.5" ry="3" fill={moodColor} fillOpacity="0.35" />

            {/* Tiny arms reaching out — Ghibli cute */}
            <path
              d="M8 30 Q4 28 3 32 Q2 36 6 34"
              stroke={moodColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.7"
            />
            <path
              d="M60 30 Q64 28 65 32 Q66 36 62 34"
              stroke={moodColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.7"
            />

            {/* Gradient defs */}
            <defs>
              <radialGradient id="ghibliGrad" cx="0.5" cy="0.3" r="0.7">
                <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Floating sparkle dust — Ghibli magical particles */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              backgroundColor: moodColor,
              width: i % 2 === 0 ? "3px" : "2px",
              height: i % 2 === 0 ? "3px" : "2px",
              left: `${20 + i * 15}%`,
              bottom: "20%",
            }}
            animate={{
              y: [0, -25 - i * 8],
              x: [(i - 1.5) * 3, (i - 1.5) * 8],
              opacity: [0, 0.7, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5 + i * 0.3,
              delay: i * 0.6,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.button>
    </div>
  );
}
