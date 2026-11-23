import { createClient } from "@/lib/supabase/server";
import { EMOTION_MAP, ALL_EMOTIONS, type EmotionKey } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function MoodAlbumPage({
  params,
}: {
  params: Promise<{ mood: string }>;
}) {
  const { mood } = await params;

  if (!ALL_EMOTIONS.includes(mood as EmotionKey)) {
    notFound();
  }

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

  const chars = characters ?? [];

  if (chars.length === 0) notFound();

  // Stats
  const avgPower = Math.round(chars.reduce((sum, c) => sum + c.power_level, 0) / chars.length);
  const rarityCount: Record<string, number> = {};
  chars.forEach((c) => {
    rarityCount[c.rarity] = (rarityCount[c.rarity] || 0) + 1;
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <Link href="/collection">
        <Button variant="ghost" size="sm" className="mb-4 cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Collection
        </Button>
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${emotion.hex}20` }}
        >
          {emotion.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {emotion.name} the {emotion.animal}
          </h1>
          <p className="text-muted-foreground italic">&quot;{emotion.quote}&quot;</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: emotion.hex }}>
            {chars.length}
          </p>
          <p className="text-xs text-muted-foreground">Characters</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{avgPower}</p>
          <p className="text-xs text-muted-foreground">Avg Power</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">
            {(() => {
              const order: RarityType[] = ["common", "uncommon", "rare", "legendary"];
              let best: RarityType = "common";
              chars.forEach((c) => {
                if (order.indexOf(c.rarity as RarityType) > order.indexOf(best)) {
                  best = c.rarity as RarityType;
                }
              });
              return RARITY_CONFIG[best].icon;
            })()}
          </p>
          <p className="text-xs text-muted-foreground">Best Rarity</p>
        </div>
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {chars.map((char) => {
          const rarity = RARITY_CONFIG[char.rarity as RarityType];
          const date = new Date(char.created_at).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
          });

          return (
            <Link
              key={char.id}
              href={`/character/${char.id}`}
              className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: `${rarity.color}40` }}
            >
              <div className="aspect-square relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={char.image_url}
                  alt={char.animal_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div
                  className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: rarity.color }}
                >
                  {rarity.icon} {rarity.label}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{char.animal_name}</p>
                  <span className="text-xs text-muted-foreground">PWR {char.power_level}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
