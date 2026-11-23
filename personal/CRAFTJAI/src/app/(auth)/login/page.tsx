"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EMOTION_MAP } from "@/lib/constants/emotions";
import { toast } from "sonner";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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
        toast.success("Account created! You can now sign in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/diary");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-amber-50">
      <div className="w-full max-w-md px-6 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-violet-700 mb-2">
          CRAFTJAI
        </h1>
        <p className="text-muted-foreground mb-8">
          Write your story. Collect your emotions.
        </p>

        <div className="flex justify-center gap-2 mb-10 text-2xl">
          {Object.values(EMOTION_MAP).map((e) => (
            <span
              key={e.animal}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: `${e.hex}20` }}
              title={e.name}
            >
              {e.emoji}
            </span>
          ))}
        </div>

        <div className="space-y-4 mb-8 text-left">
          {[
            { icon: "📝", title: "Write your diary", desc: "Share how your day went" },
            { icon: "🎨", title: "AI creates a character", desc: "Unique mood character from your emotions" },
            { icon: "🏆", title: "Collect all 8 moods", desc: "Like Pokemon, but for your feelings" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-xl border bg-white/60 p-4"
            >
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-11"
          />
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-base h-12 cursor-pointer"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-violet-600 hover:underline cursor-pointer mb-6 block mx-auto"
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-br from-violet-50 via-white to-amber-50 px-2 text-muted-foreground">
              or
            </span>
          </div>
        </div>

        {/* Google login */}
        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          size="lg"
          className="w-full text-base h-12 cursor-pointer"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>

        <p className="mt-8 text-xs text-muted-foreground">
          IEEE ECTI-CON 2025 &middot; Chulalongkorn University
        </p>
      </div>
    </div>
  );
}
