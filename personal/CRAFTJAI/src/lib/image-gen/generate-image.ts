import { hf } from "./client";
import sharp from "sharp";

const MODEL = "black-forest-labs/FLUX.1-schnell";

export async function generateCharacterImage(prompt: string): Promise<Buffer> {
  const fullPrompt = `${prompt}, masterpiece, best quality, highly detailed illustration`;

  const result = await hf.textToImage({
    model: MODEL,
    inputs: fullPrompt,
    parameters: {
      width: 768,
      height: 768,
    },
  });

  let buffer: Buffer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultAny = result as any;

  if (typeof resultAny === "object" && typeof resultAny.arrayBuffer === "function") {
    const arrayBuffer = await resultAny.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (typeof resultAny === "string") {
    // base64 data URL or URL
    if (resultAny.startsWith("data:")) {
      const base64 = resultAny.split(",")[1];
      buffer = Buffer.from(base64, "base64");
    } else {
      // It's a URL — fetch it
      const res = await fetch(resultAny);
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
  } else {
    throw new Error("Unexpected response type from HF textToImage");
  }

  const webpBuffer = await sharp(buffer)
    .resize(512, 512)
    .webp({ quality: 80 })
    .toBuffer();

  return webpBuffer;
}
