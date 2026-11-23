import type { SupabaseClient } from "@supabase/supabase-js";

export const ACHIEVEMENT_DEFS = [
  { key: "first_entry", label: "First Entry", desc: "Write your first diary", icon: "✏️" },
  { key: "first_week", label: "First Week", desc: "Reach a 7-day streak", icon: "🔥" },
  { key: "mood_explorer", label: "Mood Explorer", desc: "Discover all 8 moods", icon: "🌈" },
  { key: "rare_collector", label: "Rare Collector", desc: "Get your first Rare character", icon: "⭐" },
  { key: "legendary", label: "Legendary", desc: "Get your first Legendary character", icon: "💎" },
  { key: "ten_entries", label: "Dedicated Writer", desc: "Write 10 diary entries", icon: "📚" },
  { key: "three_in_one", label: "Emotional Rainbow", desc: "Get 3 characters from one diary", icon: "🌊" },
] as const;

export type AchievementKey = (typeof ACHIEVEMENT_DEFS)[number]["key"];

export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const newlyUnlocked: string[] = [];

  const [
    { data: existingAchievements },
    { data: streak },
    { count: totalEntries },
    { data: characters },
  ] = await Promise.all([
    supabase.from("achievements").select("achievement_key").eq("user_id", userId),
    supabase.from("streaks").select("*").eq("user_id", userId).single(),
    supabase.from("diary_entries").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("characters").select("mood, rarity, diary_entry_id").eq("user_id", userId),
  ]);

  const unlocked = new Set(existingAchievements?.map((a) => a.achievement_key) ?? []);
  const chars = characters ?? [];

  const checks: { key: AchievementKey; condition: boolean }[] = [
    { key: "first_entry", condition: (totalEntries ?? 0) >= 1 },
    { key: "ten_entries", condition: (totalEntries ?? 0) >= 10 },
    { key: "first_week", condition: (streak?.longest_streak ?? 0) >= 7 },
    { key: "mood_explorer", condition: new Set(chars.map((c) => c.mood)).size >= 8 },
    { key: "rare_collector", condition: chars.some((c) => c.rarity === "rare" || c.rarity === "legendary") },
    { key: "legendary", condition: chars.some((c) => c.rarity === "legendary") },
    {
      key: "three_in_one",
      condition: (() => {
        const countByEntry: Record<string, number> = {};
        chars.forEach((c) => { countByEntry[c.diary_entry_id] = (countByEntry[c.diary_entry_id] || 0) + 1; });
        return Object.values(countByEntry).some((v) => v >= 3);
      })(),
    },
  ];

  for (const { key, condition } of checks) {
    if (condition && !unlocked.has(key)) {
      const { error } = await supabase
        .from("achievements")
        .insert({ user_id: userId, achievement_key: key });
      if (!error) {
        newlyUnlocked.push(key);
      }
    }
  }

  return newlyUnlocked;
}
