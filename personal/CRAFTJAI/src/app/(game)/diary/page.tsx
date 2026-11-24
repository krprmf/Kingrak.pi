import { createClient } from "@/lib/supabase/server";
import { DiaryTabs } from "@/components/diary/diary-tabs";
import { GameScene } from "@/components/game/scene";
import { panel } from "@/components/game/ui";
import { Sparkles } from "lucide-react";

// The desk: write today's diary (chat with โกส or free write).
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

  return (
    <GameScene
      title="Today's page"
      subtitle="โกส is ready to listen"
      right={
        <span className={`${panel} flex h-11 items-center gap-1 px-3 text-sm font-semibold text-cozy-cocoa`} title="Characters you can still create today">
          <Sparkles className="h-4 w-4 text-cozy-honey-dark" />
          {remaining} left
        </span>
      }
    >
      <DiaryTabs remainingToday={remaining} dailyLimit={DAILY_LIMIT} lang={lang} />
    </GameScene>
  );
}
