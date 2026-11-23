"use client";

import { useState } from "react";
import { DiaryChat } from "./diary-chat";
import { DiaryForm } from "./diary-form";
import { MessageCircle, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiaryTabsProps {
  remainingToday: number;
  lang: "th" | "en";
}

export function DiaryTabs({ remainingToday, lang }: DiaryTabsProps) {
  const [mode, setMode] = useState<"chat" | "write">("chat");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {lang === "th" ? "เขียนไดอารี่" : "Write your diary"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === "th" ? "JaiD พร้อมรับฟังคุณแล้ว" : "JaiD is ready to listen"}
          </p>
        </div>
        <div className="flex rounded-lg border bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              mode === "chat"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {lang === "th" ? "แชท" : "Chat"}
          </button>
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              mode === "write"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PenLine className="w-3.5 h-3.5" />
            {lang === "th" ? "เขียนเอง" : "Free Write"}
          </button>
        </div>
      </div>

      {/* Content */}
      {mode === "chat" ? (
        <DiaryChat remainingToday={remainingToday} lang={lang} />
      ) : (
        <DiaryForm remainingToday={remainingToday} lang={lang} />
      )}
    </div>
  );
}
