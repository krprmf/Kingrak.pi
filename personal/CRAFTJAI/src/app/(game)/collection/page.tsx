import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EmotionKey } from "@/lib/constants/emotions";
import { GameScene } from "@/components/game/scene";
import { panel } from "@/components/game/ui";
import { JournalBook, type JournalEntry } from "@/components/journal/journal-book";
import { Library } from "lucide-react";

// The journal: one book, one page per day (all entries of that day together),
// with the pictures taped on. Opens on the newest day; flip back to earlier days.
export default async function JournalPageRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Each entry with the characters made from it (characters.diary_entry_id -> diary_entries.id)
  const { data: entries } = await supabase
    .from("diary_entries")
    .select("id, created_at, content, primary_mood, mascot_response, characters(id, image_url, animal_name, mood)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  const pages: JournalEntry[] = (entries ?? []).map((e) => ({
    id: e.id,
    createdAt: e.created_at,
    content: e.content,
    mood: (e.primary_mood as EmotionKey | null) ?? null,
    reply: e.mascot_response,
    characters: (e.characters ?? []).map((c) => ({
      id: c.id,
      imageUrl: c.image_url,
      name: c.animal_name,
      mood: c.mood as EmotionKey,
    })),
  }));

  return (
    <GameScene
      title="My journal"
      subtitle="A book of your days"
      right={
        <Link
          href="/collection/feelings"
          className={`${panel} flex h-11 items-center gap-1.5 px-3 text-sm font-semibold text-cozy-cocoa transition-transform hover:scale-105 active:translate-y-0.5`}
        >
          <Library className="h-4.5 w-4.5 text-cozy-clay" />
          <span className="hidden sm:inline">By feeling</span>
        </Link>
      }
    >
      <JournalBook entries={pages} />
    </GameScene>
  );
}
