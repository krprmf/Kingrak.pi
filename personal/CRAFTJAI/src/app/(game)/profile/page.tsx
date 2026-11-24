import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Flame, Gem, Layers, Palette, PenLine, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EMOTION_MAP, ALL_EMOTIONS } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import { ACHIEVEMENT_DEFS } from "@/lib/gamification/achievements";
import { GameScene } from "@/components/game/scene";
import { KraftTag, PaperSheet, WashiTape } from "@/components/journal/scrapbook";
import { SignOutButton } from "@/components/auth/sign-out-button";

// Icons instead of the emoji stored in ACHIEVEMENT_DEFS
const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  first_entry: PenLine,
  ten_entries: BookOpen,
  first_week: Flame,
  mood_explorer: Palette,
  rare_collector: Star,
  legendary: Gem,
  three_in_one: Layers,
};

// The player's passport: who you are, the feelings you have met, and your stickers.
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: streak }, { data: characters }, { data: achievements }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("streaks").select("current_streak, longest_streak, total_entries").eq("user_id", user.id).maybeSingle(),
    supabase.from("characters").select("mood, rarity").eq("user_id", user.id),
    supabase.from("achievements").select("achievement_key").eq("user_id", user.id),
  ]);

  const name = profile?.display_name ?? user.email ?? "You";
  const met = new Set(characters?.map((c) => c.mood) ?? []);
  const unlocked = new Set(achievements?.map((a) => a.achievement_key) ?? []);
  const rarityCount: Record<RarityType, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  characters?.forEach((c) => rarityCount[c.rarity as RarityType]++);
  const seed = user.id;
  const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

  return (
    <GameScene title="Passport" subtitle="Your little life in this room">
      <div className="m-auto h-full w-full max-w-4xl overflow-hidden rounded-[16px] shadow-[0_14px_34px_rgba(74,52,38,0.3)] ring-[6px] ring-cozy-clay-dark">
        <PaperSheet className="h-full">
          <div className="h-full space-y-8 overflow-y-auto p-6 lg:grid lg:grid-cols-2 lg:gap-10 lg:space-y-0">
            {/* Left: player card, feelings met */}
            <div className="space-y-8">
              <div className="relative flex items-center gap-4 bg-white/70 p-4 shadow-[0_3px_8px_rgba(74,52,38,0.12)]">
                <WashiTape seed={seed} i={2} className="-top-2.5 right-6" />
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cozy-clay text-2xl font-bold text-white ring-4 ring-cozy-paper">
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-2xl font-bold text-cozy-cocoa">{name}</p>
                  <p className="text-xs leading-snug text-cozy-mocha">
                    {user.is_anonymous ? "Guest: progress is saved on this device only" : user.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <KraftTag label="pages" value={String(streak?.total_entries ?? 0)} seed={seed} i={0} />
                <KraftTag label="streak" value={days(streak?.current_streak ?? 0)} seed={seed} i={1} />
                <KraftTag label="best" value={days(streak?.longest_streak ?? 0)} seed={seed} i={2} />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cozy-mocha">feelings met · {met.size} of 8</p>
                <div className="grid grid-cols-4 gap-3">
                  {ALL_EMOTIONS.map((mood) => {
                    const e = EMOTION_MAP[mood];
                    const found = met.has(mood);
                    return (
                      <div key={mood} className="flex flex-col items-center gap-1 text-center">
                        <span
                          className={`h-12 w-12 rounded-full ${found ? "ring-4 ring-white" : "border-2 border-dashed border-cozy-mocha/30"}`}
                          style={found ? { background: `radial-gradient(circle at 35% 30%, #ffffffcc, ${e.hex} 62%)`, boxShadow: `0 0 14px ${e.hex}66` } : undefined}
                        />
                        <span className={`text-xs font-semibold ${found ? "text-cozy-cocoa" : "text-cozy-mocha/50"}`}>{e.name}</span>
                        <span className={`text-[10px] capitalize ${found ? "text-cozy-mocha" : "text-cozy-mocha/40"}`}>{mood}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: stickers, rarity, sign out */}
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cozy-mocha">
                  stickers · {unlocked.size} of {ACHIEVEMENT_DEFS.length}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ACHIEVEMENT_DEFS.map((a, i) => {
                    const Icon = ACHIEVEMENT_ICONS[a.key] ?? Star;
                    const got = unlocked.has(a.key);
                    return (
                      <div
                        key={a.key}
                        className={`flex items-center gap-2.5 rounded-xl p-2.5 ${got ? "bg-white shadow-[0_3px_8px_rgba(74,52,38,0.15)]" : "border-2 border-dashed border-cozy-mocha/20"}`}
                        style={got ? { transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` } : undefined}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            got ? "bg-cozy-honey text-cozy-cocoa ring-2 ring-white" : "bg-cozy-paper/50 text-cozy-mocha/40"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${got ? "text-cozy-cocoa" : "text-cozy-mocha/60"}`}>{a.label}</p>
                          <p className="text-[11px] leading-snug text-cozy-mocha/80">{a.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cozy-mocha">rarity</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(rarityCount) as [RarityType, number][]).map(([r, n]) => (
                    <span key={r} className="flex items-center gap-1.5 rounded-full border-2 border-cozy-paper bg-white/70 px-3 py-1 text-sm text-cozy-cocoa">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RARITY_CONFIG[r].color }} />
                      {RARITY_CONFIG[r].label} <span className="font-bold">{n}</span>
                    </span>
                  ))}
                </div>
              </div>

              <SignOutButton isGuest={!!user.is_anonymous} />
            </div>
          </div>
        </PaperSheet>
      </div>
    </GameScene>
  );
}
