"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const PROMPTS_TH = ["วันนี้ทำอะไร", "รู้สึกยังไงบ้าง", "มีอะไรพิเศษไหม", "อยากเล่าอะไร"];
const PROMPTS_EN = ["What did you do today", "How are you feeling", "Anything special", "What's on your mind"];

interface DiaryFormProps {
  remainingToday: number;
  lang: "th" | "en";
}

export function DiaryForm({ remainingToday, lang }: DiaryFormProps) {
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setContent((prev) => (prev ? `${prev} ` : "") + p + "? ")}
            className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={lang === "th" ? "เขียนไดอารี่ของคุณที่นี่..." : "Write your diary here..."}
        className="min-h-[240px] resize-none text-base leading-relaxed"
        disabled={loading}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{charCount} {lang === "th" ? "ตัวอักษร" : "characters"}</span>
        <span>{lang === "th" ? `เหลือวันนี้: ${remainingToday}/5` : `Remaining: ${remainingToday}/5`}</span>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        size="lg"
        className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            {lang === "th" ? "กำลังวิเคราะห์..." : "Analyzing..."}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {lang === "th" ? "สร้างตัวละคร" : "Create Character"}
          </span>
        )}
      </Button>
    </div>
  );
}
