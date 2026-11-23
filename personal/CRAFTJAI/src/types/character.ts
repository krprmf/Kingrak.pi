import type { EmotionKey } from "@/lib/constants/emotions";

export type RarityType = "common" | "uncommon" | "rare" | "legendary";

export interface Character {
  id: string;
  user_id: string;
  diary_entry_id: string;
  mood: EmotionKey;
  animal: string;
  animal_name: string;
  color: string;
  image_url: string;
  image_path: string;
  rarity: RarityType;
  power_level: number;
  generation_prompt: string | null;
  generation_model: string;
  created_at: string;
}

export const RARITY_CONFIG = {
  common: { label: "Common", color: "#9ca3af", icon: "●" },
  uncommon: { label: "Uncommon", color: "#22c55e", icon: "◆" },
  rare: { label: "Rare", color: "#3b82f6", icon: "⭐" },
  legendary: { label: "Legendary", color: "#eab308", icon: "💎" },
} as const;
