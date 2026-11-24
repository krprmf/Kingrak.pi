"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { EMOTION_MAP } from "@/lib/constants/emotions";
import { gameFontClass } from "@/lib/fonts";
import { toast } from "sonner";
import { Play, Sparkles, ArrowLeft } from "lucide-react";

// Title screen like a life-sim game: menu first ("Continue" / "New game"),
// then the form opens inside the same panel.
type Mode = "menu" | "signin" | "signup";

const btn3d =
  "w-full h-12 cursor-pointer rounded-2xl border-b-[5px] text-lg font-semibold transition-transform active:translate-y-[3px] active:border-b-2 disabled:opacity-60";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("New save created! Continue to enter your room.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/home");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Guest = a real Supabase user with no email (is_anonymous = true).
  // RLS and the profile trigger work the same; progress lives only in this browser
  // until the guest links an email later.
  const handleGuest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { full_name: "Guest" } },
      });
      if (error) throw error;
      router.push("/home");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(/anonymous/i.test(msg) ? "Guest mode is not turned on yet." : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  };

  return (
    <div className={`${gameFontClass} relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10`}>
      {/* World behind the menu: the room, soft-focused like a game title backdrop */}
      <Image
        src="/images/room.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-110 object-cover object-[50%_55%] blur-[2px] cj-slow-pan"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100/30 via-orange-50/10 to-[#4a3426]/35" />

      {/* Floating light motes */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="cj-mote absolute h-2 w-2 rounded-full bg-white/80"
            style={{ left: `${8 + i * 9}%`, top: `${20 + ((i * 37) % 60)}%`, animationDelay: `${i * 0.7}s` }}
          />
        ))}
      </div>

      {/* Game logo */}
      <div className="relative mb-6 text-center cj-bob">
        <h1
          className="text-6xl font-bold tracking-wide text-cozy-clay sm:text-7xl"
          style={{
            WebkitTextStroke: "6px white",
            paintOrder: "stroke fill",
            textShadow: "0 6px 0 rgba(74, 52, 38, 0.35)",
          }}
        >
          CRAFTJAI
        </h1>
        <p className="mx-auto mt-2 inline-block rounded-full bg-white/90 px-4 py-1 text-sm font-semibold text-cozy-cocoa shadow">
          a little life sim for your feelings
        </p>
      </div>

      {/* Menu panel */}
      <div className="relative w-full max-w-sm rounded-[28px] border-4 border-cozy-paper bg-cozy-cream/95 p-5 shadow-[0_10px_0_rgba(74,52,38,0.22),0_20px_40px_rgba(0,0,0,0.25)]">
        {mode === "menu" ? (
          <div className="space-y-3">
            <button type="button" onClick={() => setMode("signin")} className={`${btn3d} border-cozy-clay-dark bg-cozy-clay text-white hover:bg-cozy-clay-light`}>
              <Play className="mr-2 inline h-5 w-5 fill-current align-[-3px]" />
              Continue
            </button>
            <button type="button" onClick={() => setMode("signup")} className={`${btn3d} border-cozy-honey-dark bg-cozy-honey text-cozy-cocoa hover:bg-cozy-honey-light`}>
              <Sparkles className="mr-2 inline h-5 w-5 align-[-3px]" />
              New game
            </button>
            <button type="button" onClick={handleGoogleLogin} className={`${btn3d} border-cozy-paper bg-white text-base text-cozy-cocoa hover:bg-cozy-cream`}>
              <svg className="mr-2 inline h-5 w-5 align-[-4px]" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="w-full cursor-pointer pt-1 text-sm font-semibold text-cozy-cocoa hover:underline disabled:opacity-60"
            >
              {loading ? "Opening your room..." : "Just looking? Continue as guest"}
            </button>
            <p className="text-center text-[11px] leading-tight text-cozy-mocha">
              Guest progress stays on this device only.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="mb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode("menu")}
                className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-cozy-cocoa hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="rounded-full bg-cozy-paper px-3 py-0.5 text-sm font-semibold text-cozy-cocoa">
                {isSignUp ? "New save" : "Load save"}
              </span>
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="h-12 w-full rounded-2xl border-2 border-cozy-paper bg-white px-4 text-base outline-none focus:border-cozy-clay"
            />
            <input
              type="password"
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 w-full rounded-2xl border-2 border-cozy-paper bg-white px-4 text-base outline-none focus:border-cozy-clay"
            />
            <button
              type="submit"
              disabled={loading}
              className={`${btn3d} border-cozy-clay-dark bg-cozy-clay text-white hover:bg-cozy-clay-light`}
            >
              {loading ? "Loading..." : isSignUp ? "Create my room" : "Enter my room"}
            </button>
          </form>
        )}

        {/* The 8 feelings you can meet */}
        <div className="mt-5 flex items-center justify-center gap-1.5" aria-label="8 feelings to meet">
          {Object.values(EMOTION_MAP).map((e) => (
            <span
              key={e.animal}
              className="h-3 w-3 rounded-full ring-2 ring-white"
              style={{ backgroundColor: e.hex }}
              title={e.name}
            />
          ))}
        </div>
      </div>

      <p className="relative mt-6 text-xs font-medium text-white/90 drop-shadow">
        v0.2 &middot; IEEE ECTI-CON 2025 &middot; Chulalongkorn University
      </p>
    </div>
  );
}
