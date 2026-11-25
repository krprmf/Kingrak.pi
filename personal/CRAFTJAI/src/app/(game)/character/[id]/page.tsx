import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmotion, type EmotionKey } from "@/lib/constants/emotions";
import { RARITY_CONFIG, type RarityType } from "@/types/character";
import { GameScene } from "@/components/game/scene";
import { btnPrimary, btnSecondary, panel } from "@/components/game/ui";
import { GhostNote, KraftTag, MoodStamp, PaperSheet, TapedPhoto, TornNote, WashiTape } from "@/components/journal/scrapbook";
import { NotebookPen } from "lucide-react";

// Older ghost replies were written in Thai; only show English ones.
const THAI_SENTENCE = /[\u0E00-\u0E7F]{4,}/;

// One character, as a scrapbook page: the picture, how the day felt, what you wrote.
export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS only returns the signed-in user's own characters
  const { data: character } = await supabase.from("characters").select("*").eq("id", id).single();
  if (!character) notFound();

  const { data: entry } = await supabase.from("diary_entries").select("*").eq("id", character.diary_entry_id).single();

  const mood = character.mood as EmotionKey;
  const emotion = getEmotion(mood);
  const rarity = RARITY_CONFIG[character.rarity as RarityType];
  const created = new Date(character.created_at);
  const date = created.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const reply = entry?.mascot_response && !THAI_SENTENCE.test(entry.mascot_response) ? entry.mascot_response : null;
  const seed = character.id;

  // Valence/arousal/dominance as simple hand-drawn bars (0..100)
  const bars = entry
    ? [
        { label: "how good it felt", value: (((entry.valence ?? 0) + 1) / 2) * 100 },
        { label: "how much energy", value: (entry.arousal ?? 0.5) * 100 },
        { label: "how in control", value: (entry.dominance ?? 0.5) * 100 },
      ]
    : [];

  const tags = entry
    ? [
        { label: "where", value: entry.context_location },
        { label: "doing", value: entry.context_activity },
        { label: "with", value: entry.context_social_setting },
      ].filter((t): t is { label: string; value: string } => !!t.value && t.value !== "unknown")
    : [];

  return (
    <GameScene
      title={character.animal_name}
      subtitle={`"${emotion.quote}"`}
      right={
        <Link
          href="/collection"
          className={`${panel} flex h-11 items-center gap-1.5 px-3 text-sm font-semibold text-cozy-cocoa transition-transform hover:scale-105 active:translate-y-0.5`}
        >
          <NotebookPen className="h-4.5 w-4.5 text-cozy-clay" />
          <span className="hidden sm:inline">Journal</span>
        </Link>
      }
    >
      <div className="h-full w-full max-w-4xl overflow-hidden rounded-[16px] shadow-[0_14px_34px_rgba(74,52,38,0.3)] ring-[6px] ring-cozy-clay-dark">
        <PaperSheet className="h-full">
          <div className="h-full overflow-y-auto px-6 pb-8 pt-6 lg:grid lg:grid-cols-2 lg:gap-10">
            {/* Left: the picture and its labels */}
            <div className="space-y-8">
              <div className="flex items-start justify-between gap-3">
                <div className="relative inline-block bg-[#d9bf98] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cozy-cocoa shadow-sm">
                  <WashiTape seed={seed} i={4} className="-left-4 -top-3 w-9" />
                  {date}
                </div>
                <MoodStamp mood={mood} color={emotion.hex} seed={seed} />
              </div>

              <div className="flex justify-center pb-4">
                <TapedPhoto src={character.image_url} name={character.animal_name} seed={seed} i={0} size="w-[82%]" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ backgroundColor: rarity.color }}>
                  {rarity.label}
                </span>
                <span className="rounded-full border-2 border-cozy-paper bg-white/70 px-3 py-1 text-sm text-cozy-cocoa">
                  Power <span className="font-bold">{character.power_level}</span>
                </span>
              </div>
            </div>

            {/* Right: how it felt and what you wrote */}
            <div className="mt-10 space-y-6 lg:mt-0">
              {bars.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cozy-mocha">mood reading</p>
                  {bars.map((b) => (
                    <div key={b.label}>
                      <div className="mb-1 flex justify-between text-xs text-cozy-mocha [font-family:var(--font-itim)]">
                        <span>{b.label}</span>
                        <span>{Math.round(b.value)}%</span>
                      </div>
                      {/* marker-like stroke on a pencil line */}
                      <div className="h-2.5 rounded-full border border-cozy-mocha/30 bg-white/60">
                        <div className="h-full rounded-full opacity-80" style={{ width: `${b.value}%`, backgroundColor: emotion.hex }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {tags.map((t, i) => (
                    <KraftTag key={t.label} label={t.label} value={t.value} seed={seed} i={i} />
                  ))}
                </div>
              )}

              {entry && (
                <TornNote time={created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} seed={entry.id} i={0}>
                  {entry.content}
                </TornNote>
              )}

              {reply && <GhostNote text={reply} seed={seed} i={0} />}

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link href={`/collection/${mood}`} className={`${btnSecondary} h-11 px-4 text-sm`}>
                  More {emotion.name} pages
                </Link>
                <Link href="/collection" className={`${btnPrimary} h-11 px-4 text-sm`}>
                  Back to journal
                </Link>
              </div>
            </div>
          </div>
        </PaperSheet>
      </div>
    </GameScene>
  );
}
