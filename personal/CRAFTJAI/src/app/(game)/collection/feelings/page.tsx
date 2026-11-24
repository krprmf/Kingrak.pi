import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EMOTION_MAP, ALL_EMOTIONS } from "@/lib/constants/emotions";
import { GameScene } from "@/components/game/scene";
import { panel } from "@/components/game/ui";
import { BookOpen, NotebookPen } from "lucide-react";

// Secondary view of the journal: one little book per feeling.
// Framed as "feelings that visited you", not "collect them all".
export default async function FeelingsShelfPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: characters } = await supabase
    .from("characters")
    .select("id, mood, image_url, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const pages = characters ?? [];

  // Group pages by mood (newest first, so [0] is the cover)
  const byMood: Record<string, typeof pages> = {};
  pages.forEach((c) => {
    (byMood[c.mood] ??= []).push(c);
  });
  const visited = Object.keys(byMood).length;
  // Visited books first (most recently visited first), then the rest in the usual order,
  // so a new picture book does not open on a wall of empty books.
  const shelf = [...ALL_EMOTIONS].sort((a, b) => {
    const ta = byMood[a]?.[0]?.created_at ?? "";
    const tb = byMood[b]?.[0]?.created_at ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <GameScene
      title="By feeling"
      subtitle={`${pages.length} page${pages.length === 1 ? "" : "s"} · ${visited} of 8 feelings have visited`}
      right={
        <Link
          href="/collection"
          className={`${panel} flex h-11 items-center gap-1.5 px-3 text-sm font-semibold text-cozy-cocoa transition-transform hover:scale-105 active:translate-y-0.5`}
        >
          <NotebookPen className="h-4.5 w-4.5 text-cozy-clay" />
          Journal
        </Link>
      }
    >
      <div className="h-full w-full max-w-4xl overflow-y-auto pb-2">
        <div className="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 lg:grid-cols-4">
          {shelf.map((mood) => {
            const emotion = EMOTION_MAP[mood];
            const books = byMood[mood];
            const cover = books?.[0];

            // A little book: colored spine on the left, cover on the right
            const book = (
              <>
                <span className="absolute inset-y-0 left-0 w-3 rounded-l-[18px]" style={{ backgroundColor: emotion.hex }} />
                <div className="ml-3 overflow-hidden rounded-r-[14px] rounded-l-md">
                  <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: `${emotion.hex}22` }}>
                    {cover ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cover.image_url}
                          alt={emotion.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className={`${panel} absolute right-2 top-2 flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-cozy-cocoa`}>
                          <BookOpen className="h-3.5 w-3.5 text-cozy-clay" />
                          {books!.length}
                        </span>
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
                        <BookOpen className="h-8 w-8" style={{ color: `${emotion.hex}aa` }} />
                        <span className="text-xs text-cozy-mocha/70">Not visited yet</span>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <p className={`font-bold ${cover ? "text-cozy-cocoa" : "text-cozy-mocha/60"}`}>{emotion.name}</p>
                    <p className="flex items-center gap-1.5 text-xs capitalize text-cozy-mocha">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: emotion.hex }} />
                      {mood}
                    </p>
                  </div>
                </div>
              </>
            );

            const shell =
              "group relative block rounded-[18px] border-2 border-cozy-paper bg-cozy-cream shadow-[0_6px_0_rgba(74,52,38,0.16)]";

            return cover ? (
              <Link
                key={mood}
                href={`/collection/${mood}`}
                className={`${shell} transition-transform hover:-translate-y-1 hover:-rotate-1`}
              >
                {book}
              </Link>
            ) : (
              <div key={mood} className={`${shell} opacity-80`} aria-label={`${emotion.name}: not visited yet`}>
                {book}
              </div>
            );
          })}
        </div>
      </div>
    </GameScene>
  );
}
