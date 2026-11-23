import type { RarityType } from "@/types/character";

export function calculateRarity(
  valence: number,
  arousal: number,
  dominance: number,
  wordCount: number
): RarityType {
  let score = 0;

  // Word count: rewards deeper reflection (0-40 pts)
  if (wordCount >= 200) score += 40;
  else if (wordCount >= 100) score += 30;
  else if (wordCount >= 50) score += 20;
  else if (wordCount >= 20) score += 10;

  // Emotional intensity: extreme values = deeper engagement (0-30 pts)
  const valenceIntensity = Math.abs(valence);
  const arousalIntensity = arousal;
  score += Math.round(((valenceIntensity + arousalIntensity) / 2) * 30);

  // Dominance extremity: both very high and very low are rare (0-30 pts)
  const dominanceIntensity = Math.abs(dominance - 0.5) * 2;
  score += Math.round(dominanceIntensity * 30);

  if (score >= 76) return "legendary";
  if (score >= 51) return "rare";
  if (score >= 26) return "uncommon";
  return "common";
}

export function calculatePowerLevel(arousal: number, dominance: number): number {
  return Math.round((arousal * 0.6 + dominance * 0.4) * 100);
}
