"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useDialogue, useTalkOnHold } from "./dialogue";

type Box = { left: number; top: number; width: number; height: number };

interface HotspotProps {
  href: string | null; // null = not available yet
  label: string;
  hint: string; // what it says in the dialogue box
  icon: ReactNode;
  box: Box; // position on the room image, in %
  tag?: "above" | "inside"; // where the name tag sits
  index: number; // staggers the bobbing of the tags
}

// An object in the room. The whole object is clickable, but only its name tag
// lights up; hovering (mouse) or holding (touch) shows the hint in the dialogue box.
export function Hotspot({ href, label, hint, icon, box, tag = "above", index }: HotspotProps) {
  const { line, say } = useDialogue();
  const active = line?.id === label;
  const talk = () =>
    say({
      id: label,
      speaker: label,
      text: hint,
      accent: "#8e4c33",
      portrait: <span className="text-cozy-clay [&_svg]:h-5 [&_svg]:w-5">{icon}</span>,
    });
  const handlers = useTalkOnHold(talk);

  const style = { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` };
  const nearRight = tag === "inside" || box.left + box.width > 85;

  const nameTag = (
    <span
      className={`cj-bob absolute flex items-center gap-1 whitespace-nowrap rounded-full border-2 px-2.5 py-0.5 text-xs font-semibold shadow-[0_3px_0_rgba(74,52,38,0.28)] transition-all duration-200 sm:text-sm ${
        tag === "inside" ? "top-1/3" : "top-0 -translate-y-[120%]"
      } ${nearRight ? "right-0" : "left-1/2 -translate-x-1/2"} ${
        active
          ? "scale-110 border-cozy-clay bg-cozy-clay text-white"
          : "border-cozy-paper bg-cozy-cream text-cozy-cocoa group-hover:scale-110 group-hover:border-cozy-clay group-hover:bg-cozy-clay group-hover:text-white"
      }`}
      style={{ animationDelay: `${index * 0.4}s` }}
    >
      <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
      {label}
      {!href && (
        <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/25 text-white" : "bg-cozy-honey/30 text-cozy-mocha"}`}>
          soon
        </span>
      )}
    </span>
  );

  return href ? (
    <Link href={href} style={style} className="group absolute select-none outline-none" aria-label={`${label}: ${hint}`} {...handlers}>
      {nameTag}
    </Link>
  ) : (
    <span style={style} className="group absolute cursor-not-allowed select-none" aria-label={`${label}: ${hint}`} tabIndex={0} {...handlers}>
      {nameTag}
    </span>
  );
}
