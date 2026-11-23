import { createClient } from "@/lib/supabase/server";
import { EMOTION_MAP, ALL_EMOTIONS, type EmotionKey } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Lock, Layers } from "lucide-react";

export default async function CollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: characters } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const collected = characters ?? [];

  // Group characters by mood
  const charsByMood: Record<string, typeof collected> = {};
  collected.forEach((c) => {
    if (!charsByMood[c.mood]) charsByMood[c.mood] = [];
    charsByMood[c.mood].push(c);
  });

  const discoveredMoods = new Set(Object.keys(charsByMood));

  // Find best rarity per mood for album badge
  const bestRarityByMood: Record<string, RarityType> = {};
  const rarityOrder: RarityType[] = ["common", "uncommon", "rare", "legendary"];
  Object.entries(charsByMood).forEach(([mood, chars]) => {
    let best = 0;
    chars.forEach((c) => {
      const idx = rarityOrder.indexOf(c.rarity as RarityType);
      if (idx > best) best = idx;
    });
    bestRarityByMood[mood] = rarityOrder[best];
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Collection</h1>
          <p className="text-muted-foreground">
            {discoveredMoods.size}/8 moods discovered &middot; {collected.length} characters total
          </p>
        </div>
      </div>

      <Progress value={(discoveredMoods.size / 8) * 100} className="h-3 mb-8" />

      {/* 8 Mood Albums */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {ALL_EMOTIONS.map((mood) => {
          const emotion = EMOTION_MAP[mood];
          const chars = charsByMood[mood];
          const isDiscovered = !!chars && chars.length > 0;
          const coverChar = chars?.[0]; // Latest character as album cover
          const count = chars?.length ?? 0;
          const bestRarity = bestRarityByMood[mood];
          const rarity = bestRarity ? RARITY_CONFIG[bestRarity] : null;

          if (!isDiscovered) {
            // Locked album
            return (
              <div
                key={mood}
                className="rounded-2xl border-2 border-dashed bg-muted/20 overflow-hidden"
              >
                <div
                  className="aspect-square flex flex-col items-center justify-center gap-2"
                  style={{ backgroundColor: `${emotion.hex}08` }}
                >
                  <Lock className="w-8 h-8 text-muted-foreground/30" />
                  <span className="text-3xl opacity-20">{emotion.emoji}</span>
                </div>
                <div className="p-4 text-center">
                  <p className="font-semibold text-muted-foreground/50">{emotion.name}</p>
                  <p className="text-xs text-muted-foreground/40 capitalize mt-0.5">{mood}</p>
                  <p className="text-xs text-muted-foreground/30 mt-2 italic">
                    &quot;{emotion.quote}&quot;
                  </p>
                </div>
              </div>
            );
          }

          // Discovered album
          return (
            <Link
              key={mood}
              href={`/collection/${mood}`}
              className="group rounded-2xl border-2 bg-card overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 hover:border-opacity-60"
              style={{ borderColor: `${emotion.hex}40` }}
            >
              {/* Album cover — stacked effect */}
              <div className="aspect-square relative overflow-hidden">
                {/* Background stack effect */}
                {count >= 3 && (
                  <div
                    className="absolute inset-2 rounded-lg rotate-3 opacity-20"
                    style={{ backgroundColor: emotion.hex }}
                  />
                )}
                {count >= 2 && (
                  <div
                    className="absolute inset-1 rounded-lg -rotate-2 opacity-30"
                    style={{ backgroundColor: emotion.hex }}
                  />
                )}
                {/* Cover image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverChar!.image_url}
                  alt={emotion.name}
                  className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Count badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 text-white px-2 py-0.5 text-xs font-medium">
                  <Layers className="w-3 h-3" />
                  {count}
                </div>
              </div>

              {/* Album info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{emotion.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{mood} {emotion.animal}</p>
                  </div>
                  {rarity && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: rarity.color }}
                    >
                      {rarity.icon}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
                  &quot;{emotion.quote}&quot;
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
