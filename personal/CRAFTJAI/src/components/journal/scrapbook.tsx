// Scrapbook / junk-journal pieces for the journal pages: textured paper, washi tape,
// a ticket-stub date, ink mood stamps, taped photos, torn notebook scraps, a clipped
// sticky note and small doodles. Pure CSS + inline SVG, no images needed.

import Link from "next/link";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Paperclip } from "lucide-react";

/** Small deterministic "random" in [0, 1) from a string + index, so a page always
 *  looks the same (same tilts, same tape) every time you open it. */
export function seeded(seed: string, i = 0): number {
  let h = 2166136261 ^ i;
  for (let c = 0; c < seed.length; c++) h = Math.imul(h ^ seed.charCodeAt(c), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}
const tilt = (seed: string, i: number, max = 4) => (seeded(seed, i) * 2 - 1) * max;

// Fine paper grain: an SVG noise filter turned into a background image.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0 0.15 0 0 0 0.09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** One sheet of aged, grainy paper with a faint dot grid. `side` adds the spine shadow. */
export function PaperSheet({ children, side, className = "" }: { children: ReactNode; side?: "left" | "right"; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[#f5ecdc] ${className}`}
      style={{
        backgroundImage: `${GRAIN}, radial-gradient(circle, rgba(122,90,70,0.16) 1px, transparent 1.2px), radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(122,90,70,0.14) 100%)`,
        backgroundSize: "160px 160px, 18px 18px, 100% 100%",
      }}
    >
      {side && (
        <span
          className={`pointer-events-none absolute inset-y-0 hidden w-8 lg:block ${
            side === "left" ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"
          } from-[#4a3426]/18 to-transparent`}
        />
      )}
      {children}
    </div>
  );
}

const TAPE_STYLES = [
  // stripes, dots, grid in the cozy palette, semi-transparent like real washi
  "repeating-linear-gradient(45deg, rgba(227,178,97,0.75) 0 6px, rgba(255,246,234,0.75) 6px 12px)",
  "radial-gradient(circle, rgba(184,105,75,0.55) 1.6px, transparent 2px) 0 0/9px 9px, rgba(239,220,196,0.85)",
  "repeating-linear-gradient(90deg, rgba(143,168,138,0.7) 0 5px, rgba(143,168,138,0.45) 5px 10px)",
  "linear-gradient(rgba(255,255,255,0.35), rgba(255,255,255,0.35)), repeating-linear-gradient(0deg, rgba(122,90,70,0.25) 0 1px, transparent 1px 7px), rgba(227,178,97,0.6)",
];

/** A strip of washi tape with ragged ends. */
export function WashiTape({ seed, i = 0, className = "", style }: { seed: string; i?: number; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute block h-5 w-20 shadow-[0_1px_2px_rgba(74,52,38,0.15)] ${className}`}
      style={{
        background: TAPE_STYLES[Math.floor(seeded(seed, i + 7) * TAPE_STYLES.length)],
        clipPath: "polygon(2% 0, 98% 4%, 100% 30%, 97% 55%, 100% 82%, 97% 100%, 3% 96%, 0 70%, 3% 45%, 0 18%)",
        transform: `rotate(${tilt(seed, i + 3, 12)}deg)`,
        ...style,
      }}
    />
  );
}

/** Ticket stub with the day and date. */
export function DateTicket({ weekday, date, seed }: { weekday: string; date: string; seed: string }) {
  return (
    <div
      className="relative inline-block bg-[#e9d3b0] px-5 py-2 text-cozy-cocoa shadow-[0_3px_6px_rgba(74,52,38,0.18)]"
      style={{
        transform: `rotate(${tilt(seed, 1, 3)}deg)`,
        // perforated left/right edges
        WebkitMask:
          "radial-gradient(circle at 0 50%, transparent 5px, #000 5.5px) left/51% 12px repeat-y, radial-gradient(circle at 100% 50%, transparent 5px, #000 5.5px) right/51% 12px repeat-y",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cozy-mocha">today&apos;s page</p>
      <p className="text-2xl font-bold uppercase leading-none tracking-wide">{weekday}</p>
      <p className="mt-0.5 border-t border-dashed border-cozy-mocha/40 pt-0.5 text-xs">{date}</p>
    </div>
  );
}

/** Round ink stamp, like a postmark, in the mood's color. */
export function MoodStamp({ mood, color, seed, i = 0 }: { mood: string; color: string; seed: string; i?: number }) {
  return (
    <div
      className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-double text-center mix-blend-multiply"
      style={{ borderColor: color, color, transform: `rotate(${tilt(seed, i + 11, 18)}deg)`, opacity: 0.85 }}
    >
      <span className="text-[8px] font-semibold uppercase tracking-widest">felt</span>
      <span className="text-[11px] font-bold uppercase leading-tight">{mood}</span>
      <span className="text-[8px] uppercase tracking-widest">today</span>
    </div>
  );
}

/** A character picture taped onto the page, with a kraft label. */
export function TapedPhoto({ href, src, name, seed, i, size = "w-[60%]" }: { href: string; src: string; name: string; seed: string; i: number; size?: string }) {
  return (
    <Link
      href={href}
      className={`relative block ${size} bg-white p-1.5 pb-2 shadow-[0_6px_14px_rgba(74,52,38,0.25)] transition-transform hover:z-10 hover:scale-105`}
      style={{ transform: `rotate(${tilt(seed, i + 21, 6)}deg)` }}
    >
      <WashiTape seed={seed} i={i} className="-top-2.5 left-1/2 -ml-10" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className="aspect-square w-full object-cover sepia-[0.08]" />
      <span className="absolute -bottom-3 right-2 bg-[#d9bf98] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-cozy-cocoa shadow-sm">
        {name}
      </span>
    </Link>
  );
}

/** Torn piece of lined notebook paper holding what you wrote. */
export function TornNote({ children, time, seed, i }: { children: ReactNode; time: string; seed: string; i: number }) {
  return (
    <div className="relative" style={{ transform: `rotate(${tilt(seed, i + 31, 1.6)}deg)` }}>
      <div
        className="bg-[#fffdf7] px-5 pb-6 pt-7 text-[15px] text-cozy-cocoa shadow-[0_3px_8px_rgba(74,52,38,0.14)] [font-family:var(--font-itim)] [line-height:1.75rem]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 22px, rgba(216,90,90,0.35) 22px, rgba(216,90,90,0.35) 23.5px, transparent 23.5px), repeating-linear-gradient(to bottom, transparent 0, transparent calc(1.75rem - 1px), rgba(122,150,190,0.3) calc(1.75rem - 1px), rgba(122,150,190,0.3) 1.75rem)",
          backgroundPosition: "0 0, 0 1.1rem",
          // torn top and bottom edges
          clipPath:
            "polygon(0 3%, 6% 0, 13% 2.5%, 21% 0.5%, 30% 3%, 38% 0, 47% 2%, 56% 0.5%, 64% 3%, 73% 0, 82% 2.5%, 90% 0.5%, 100% 2.5%, 100% 97%, 93% 100%, 85% 97.5%, 76% 99.5%, 67% 97%, 58% 100%, 49% 98%, 40% 100%, 31% 97.5%, 22% 99.5%, 13% 97%, 5% 100%, 0 97.5%)",
        }}
      >
        <span className="absolute left-7 top-2 text-[11px] font-semibold uppercase tracking-wider text-cozy-mocha [font-family:var(--font-fredoka)]">
          {time}
        </span>
        <p className="whitespace-pre-line pl-3">{children}</p>
      </div>
    </div>
  );
}

/** Honey sticky note with a paperclip: what the ghost said. */
export function GhostNote({ text, seed, i }: { text: string; seed: string; i: number }) {
  return (
    <div
      className="relative ml-auto w-[85%] bg-[#f6e3a6] p-3 pt-4 text-sm text-cozy-cocoa shadow-[0_4px_10px_rgba(74,52,38,0.2)]"
      style={{ transform: `rotate(${tilt(seed, i + 41, 3)}deg)` }}
    >
      <Paperclip className="absolute -top-3 left-4 h-7 w-7 -rotate-12 text-cozy-mocha/70" strokeWidth={1.6} />
      <div className="flex items-start gap-2">
        <Image src="/images/jaid-ghost.webp" alt="" width={368} height={512} className="h-9 w-auto shrink-0" />
        <p>
          <span className="font-semibold text-cozy-mocha">โกส: </span>
          {text}
        </p>
      </div>
    </div>
  );
}

/** Little hand-drawn doodles (sprig, star, heart) in the mood's color. */
export function Doodle({ kind, color, className = "" }: { kind: "sprig" | "star" | "heart"; color: string; className?: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden viewBox="0 0 40 60" className={`pointer-events-none absolute opacity-70 ${className}`}>
      {kind === "sprig" && (
        <g {...common}>
          <path d="M20 58 C 19 40, 22 25, 18 4" />
          <path d="M19 44 C 12 41, 9 36, 8 31 C 14 32, 18 36, 19 44" />
          <path d="M20 34 C 27 31, 30 26, 31 21 C 25 22, 21 27, 20 34" />
          <path d="M19 22 C 13 19, 11 14, 11 10 C 16 12, 19 16, 19 22" />
        </g>
      )}
      {kind === "star" && <path {...common} d="M20 14 L23 24 L33 24 L25 30 L28 40 L20 34 L12 40 L15 30 L7 24 L17 24 Z" />}
      {kind === "heart" && <path {...common} d="M20 44 C 6 34, 6 22, 13 19 C 17 17, 20 21, 20 24 C 20 21, 23 17, 27 19 C 34 22, 34 34, 20 44 Z" />}
    </svg>
  );
}
