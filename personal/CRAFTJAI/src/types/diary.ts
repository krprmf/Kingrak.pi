import type { EmotionKey } from "@/lib/constants/emotions";

export interface DiaryEntry {
  id: string;
  user_id: string;
  content: string;
  primary_mood: EmotionKey | null;
  valence: number | null;
  arousal: number | null;
  dominance: number | null;
  mood_confidence: number | null;
  context_location: string | null;
  context_activity: string | null;
  context_social_setting: string | null;
  character_prompt: string | null;
  mascot_response: string | null;
  word_count: number;
  language: string;
  created_at: string;
  updated_at: string;
}
