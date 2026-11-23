import type { RarityType } from "@/types/character";

/**
 * Boost rarity based on current streak.
 * Higher streak = higher minimum rarity floor.
 */
export function applyStreakBonus(
  baseRarity: RarityType,
  currentStreak: number
): RarityType {
  const rarityOrder: RarityType[] = ["common", "uncommon", "rare", "legendary"];
  const baseIndex = rarityOrder.indexOf(baseRarity);

  // 3-day streak → at least uncommon
  if (currentStreak >= 3 && baseIndex < 1) {
    return "uncommon";
  }

  // 7-day streak → at least rare
  if (currentStreak >= 7 && baseIndex < 2) {
    return "rare";
  }

  // 30-day streak → at least rare + higher chance legendary (bump up one tier)
  if (currentStreak >= 30 && baseIndex < 3) {
    return rarityOrder[Math.min(baseIndex + 1, 3)];
  }

  return baseRarity;
}

export function getStreakRewardMessage(currentStreak: number): string | null {
  if (currentStreak === 3) return "3-day streak! Your characters are now at least Uncommon!";
  if (currentStreak === 7) return "7-day streak! Your characters are now at least Rare!";
  if (currentStreak === 14) return "2-week streak! Amazing dedication!";
  if (currentStreak === 30) return "30-day streak! Your characters get a rarity boost!";
  return null;
}
