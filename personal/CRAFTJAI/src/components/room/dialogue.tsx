"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode, PointerEvent, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { gameFontClass } from "@/lib/fonts";

// One dialogue box for the whole room, like an RPG text box at the bottom of the screen.
// The ghost and every object in the room "talk" through it, so messages never cover the room.

export type Line = {
  id: string; // who is talking (e.g. "ghost", "Desk")
  speaker: string; // name shown before the text
  text: string;
  portrait: ReactNode; // small picture in the circle on the left
  accent?: string; // color of the name and the portrait ring
};

type DialogueApi = {
  line: Line | null;
  say: (line: Line) => void;
  quiet: (afterMs?: number) => void;
};

const DialogueContext = createContext<DialogueApi | null>(null);

export function useDialogue() {
  const api = useContext(DialogueContext);
  if (!api) throw new Error("useDialogue must be used inside <DialogueProvider>");
  return api;
}

// true only in the browser, so the portal to document.body never runs on the server
const noop = () => () => {};
const useOnClient = () => useSyncExternalStore(noop, () => true, () => false);

export function DialogueProvider({ children }: { children: ReactNode }) {
  const [line, setLine] = useState<Line | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onClient = useOnClient();

  const say = useCallback((next: Line) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setLine(next);
    setVisible(true);
  }, []);

  const quiet = useCallback((afterMs = 0) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), afterMs);
  }, []);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  return (
    <DialogueContext.Provider value={{ line: visible ? line : null, say, quiet }}>
      {children}
      {/* Portal into <body>: the room floats with a CSS transform, and a transformed
          parent would trap `position: fixed` (the box would float with the room). */}
      {onClient &&
        createPortal(
          <div
            className={`${gameFontClass} pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 transition-all duration-300 sm:bottom-28 ${
              visible && line ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            role="status"
            aria-live="polite"
          >
            {line && (
              <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border-2 border-cozy-paper bg-cozy-cream/85 px-3 py-2 text-left text-cozy-cocoa shadow-[0_4px_0_rgba(74,52,38,0.18)] backdrop-blur-md">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/70 ring-2"
                  style={{ ["--tw-ring-color" as string]: `${line.accent ?? "#efdcc4"}` }}
                >
                  {line.portrait}
                </span>
                <p className="text-sm leading-snug">
                  <span className="mr-1 font-semibold" style={{ color: line.accent ?? "#7a5a46" }}>
                    {line.speaker}:
                  </span>
                  {line.text}
                </p>
              </div>
            )}
          </div>,
          document.body
        )}
    </DialogueContext.Provider>
  );
}

const HOLD_MS = 350; // a touch must be held this long before something talks
const LINGER_MS = 2500; // keep the message a moment after the finger lifts

/**
 * Pointer handlers for "hover to talk (mouse) / press and hold to talk (touch)".
 * A tap still works as a normal click; a hold does not trigger the click.
 */
export function useTalkOnHold(onTalk: () => void) {
  const { quiet } = useDialogue();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  const clearHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  useEffect(() => clearHold, []);

  return {
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === "mouse") onTalk();
    },
    onPointerLeave: (e: PointerEvent) => {
      clearHold();
      quiet(e.pointerType === "mouse" ? 300 : LINGER_MS);
    },
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      held.current = false;
      clearHold();
      holdTimer.current = setTimeout(() => {
        held.current = true;
        onTalk();
      }, HOLD_MS);
    },
    onPointerUp: (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      clearHold();
      if (held.current) quiet(LINGER_MS);
    },
    onClick: (e: MouseEvent) => {
      // After a long press, don't also follow the link
      if (held.current) {
        e.preventDefault();
        held.current = false;
      }
    },
    onContextMenu: (e: MouseEvent) => e.preventDefault(), // long press: no browser menu
    onFocus: () => onTalk(), // keyboard users get the message too
    onBlur: () => quiet(300),
  };
}
