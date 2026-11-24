import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EMOTION_MAP, ALL_EMOTIONS, type EmotionKey } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: characters } = await supabase
    .from("characters")
    .select("mood, rarity")
    .eq("user_id", user.id);

  const discoveredMoods = new Set(characters?.map((c) => c.mood) ?? []);

  // Rarity breakdown
  const rarityCount: Record<RarityType, number> = {
    common: 0, uncommon: 0, rare: 0, legendary: 0,
  };
  characters?.forEach((c) => {
    rarityCount[c.rarity as RarityType]++;
  });

  const { data: achievements } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("user_id", user.id);

  const unlockedKeys = new Set(achievements?.map((a) => a.achievement_key) ?? []);

  const ACHIEVEMENTS = [
    { key: "first_entry", label: "First Entry", desc: "Write your first diary", icon: "✏️" },
    { key: "ten_entries", label: "Dedicated Writer", desc: "Write 10 diary entries", icon: "📚" },
    { key: "first_week", label: "First Week", desc: "Reach a 7-day streak", icon: "🔥" },
    { key: "mood_explorer", label: "Mood Explorer", desc: "Discover all 8 moods", icon: "🌈" },
    { key: "rare_collector", label: "Rare Collector", desc: "Get a Rare character", icon: "⭐" },
    { key: "legendary", label: "Legendary", desc: "Get a Legendary character", icon: "💎" },
    { key: "three_in_one", label: "Emotional Rainbow", desc: "Get 3 characters from one diary", icon: "🌊" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-violet-100 text-violet-700 text-xl">
            {(profile?.display_name ?? "U").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">
            {profile?.display_name ?? user.email}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.is_anonymous ? "Guest: progress is saved on this device only" : user.email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{streak?.total_entries ?? 0}</p>
          <p className="text-xs text-muted-foreground">Entries</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">
            {streak?.current_streak ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Streak</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-violet-500">
            {streak?.longest_streak ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Best</p>
        </div>
      </div>

      {/* Mood Discovery */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-3">
          Mood Discovery {discoveredMoods.size}/8
        </h2>
        <div className="grid grid-cols-8 gap-2">
          {ALL_EMOTIONS.map((mood) => {
            const emotion = EMOTION_MAP[mood];
            const found = discoveredMoods.has(mood);
            return (
              <div
                key={mood}
                className={`aspect-square rounded-lg flex items-center justify-center text-xl ${
                  found ? "" : "opacity-20 grayscale"
                }`}
                style={found ? { backgroundColor: `${emotion.hex}20` } : {}}
                title={`${emotion.name} - ${mood}`}
              >
                {emotion.emoji}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rarity breakdown */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-3">Rarity Breakdown</h2>
        <div className="space-y-2">
          {(Object.entries(rarityCount) as [RarityType, number][]).map(
            ([rarity, count]) => (
              <div key={rarity} className="flex items-center gap-3">
                <span
                  className="text-sm w-24 font-medium"
                  style={{ color: RARITY_CONFIG[rarity].color }}
                >
                  {RARITY_CONFIG[rarity].icon} {RARITY_CONFIG[rarity].label}
                </span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (count / Math.max(characters?.length ?? 1, 1)) * 100)}%`,
                      backgroundColor: RARITY_CONFIG[rarity].color,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">
                  {count}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-3">Achievements</h2>
        <div className="space-y-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedKeys.has(a.key);
            return (
              <div
                key={a.key}
                className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                  unlocked ? "bg-violet-50" : ""
                }`}
              >
                <span className={`text-lg ${unlocked ? "" : "grayscale opacity-40"}`}>
                  {a.icon}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${unlocked ? "" : "text-muted-foreground"}`}>
                    {a.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
                {unlocked && (
                  <span className="text-xs text-violet-500 font-medium">Unlocked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
