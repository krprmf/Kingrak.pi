"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { EMOTION_MAP, type EmotionKey } from "@/lib/constants/emotions";
import { btnPrimary, panel } from "@/components/game/ui";

export type JournalPage = {
  id: string;
  createdAt: string;
  content: string;
  mood: EmotionKey | null;
  reply: string | null;
  characters: { id: string; imageUrl: string; name: string; mood: EmotionKey }[];
};

// One journal book. Each diary entry is a page with its pictures taped on;
// it opens on the newest page and you flip back to earlier days
// (arrow buttons, swipe on touch, or the left/right keys).
export function JournalBook({ pages }: { pages: JournalPage[] }) {
  const [index, setIndex] = useState(Math.max(0, pages.length - 1));
  const [dir, setDir] = useState(0); // -1 = flipping back in time, 1 = forward

  const go = useCallback(
    (step: -1 | 1) => {
      setIndex((i) => {
        const next = i + step;
        if (next < 0 || next >= pages.length) return i;
        setDir(step);
        return next;
      });
    },
    [pages.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (pages.length === 0) {
    return (
      <div className="m-auto w-full max-w-sm">
        <Paper>
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-lg font-bold text-cozy-cocoa">Your journal is still empty</p>
            <p className="text-sm text-cozy-mocha">Write your first page at the desk and it will appear here.</p>
            <Link href="/diary" className={`${btnPrimary} h-12 px-5`}>
              <PenLine className="h-5 w-5" /> Go to the desk
            </Link>
          </div>
        </Paper>
      </div>
    );
  }

  const page = pages[index];

  return (
    <div className="m-auto flex h-full w-full max-w-md flex-col gap-3">
      {/* The book: page edges behind, the current page on top, turning around its left edge */}
      <div className="relative min-h-0 flex-1 [perspective:1600px]">
        {/* stacked paper edges, so it reads as a book with more pages */}
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[22px] border-2 border-cozy-paper bg-cozy-cream/70" />
        <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-[22px] border-2 border-cozy-paper bg-cozy-cream/85" />

        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={page.id}
            custom={dir}
            variants={flip}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.4, 0.1, 0.2, 1] }}
            style={{ transformOrigin: "left center" }}
            className="absolute inset-0"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
          >
            <Paper>
              <PageContent page={page} />
            </Paper>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page controls */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className={`${panel} flex h-11 cursor-pointer items-center gap-1 px-3 text-sm font-semibold text-cozy-cocoa transition-opacity disabled:cursor-default disabled:opacity-40`}
        >
          <ChevronLeft className="h-4.5 w-4.5" /> Earlier
        </button>
        <span className="text-sm text-cozy-mocha">
          Page {index + 1} of {pages.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === pages.length - 1}
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

function Paper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[22px] border-2 border-cozy-paper bg-[#fffaf2] shadow-[0_8px_0_rgba(74,52,38,0.14),0_18px_36px_rgba(74,52,38,0.16)] [backface-visibility:hidden]">
      {/* binding shadow on the left edge */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[#4a3426]/10 to-transparent" />
      {children}
    </div>
  );
}

function PageContent({ page }: { page: JournalPage }) {
  const d = new Date(page.createdAt);
  const day = d.toLocaleDateString("en-US", { weekday: "long" });
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const mood = page.mood ? EMOTION_MAP[page.mood] : null;
  // Older ghost replies were written in Thai; only show English ones.
  const reply = page.reply && !/[\u0E00-\u0E7F]{4,}/.test(page.reply) ? page.reply : null;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto px-6 pb-5 pt-5">
      {/* Date header */}
      <div className="flex items-baseline justify-between gap-2 border-b-2 border-dashed border-cozy-paper pb-2">
        <div>
          <p className="text-lg font-bold leading-tight text-cozy-cocoa">{day}</p>
          <p className="text-xs text-cozy-mocha">
            {date} · {time}
          </p>
        </div>
        {mood && (
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize text-white"
            style={{ backgroundColor: mood.hex }}
          >
            {page.mood}
          </span>
        )}
      </div>

      {/* Pictures taped onto the page */}
      {page.characters.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 py-1">
          {page.characters.map((c, i) => (
            <Link
              key={c.id}
              href={`/character/${c.id}`}
              className={`relative block bg-white p-1.5 pb-5 shadow-[0_4px_10px_rgba(74,52,38,0.2)] transition-transform hover:scale-105 ${
                page.characters.length > 1 ? "w-[42%]" : "w-[70%]"
              } ${i % 2 ? "rotate-2" : "-rotate-2"}`}
            >
              {/* washi tape */}
              <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-3 bg-cozy-honey/60" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.imageUrl} alt={c.name} className="aspect-square w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0.5 text-center text-[11px] font-semibold text-cozy-mocha">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* What you wrote, in a handwriting-like font on lined paper */}
      <p className="whitespace-pre-line text-[15px] text-cozy-cocoa [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.75rem-1px),#efdcc4_calc(1.75rem-1px),#efdcc4_1.75rem)] [font-family:var(--font-itim)] [line-height:1.75rem]">
        {page.content}
      </p>

      {/* The ghost's little note */}
      {reply && (
        <div className="mt-auto flex items-start gap-2 rounded-xl bg-cozy-honey/20 p-3 text-sm text-cozy-cocoa">
          <Image src="/images/jaid-ghost.webp" alt="" width={368} height={512} className="h-8 w-auto shrink-0" />
          <p>
            <span className="font-semibold text-cozy-mocha">โกส: </span>
            {reply}
          </p>
        </div>
      )}
    </div>
  );
}
