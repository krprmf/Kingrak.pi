import type { EmotionKey } from "@/lib/constants/emotions";

export interface MoodItem {
  primary_mood: EmotionKey;
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  dominance: number; // 0 to 1
  confidence: number; // 0 to 1
  segment: string; // which part of diary this mood came from
  context: {
    location: string;
    activity: string;
    social_setting: string;
  };
  character_prompt: string;
}

export interface MoodAnalysis {
  moods: MoodItem[]; // 1-3 moods from one diary
  mascot_response: string;
}
