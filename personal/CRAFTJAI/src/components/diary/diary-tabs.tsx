"use client";

import { useState } from "react";
import { DiaryChat } from "./diary-chat";
import { DiaryForm } from "./diary-form";
import { MessageCircle, PenLine } from "lucide-react";
import { paperCard } from "@/components/game/ui";

interface DiaryTabsProps {
  remainingToday: number;
  dailyLimit: number;
  lang: "th" | "en";
}

// The journal page on the desk: switch between chatting with โกส and free writing.
export function DiaryTabs({ remainingToday, dailyLimit, lang }: DiaryTabsProps) {
  const [mode, setMode] = useState<"chat" | "write">("chat");

  const tabs = [
    { id: "chat" as const, icon: MessageCircle, label: lang === "th" ? "แชท" : "Chat with โกส" },
    { id: "write" as const, icon: PenLine, label: lang === "th" ? "เขียนเอง" : "Free write" },
  ];

  return (
    <div className={`${paperCard} flex h-full w-full max-w-xl flex-col overflow-hidden`}>
      {/* Mode toggle, like two tabs on a notebook */}
      <div className="flex shrink-0 gap-1.5 border-b-2 border-cozy-paper bg-cozy-paper/40 p-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              mode === t.id
                ? "bg-cozy-cream text-cozy-cocoa shadow-[0_3px_0_rgba(74,52,38,0.15)]"
                : "text-cozy-mocha hover:bg-cozy-cream/60"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Page content */}
      <div className="min-h-0 flex-1">
        {mode === "chat" ? (
          <DiaryChat remainingToday={remainingToday} dailyLimit={dailyLimit} lang={lang} />
        ) : (
          <DiaryForm remainingToday={remainingToday} dailyLimit={dailyLimit} lang={lang} />
        )}
      </div>
    </div>
  );
}
