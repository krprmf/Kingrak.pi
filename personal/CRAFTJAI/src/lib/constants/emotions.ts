export const EMOTION_MAP = {
  joy: {
    animal: "dog",
    name: "Sunny",
    color: "yellow",
    hex: "#facc15",
    quote: "Always finds the bright side",
    emoji: "🐕",
  },
  trust: {
    animal: "bear",
    name: "Oakley",
    color: "light_green",
    hex: "#4ade80",
    quote: "Steady and warm, like a hug",
    emoji: "🐻",
  },
  fear: {
    animal: "rabbit",
    name: "Shiver",
    color: "dark_green",
    hex: "#16a34a",
    quote: "Brave despite the trembling",
    emoji: "🐰",
  },
  sadness: {
    animal: "cat",
    name: "Luna",
    color: "dark_blue",
    hex: "#3b82f6",
    quote: "Feels deeply, loves quietly",
    emoji: "🐱",
  },
  surprise: {
    animal: "bird",
    name: "Zippy",
    color: "light_blue",
    hex: "#38bdf8",
    quote: "Eyes wide, heart racing",
    emoji: "🐦",
  },
  disgust: {
    animal: "rat",
    name: "Grim",
    color: "purple",
    hex: "#a855f7",
    quote: "Knows what doesn't sit right",
    emoji: "🐀",
  },
  anger: {
    animal: "tiger",
    name: "Blaze",
    color: "red",
    hex: "#ef4444",
    quote: "Burns bright, protects fiercely",
    emoji: "🐯",
  },
  anticipation: {
    animal: "fox",
    name: "Ember",
    color: "orange",
    hex: "#f97316",
    quote: "Always chasing the next moment",
    emoji: "🦊",
  },
} as const;

export type EmotionKey = keyof typeof EMOTION_MAP;
export const ALL_EMOTIONS: EmotionKey[] = Object.keys(EMOTION_MAP) as EmotionKey[];
export const EMOTION_LIST = ALL_EMOTIONS;

export type EmotionInfo = { [K in keyof (typeof EMOTION_MAP)[EmotionKey]]: string };

export const FALLBACK_EMOTION: EmotionInfo = {
  animal: "ghost",
  name: "Visitor",
  color: "brown",
  hex: "#b8694b",
  quote: "A feeling still finding its name",
  emoji: "👻",
};

export function isEmotionKey(value: unknown): value is EmotionKey {
  return typeof value === "string" && Object.hasOwn(EMOTION_MAP, value);
}

export function getEmotion(mood: string | null | undefined): EmotionInfo {
  return isEmotionKey(mood) ? EMOTION_MAP[mood] : FALLBACK_EMOTION;
}
