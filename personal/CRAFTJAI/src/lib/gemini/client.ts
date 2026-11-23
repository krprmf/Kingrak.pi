import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const moodItemSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    primary_mood: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [
        "joy", "trust", "fear", "sadness",
        "surprise", "disgust", "anger", "anticipation",
      ],
    },
    valence: { type: SchemaType.NUMBER },
    arousal: { type: SchemaType.NUMBER },
    dominance: { type: SchemaType.NUMBER },
    confidence: { type: SchemaType.NUMBER },
    segment: { type: SchemaType.STRING },
    context_location: { type: SchemaType.STRING },
    context_activity: { type: SchemaType.STRING },
    context_social_setting: { type: SchemaType.STRING },
    character_prompt: { type: SchemaType.STRING },
  },
  required: [
    "primary_mood", "valence", "arousal", "dominance",
    "confidence", "segment", "character_prompt",
  ],
};

export const moodAnalysisSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    moods: {
      type: SchemaType.ARRAY,
      items: moodItemSchema,
    },
    mascot_response: { type: SchemaType.STRING },
  },
  required: ["moods", "mascot_response"],
};

export function getModel() {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: moodAnalysisSchema,
      temperature: 0.4,
    },
  });
}
