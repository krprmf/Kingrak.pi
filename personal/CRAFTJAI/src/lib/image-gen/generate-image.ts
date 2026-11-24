import sharp from "sharp";

// Cloudflare Workers AI (free daily allocation). HF hf-inference dropped
// FLUX.1-schnell (HTTP 410) in 2026, so image generation moved here.
// Override the model with CLOUDFLARE_IMAGE_MODEL if needed.
const DEFAULT_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const STEPS = 8; // flux-1-schnell max; more steps = more detail

export async function generateCharacterImage(prompt: string): Promise<Buffer> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("Image generation is not configured: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");
  }
  const model = process.env.CLOUDFLARE_IMAGE_MODEL || DEFAULT_MODEL;
  const fullPrompt = `${prompt}, masterpiece, best quality, highly detailed illustration`;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: fullPrompt, steps: STEPS }),
    }
  );

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Cloudflare image generation failed (HTTP ${res.status}): ${detail}`);
  }

  let buffer: Buffer;
  if (contentType.startsWith("image/")) {
    // Some Workers AI image models return raw bytes
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    // flux-1-schnell returns { success, result: { image: "<base64 jpeg>" } }
    const data = (await res.json()) as { success?: boolean; result?: { image?: string }; errors?: unknown };
    if (!data.success || !data.result?.image) {
      throw new Error(`Cloudflare image generation returned no image: ${JSON.stringify(data.errors ?? data).slice(0, 300)}`);
    }
    buffer = Buffer.from(data.result.image, "base64");
  }

  return sharp(buffer).resize(512, 512).webp({ quality: 80 }).toBuffer();
}
