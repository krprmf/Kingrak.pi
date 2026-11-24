import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EmotionKey } from "@/lib/constants/emotions";
import { GameScene } from "@/components/game/scene";
import { panel } from "@/components/game/ui";
import { JournalBook, type JournalPage } from "@/components/journal/journal-book";
import { Library } from "lucide-react";

// The journal: one book, one page per diary entry with its pictures taped on.
// Opens on the newest page; flip back to earlier days.
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

  const pages: JournalPage[] = (entries ?? []).map((e) => ({
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
      subtitle={pages.length ? `${pages.length} page${pages.length === 1 ? "" : "s"} of your days` : "A book of your days"}
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
      <JournalBook pages={pages} />
    </GameScene>
  );
}
