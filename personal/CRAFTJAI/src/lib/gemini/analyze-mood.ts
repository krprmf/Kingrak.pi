import { getModel } from "./client";
import { buildMoodAnalysisPrompt } from "./prompts";
import type { MoodAnalysis, MoodItem } from "@/types/emotion";
import type { EmotionKey } from "@/lib/constants/emotions";

const VALID_MOODS: EmotionKey[] = [
  "joy", "trust", "fear", "sadness",
  "surprise", "disgust", "anger", "anticipation",
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function analyzeMood(diaryContent: string): Promise<MoodAnalysis> {
  const model = getModel();
  const prompt = buildMoodAnalysisPrompt(diaryContent);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text);

  // Parse moods array (1-3 items)
  const rawMoods = Array.isArray(parsed.moods) ? parsed.moods.slice(0, 3) : [parsed];

  const moods: MoodItem[] = rawMoods.map((m: Record<string, unknown>) => ({
    primary_mood: VALID_MOODS.includes(m.primary_mood as EmotionKey)
      ? (m.primary_mood as EmotionKey)
      : "joy",
    valence: clamp((m.valence as number) ?? 0, -1, 1),
    arousal: clamp((m.arousal as number) ?? 0.5, 0, 1),
    dominance: clamp((m.dominance as number) ?? 0.5, 0, 1),
    confidence: clamp((m.confidence as number) ?? 0.5, 0, 1),
    segment: (m.segment as string) ?? "",
    context: {
      location: (m.context_location as string) ?? "unknown",
      activity: (m.context_activity as string) ?? "unknown",
      social_setting: (m.context_social_setting as string) ?? "alone",
    },
    character_prompt: (m.character_prompt as string) ?? "",
  }));

  return {
    moods,
    mascot_response: (parsed.mascot_response as string) ?? "Thanks for telling โกส about your day.",
  };
}
