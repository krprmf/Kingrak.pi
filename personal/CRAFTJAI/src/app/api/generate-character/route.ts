import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCharacterImage } from "@/lib/image-gen/generate-image";
import { uploadCharacterImage } from "@/lib/supabase/storage";
import { calculateRarity, calculatePowerLevel } from "@/lib/gamification/rarity";
import { applyStreakBonus } from "@/lib/gamification/streak-rewards";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievements";
import { EMOTION_MAP, type EmotionKey } from "@/lib/constants/emotions";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entryId, mood: moodData } = await request.json();

    // moodData = { primary_mood, valence, arousal, dominance, confidence, segment, character_prompt, context }

    if (!entryId || !moodData) {
      return NextResponse.json({ error: "Missing entryId or mood data" }, { status: 400 });
    }

    // Check daily limit (max 5 — since 1 diary can produce up to 3 characters)
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("characters")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    const DAILY_LIMIT = process.env.NODE_ENV === "development" ? 99 : 5;
    if ((count ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Daily limit reached (5/5). Come back tomorrow!" },
        { status: 429 }
      );
    }

    // Verify entry belongs to user
    const { data: entry } = await supabase
      .from("diary_entries")
      .select("id")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const emotion = EMOTION_MAP[moodData.primary_mood as EmotionKey];
    if (!emotion) {
      return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
    }

    // Generate image
    const imageBuffer = await generateCharacterImage(moodData.character_prompt);

    // Calculate gamification
    const baseRarity = calculateRarity(
      moodData.valence ?? 0,
      moodData.arousal ?? 0.5,
      moodData.dominance ?? 0.5,
      moodData.segment?.length ?? 10
    );

    // Apply streak bonus
    const { data: streak } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .single();
    const rarity = applyStreakBonus(baseRarity, streak?.current_streak ?? 0);
    const powerLevel = calculatePowerLevel(moodData.arousal ?? 0.5, moodData.dominance ?? 0.5);

    // Upload image
    const characterId = crypto.randomUUID();
    const { url, path } = await uploadCharacterImage(user.id, characterId, imageBuffer);

    // Save character
    const { data: character, error } = await supabase
      .from("characters")
      .insert({
        id: characterId,
        user_id: user.id,
        diary_entry_id: entryId,
        mood: moodData.primary_mood,
        animal: emotion.animal,
        animal_name: emotion.name,
        color: emotion.color,
        image_url: url,
        image_path: path,
        rarity,
        power_level: powerLevel,
        generation_prompt: moodData.character_prompt,
        generation_model: "FLUX.1-schnell",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check achievements (non-blocking)
    const newAchievements = await checkAndUnlockAchievements(supabase, user.id).catch(() => []);

    return NextResponse.json({ character, newAchievements });
  } catch (err) {
    console.error("generate-character error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
