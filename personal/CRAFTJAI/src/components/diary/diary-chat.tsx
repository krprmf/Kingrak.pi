"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { btnPrimary, field } from "@/components/game/ui";
import { toast } from "sonner";
import { Loader2, SendHorizonal, SkipForward, Sparkles } from "lucide-react";

interface Message {
  role: "jaid" | "user";
  text: string;
}

const QUESTIONS = [
  {
    th: "สวัสดี! วันนี้เป็นยังไงบ้าง? เล่าให้ใจดีฟังหน่อยสิ 😊",
    en: "Hi! How was your day? Tell โกส about it.",
  },
  {
    th: "เล่าเพิ่มอีกหน่อยสิ มีอะไรที่ประทับใจหรือกังวลไหม?",
    en: "Tell me more! Anything that stood out or bothered you?",
  },
  {
    th: "ขอบคุณที่เล่าให้ฟังนะ! แล้วตอนนี้รู้สึกยังไงบ้าง?",
    en: "Thanks for sharing! How are you feeling right now?",
  },
];

interface DiaryChatProps {
  remainingToday: number;
  dailyLimit: number;
  lang: "th" | "en";
}

export function DiaryChat({ remainingToday, dailyLimit, lang }: DiaryChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "jaid", text: QUESTIONS[0][lang] },
  ]);
  const [input, setInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [questionIndex]);

  const userMessages = messages.filter((m) => m.role === "user");
  const canSubmit = userMessages.length >= 1;

  const handleSend = () => {
    if (!input.trim() || done) return;

    const userMsg: Message = { role: "user", text: input.trim() };
    const newMessages = [...messages, userMsg];
    setInput("");

    const nextQ = questionIndex + 1;

    if (nextQ < QUESTIONS.length) {
      // Ask next question
      const jaidMsg: Message = { role: "jaid", text: QUESTIONS[nextQ][lang] };
      setMessages([...newMessages, jaidMsg]);
      setQuestionIndex(nextQ);
    } else {
      // All questions asked
      const finalMsg: Message = {
        role: "jaid",
        text: lang === "th"
          ? "ขอบคุณที่เล่าให้ฟังนะ! พร้อมสร้างตัวละครจากอารมณ์วันนี้แล้ว ✨"
          : "Thanks for sharing! Ready to create your character.",
      };
      setMessages([...newMessages, finalMsg]);
      setDone(true);
    }
  };

  const handleSkip = () => {
    if (!canSubmit) {
      toast.error(lang === "th" ? "เล่าอย่างน้อย 1 ข้อความก่อนนะ" : "Please share at least 1 message first");
      return;
    }
    const finalMsg: Message = {
      role: "jaid",
      text: lang === "th"
        ? "โอเค! พร้อมสร้างตัวละครเลย ✨"
        : "Okay! Let's create your character.",
    };
    setMessages((prev) => [...prev, finalMsg]);
    setDone(true);
  };

  const handleCreateCharacter = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);

    // Combine all user messages into diary content
    const content = userMessages.map((m) => m.text).join("\n\n");

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat area */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "jaid" && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-cozy-paper">
                  <Image src="/images/jaid-ghost.webp" alt="โกส" width={368} height={512} className="h-8 w-auto" />
                </span>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-br-md bg-cozy-clay text-white shadow-[0_3px_0_rgba(142,76,51,0.45)]"
                    : "rounded-bl-md border-2 border-cozy-paper bg-white text-cozy-cocoa"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 space-y-2.5 border-t-2 border-cozy-paper bg-cozy-paper/30 p-3">
        {!done ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang === "th" ? "พิมพ์ข้อความ..." : "Tell โกส..."}
              disabled={loading}
              className={`${field} h-12 flex-1`}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className={`${btnPrimary} h-12 w-12 shrink-0`}
            >
              <SendHorizonal className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCreateCharacter}
            disabled={loading || remainingToday <= 0}
            className={`${btnPrimary} h-12 w-full text-lg`}
          >
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
        )}

        <div className="flex items-center justify-between px-1 text-xs text-cozy-mocha">
          {!done && canSubmit ? (
            <button
              type="button"
              onClick={handleSkip}
              className="flex cursor-pointer items-center gap-1 font-semibold transition-colors hover:text-cozy-clay"
            >
              <SkipForward className="h-3.5 w-3.5" />
              {lang === "th" ? "ข้ามไปสร้างเลย" : "That's enough, create now"}
            </button>
          ) : (
            <span />
          )}
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
