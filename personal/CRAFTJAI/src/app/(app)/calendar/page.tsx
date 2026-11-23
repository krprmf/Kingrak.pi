import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  // Get entries for current month with full data
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data: entries } = await supabase
    .from("diary_entries")
    .select("id, content, primary_mood, mascot_response, created_at")
    .eq("user_id", user!.id)
    .gte("created_at", firstDay.toISOString())
    .lte("created_at", lastDay.toISOString())
    .order("created_at", { ascending: true });

  // Get characters for this month
  const { data: characters } = await supabase
    .from("characters")
    .select("id, diary_entry_id, mood, animal_name, image_url, rarity, power_level, created_at")
    .eq("user_id", user!.id)
    .gte("created_at", firstDay.toISOString())
    .lte("created_at", lastDay.toISOString());

  return (
    <CalendarView
      streak={streak}
      entries={entries ?? []}
      characters={characters ?? []}
    />
  );
}
