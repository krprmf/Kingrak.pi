import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeMood } from "@/lib/gemini/analyze-mood";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content || content.trim().length < 5) {
      return NextResponse.json({ error: "Diary entry too short (min 5 chars)" }, { status: 400 });
    }

    // 1 Gemini call → returns 1-3 moods + 1 mascot response
    const analysis = await analyzeMood(content);

    // Save diary entry with the first (primary) mood
    const primary = analysis.moods[0];
    const { data: entry, error } = await supabase
      .from("diary_entries")
      .insert({
        user_id: user.id,
        content,
        primary_mood: primary.primary_mood,
        valence: primary.valence,
        arousal: primary.arousal,
        dominance: primary.dominance,
        mood_confidence: primary.confidence,
        context_location: primary.context.location,
        context_activity: primary.context.activity,
        context_social_setting: primary.context.social_setting,
        character_prompt: primary.character_prompt,
        mascot_response: analysis.mascot_response,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      entry,
      moods: analysis.moods,
      mascot_response: analysis.mascot_response,
    });
  } catch (err) {
    console.error("analyze-mood error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
