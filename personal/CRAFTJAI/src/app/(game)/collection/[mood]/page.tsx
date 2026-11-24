import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EMOTION_MAP, ALL_EMOTIONS, type EmotionKey } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import { GameScene } from "@/components/game/scene";
import { panel } from "@/components/game/ui";
import { Library } from "lucide-react";

// One book in the picture book: every page (character) that came from this feeling.
export default async function MoodAlbumPage({ params }: { params: Promise<{ mood: string }> }) {
  const { mood } = await params;
  if (!ALL_EMOTIONS.includes(mood as EmotionKey)) notFound();

  const emotion = EMOTION_MAP[mood as EmotionKey];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: characters } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user!.id)
    .eq("mood", mood)
    .order("created_at", { ascending: false });

  const pages = characters ?? [];
  if (pages.length === 0) notFound();

  const avgPower = Math.round(pages.reduce((sum, c) => sum + c.power_level, 0) / pages.length);
  const order: RarityType[] = ["common", "uncommon", "rare", "legendary"];
  const best = pages.reduce<RarityType>(
    (acc, c) => (order.indexOf(c.rarity as RarityType) > order.indexOf(acc) ? (c.rarity as RarityType) : acc),
    "common"
  );

  return (
    <GameScene
      title={`${emotion.name}'s pages`}
      subtitle={`"${emotion.quote}"`}
      right={
        <Link
          href="/collection"
          className={`${panel} flex h-11 items-center gap-1.5 px-3 text-sm font-semibold text-cozy-cocoa transition-transform hover:scale-105 active:translate-y-0.5`}
        >
          <Library className="h-4.5 w-4.5 text-cozy-clay" />
          Books
        </Link>
      }
    >
      <div className="h-full w-full max-w-4xl space-y-4 overflow-y-auto pb-2">
        {/* Small stats, as chips */}
        <div className="flex flex-wrap justify-center gap-2 px-1">
          {[
            { label: pages.length === 1 ? "page" : "pages", value: pages.length },
            { label: "avg power", value: avgPower },
            { label: "best", value: RARITY_CONFIG[best].label },
          ].map((s) => (
            <span key={s.label} className={`${panel} flex items-baseline gap-1.5 px-3 py-1.5 text-sm text-cozy-mocha`}>
              <span className="font-bold text-cozy-cocoa" style={s.label.startsWith("page") ? { color: emotion.hex } : undefined}>
                {s.value}
              </span>
              {s.label}
            </span>
          ))}
        </div>

        {/* Pages, like polaroids pinned in a book */}
        <div className="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 lg:grid-cols-4">
          {pages.map((page, i) => {
            const rarity = RARITY_CONFIG[page.rarity as RarityType];
            const date = new Date(page.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
            return (
              <Link
                key={page.id}
                href={`/character/${page.id}`}
                className={`group block rounded-[16px] border-2 border-cozy-paper bg-white p-2 pb-3 shadow-[0_6px_0_rgba(74,52,38,0.14)] transition-transform hover:-translate-y-1 ${
                  i % 2 ? "rotate-1 hover:rotate-0" : "-rotate-1 hover:rotate-0"
                }`}
              >
                <div className="relative overflow-hidden rounded-[10px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.image_url}
                    alt={page.animal_name}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    className="absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: rarity.color }}
                  >
                    {rarity.label}
                  </span>
                </div>
                <div className="flex items-center justify-between px-1 pt-2">
                  <p className="text-sm font-bold text-cozy-cocoa">{page.animal_name}</p>
                  <span className="text-xs text-cozy-mocha">PWR {page.power_level}</span>
                </div>
                <p className="px-1 text-xs text-cozy-mocha">{date}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </GameScene>
  );
}
