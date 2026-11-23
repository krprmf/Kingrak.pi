import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EMOTION_MAP, type EmotionKey } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();

  if (!character) notFound();

  const { data: entry } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("id", character.diary_entry_id)
    .single();

  const emotion = EMOTION_MAP[character.mood as EmotionKey];
  const rarity = RARITY_CONFIG[character.rarity as RarityType];

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/collection">
        <Button variant="ghost" size="sm" className="mb-4 cursor-pointer">
          ← Back to Collection
        </Button>
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Character image */}
        <div
          className="rounded-2xl overflow-hidden border-4 shadow-lg"
          style={{ borderColor: rarity.color }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={character.image_url}
            alt={character.animal_name}
            className="w-full aspect-square object-cover"
          />
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{character.animal_name}</h1>
            <p className="text-muted-foreground capitalize">
              {emotion?.emoji} {character.mood} {character.animal}
            </p>
            <p className="text-sm text-muted-foreground italic mt-1">
              &quot;{emotion?.quote}&quot;
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: rarity.color }}
            >
              {rarity.icon} {rarity.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {new Date(character.created_at).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Power bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">Power Level</span>
              <span className="text-muted-foreground">{character.power_level}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${character.power_level}%`,
                  backgroundColor: emotion?.hex,
                }}
              />
            </div>
          </div>

          {/* Diary entry */}
          {entry && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                📝 Diary Entry
              </p>
              <p className="text-sm leading-relaxed">{entry.content}</p>
            </div>
          )}

          {/* Mood analysis */}
          {entry && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                📊 Mood Analysis
              </p>
              {[
                { label: "Valence", value: ((entry.valence ?? 0) + 1) / 2 * 100 },
                { label: "Arousal", value: (entry.arousal ?? 0.5) * 100 },
                { label: "Dominance", value: (entry.dominance ?? 0.5) * 100 },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{bar.label}</span>
                    <span className="text-muted-foreground">
                      {Math.round(bar.value)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${bar.value}%` }}
                    />
                  </div>
                </div>
              ))}
              {entry.context_location && (
                <p className="text-xs text-muted-foreground">
                  📍 {entry.context_location}
                </p>
              )}
              {entry.context_activity && (
                <p className="text-xs text-muted-foreground">
                  🎯 {entry.context_activity}
                </p>
              )}
            </div>
          )}

          {/* Mascot response */}
          {entry?.mascot_response && (
            <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
              <p className="text-xs text-violet-500 font-medium mb-1">
                🐾 JaiD said:
              </p>
              <p className="text-sm">{entry.mascot_response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
