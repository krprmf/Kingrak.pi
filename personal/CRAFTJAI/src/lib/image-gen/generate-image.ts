import sharp from "sharp";

// Cloudflare Workers AI (free daily allocation). HF hf-inference dropped
// FLUX.1-schnell (HTTP 410) in 2026, so image generation moved here.
// Override the model with CLOUDFLARE_IMAGE_MODEL if needed.
const DEFAULT_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const STEPS = 8; // flux-1-schnell max; more steps = more detail

// Cloudflare rejects some harmless prompts as NSFW (error code 8007). Tested on
// 2026-11-24: tag words like "anime" and "masterpiece, best quality" (common in adult
// anime prompts) plus a bed/blanket scene push its filter over the edge. So we do
// not add those tags, and if a prompt is still rejected we retry once with only the
// character's description and a plain, cozy scene.
const NSFW_CODE = 8007;
const SAFE_SCENE =
  "sitting calmly in a cozy, bright room, gentle expression, cute chibi illustration, soft pastel colors, soft lighting, wholesome";

class CloudflareImageError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
  }
}

async function runModel(prompt: string): Promise<Buffer> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("Image generation is not configured: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");
  }
  const model = process.env.CLOUDFLARE_IMAGE_MODEL || DEFAULT_MODEL;

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: STEPS }),
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    const text = await res.text();
    let code: number | undefined;
    try {
      code = (JSON.parse(text) as { errors?: { code?: number }[] }).errors?.[0]?.code;
    } catch {
      // not JSON; keep the raw text in the message
    }
    throw new CloudflareImageError(`Cloudflare image generation failed (HTTP ${res.status}): ${text.slice(0, 300)}`, code);
  }

  if (contentType.startsWith("image/")) {
    // Some Workers AI image models return raw bytes
    return Buffer.from(await res.arrayBuffer());
  }
  // flux-1-schnell returns { success, result: { image: "<base64 jpeg>" } }
  const data = (await res.json()) as { success?: boolean; result?: { image?: string }; errors?: unknown };
  if (!data.success || !data.result?.image) {
    throw new Error(`Cloudflare image generation returned no image: ${JSON.stringify(data.errors ?? data).slice(0, 300)}`);
  }
  return Buffer.from(data.result.image, "base64");
}

/** "a quiet dark-blue cat ... collar. She is curled up..." -> "a quiet dark-blue cat ... collar" */
function characterOnly(prompt: string): string {
  return prompt.split(/(?<=\.)\s/)[0].replace(/\.$/, "");
}

export async function generateCharacterImage(prompt: string): Promise<Buffer> {
  let buffer: Buffer;
  try {
    buffer = await runModel(prompt);
  } catch (err) {
    if (!(err instanceof CloudflareImageError) || err.code !== NSFW_CODE) throw err;
    console.warn("Image prompt flagged as NSFW by Cloudflare, retrying with a plain scene");
    buffer = await runModel(`${characterOnly(prompt)}, ${SAFE_SCENE}`);
  }
  return sharp(buffer).resize(512, 512).webp({ quality: 80 }).toBuffer();
}
