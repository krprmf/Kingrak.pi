"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { btnPrimary, chip } from "@/components/game/ui";

const PROMPTS_TH = ["วันนี้ทำอะไร", "รู้สึกยังไงบ้าง", "มีอะไรพิเศษไหม", "อยากเล่าอะไร"];
const PROMPTS_EN = ["What did you do today", "How are you feeling", "Anything special", "What's on your mind"];

interface DiaryFormProps {
  remainingToday: number;
  dailyLimit: number;
  lang: "th" | "en";
}

// Free write: a lined notebook page.
export function DiaryForm({ remainingToday, dailyLimit, lang }: DiaryFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const prompts = lang === "th" ? PROMPTS_TH : PROMPTS_EN;
  const charCount = content.trim().length;
  const canSubmit = content.trim().length >= 5 && remainingToday > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const res = await fetch("/api/analyze-mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      const { entry, moods, mascot_response } = await res.json();
      sessionStorage.setItem("craftjai_reveal", JSON.stringify({ moods, mascot_response }));
      router.push(`/reveal?entryId=${entry.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap gap-2 px-4 pt-4">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setContent((prev) => (prev ? `${prev} ` : "") + p + "? ")}
            className={chip}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Lined paper: a repeating gradient draws one line every 2rem, matching the line height */}
      <div className="min-h-0 flex-1 px-4 py-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={lang === "th" ? "เขียนไดอารี่ของคุณที่นี่..." : "Dear diary, today..."}
          disabled={loading}
          className="h-full w-full resize-none rounded-2xl border-2 border-cozy-paper bg-white px-4 py-1 text-base text-cozy-cocoa outline-none placeholder:text-cozy-mocha/60 focus:border-cozy-clay [background-attachment:local] [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(2rem-1px),#efdcc4_calc(2rem-1px),#efdcc4_2rem)] [line-height:2rem]"
        />
      </div>

      <div className="shrink-0 space-y-2.5 border-t-2 border-cozy-paper bg-cozy-paper/30 p-3">
        <button type="button" onClick={handleSubmit} disabled={!canSubmit} className={`${btnPrimary} h-12 w-full text-lg`}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {lang === "th" ? "กำลังวิเคราะห์..." : "โกส is reading your day..."}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {lang === "th" ? "สร้างตัวละคร" : "Create my character"}
            </>
          )}
        </button>
        <div className="flex items-center justify-between px-1 text-xs text-cozy-mocha">
          <span>
            {charCount} {lang === "th" ? "ตัวอักษร" : "characters"}
          </span>
          <span>
            {lang === "th"
              ? `เหลือวันนี้: ${remainingToday}/${dailyLimit}`
              : `${remainingToday} of ${dailyLimit} left today`}
          </span>
        </div>
      </div>
    </div>
  );
}
