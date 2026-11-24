import { createClient } from "@/lib/supabase/server";
import { GameScene } from "@/components/game/scene";
import { panel } from "@/components/game/ui";
import { CalendarView, type MirrorEntry } from "@/components/calendar/calendar-view";
import type { EmotionKey } from "@/lib/constants/emotions";
import { Flame } from "lucide-react";

// The mirror: look back at how you have been feeling, month by month.
export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A personal journal is small, so load every entry once and let the browser
  // group them by its own local days and switch months without extra requests.
  const [{ data: streak }, { data: entries }] = await Promise.all([
    supabase.from("streaks").select("current_streak, longest_streak, total_entries").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("diary_entries")
      .select("id, content, primary_mood, mascot_response, created_at, characters(id, image_url, animal_name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true }),
  ]);

  const data: MirrorEntry[] = (entries ?? []).map((e) => ({
    id: e.id,
    createdAt: e.created_at,
    content: e.content,
    mood: (e.primary_mood as EmotionKey | null) ?? null,
    reply: e.mascot_response,
    characters: (e.characters ?? []).map((c) => ({ id: c.id, imageUrl: c.image_url, name: c.animal_name })),
  }));

  return (
    <GameScene
      title="Mirror"
      subtitle="How you have been feeling"
      right={
        <span className={`${panel} flex h-11 items-center gap-1 px-3 text-sm font-semibold text-cozy-cocoa`} title="Day streak">
          <Flame className="h-4 w-4 text-cozy-clay" />
          {streak?.current_streak ?? 0}
        </span>
      }
    >
      <CalendarView entries={data} longestStreak={streak?.longest_streak ?? 0} />
    </GameScene>
  );
}
