import Link from "next/link";
import type { ReactNode } from "react";
import { House } from "lucide-react";
import { panel } from "./ui";

// Full-screen game scene: the same warm sky + drifting clouds as the room,
// a HUD bar (back to the room, title, optional right slot) and the content.
// Use it for every page inside the (game) route group.

interface GameSceneProps {
  title: string;
  subtitle?: string;
  /** Small HUD item on the right (e.g. "3 left today"). */
  right?: ReactNode;
  /** Show the "back to room" button (default true). */
  backToRoom?: boolean;
  children: ReactNode;
}

export function SkyBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#fff7ee_0%,#fde8d7_45%,#f3cdb8_100%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="cj-cloud absolute left-[6%] top-[18%] h-24 w-56 rounded-full bg-white/60 blur-2xl" />
        <span className="cj-cloud absolute right-[8%] top-[60%] h-28 w-72 rounded-full bg-white/50 blur-2xl [animation-delay:-12s]" />
        <span className="cj-cloud absolute left-[30%] bottom-[6%] h-20 w-64 rounded-full bg-white/40 blur-2xl [animation-delay:-24s]" />
      </div>
    </>
  );
}

export function GameScene({ title, subtitle, right, backToRoom = true, children }: GameSceneProps) {
  return (
    // overflow-clip (not hidden): focus/scrollIntoView cannot slide the scene sideways
    <div className="relative flex h-dvh w-full flex-col overflow-clip">
      <SkyBackground />

      {/* HUD bar */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-3 pt-3 sm:px-5 sm:pt-5">
        {backToRoom ? (
          <Link
            href="/home"
            className={`${panel} flex h-11 items-center gap-1.5 px-3 text-sm font-semibold text-cozy-cocoa transition-transform hover:scale-105 active:translate-y-0.5`}
          >
            <House className="h-4.5 w-4.5 text-cozy-clay" />
            Room
          </Link>
        ) : (
          <span />
        )}
        <div className="min-w-0 text-center">
          <h1 className="truncate text-xl font-bold text-cozy-cocoa sm:text-2xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-cozy-mocha sm:text-sm">{subtitle}</p>}
        </div>
        <div className="flex min-w-[4.5rem] justify-end">{right}</div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex min-h-0 flex-1 justify-center px-3 pb-3 pt-3 sm:px-5 sm:pb-5">{children}</main>
    </div>
  );
}
