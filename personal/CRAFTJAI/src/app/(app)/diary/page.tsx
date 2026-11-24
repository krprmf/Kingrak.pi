import { createClient } from "@/lib/supabase/server";
import { DiaryTabs } from "@/components/diary/diary-tabs";

export default async function DiaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Count today's characters (not diary entries)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const { count } = await supabase
    .from("characters")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .gte("created_at", startOfDay)
    .lt("created_at", endOfDay);

  const DAILY_LIMIT = process.env.NODE_ENV === "development" ? 99 : 5;
  const remaining = Math.max(0, DAILY_LIMIT - (count ?? 0));
  // App is English-only for now (profiles.preferred_language is ignored).
  // Thai strings stay in the diary components for a future language toggle.
  const lang = "en" as const;

  return <DiaryTabs remainingToday={remaining} lang={lang} />;
}
