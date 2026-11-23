"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SendHorizonal, SkipForward, Sparkles } from "lucide-react";

interface Message {
  role: "jaid" | "user";
  text: string;
}

const QUESTIONS = [
  {
    th: "สวัสดี! วันนี้เป็นยังไงบ้าง? เล่าให้ใจดีฟังหน่อยสิ 😊",
    en: "Hi! How was your day? Tell JaiD about it 😊",
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
  lang: "th" | "en";
}

export function DiaryChat({ remainingToday, lang }: DiaryChatProps) {
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
          : "Thanks for sharing! Ready to create your character ✨",
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
        : "Okay! Let's create your character ✨",
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
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "jaid" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                    <circle cx="7" cy="8" r="2" fill="currentColor" />
                    <circle cx="12" cy="6" r="2" fill="currentColor" />
                    <circle cx="17" cy="8" r="2" fill="currentColor" />
                    <ellipse cx="12" cy="14" rx="5" ry="4" fill="currentColor" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-md"
                    : "bg-muted rounded-bl-md"
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
      <div className="border-t bg-card pt-4 space-y-3">
        {!done ? (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang === "th" ? "พิมพ์ข้อความ..." : "Type your message..."}
              disabled={loading}
              className="flex-1 h-11"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size="icon"
              className="h-11 w-11 bg-violet-600 hover:bg-violet-700 cursor-pointer shrink-0"
            >
              <SendHorizonal className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleCreateCharacter}
            disabled={loading || remainingToday <= 0}
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
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {!done && canSubmit && (
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1 hover:text-violet-600 cursor-pointer transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              {lang === "th" ? "ข้ามไปสร้างเลย" : "Skip to create"}
            </button>
          )}
          {!done && !canSubmit && <span />}
          <span>
            {lang === "th" ? `เหลือวันนี้: ${remainingToday}/5` : `Remaining: ${remainingToday}/5`}
          </span>
        </div>
      </div>
    </div>
  );
}
