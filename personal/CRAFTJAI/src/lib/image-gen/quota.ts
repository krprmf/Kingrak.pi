// TEMPORARY (testing): how much of Cloudflare's free Workers AI allowance is left today.
// Shown only when SHOW_AI_QUOTA=1. Remove this file and its chip when testing is over.
//
// Cloudflare gives 10,000 "neurons" per day on the free plan, reset at 00:00 UTC
// (07:00 in Thailand). Usage comes from the GraphQL Analytics API, which needs the
// API token to have the "Account Analytics: Read" permission. Numbers can lag a few minutes.

const DAILY_FREE_NEURONS = 10_000;

export type ImageQuota =
  | { ok: true; used: number; limit: number; remaining: number; imagesLeft: number | null }
  | { ok: false; reason: string };

export function showAiQuota(): boolean {
  return process.env.SHOW_AI_QUOTA === "1";
}

export async function getImageQuota(): Promise<ImageQuota> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) return { ok: false, reason: "not configured" };

  const todayUtc = new Date().toISOString().slice(0, 10);
  const query = `query($a: String!, $d: Date!) {
    viewer { accounts(filter: { accountTag: $a }) {
      aiInferenceAdaptiveGroups(filter: { date: $d }, limit: 50) {
        count
        sum { totalNeurons }
        dimensions { modelId }
      }
    } }
  }`;

  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { a: accountId, d: todayUtc } }),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      data?: { viewer?: { accounts?: { aiInferenceAdaptiveGroups?: { count: number; sum: { totalNeurons: number }; dimensions: { modelId: string } }[] }[] } };
      errors?: { message: string }[];
    };
    if (json.errors?.length) {
      const msg = json.errors[0].message;
      return { ok: false, reason: msg.includes("not authorized") ? "token needs Account Analytics: Read" : msg };
    }

    const groups = json.data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups ?? [];
    const used = Math.round(groups.reduce((s, g) => s + (g.sum.totalNeurons ?? 0), 0));
    const remaining = Math.max(0, DAILY_FREE_NEURONS - used);

    // Estimate images left from today's own average cost per image.
    const img = groups.filter((g) => g.dimensions.modelId.includes("flux"));
    const imgCount = img.reduce((s, g) => s + g.count, 0);
    const imgNeurons = img.reduce((s, g) => s + (g.sum.totalNeurons ?? 0), 0);
    const imagesLeft = imgCount > 0 ? Math.floor(remaining / (imgNeurons / imgCount)) : null;

    return { ok: true, used, limit: DAILY_FREE_NEURONS, remaining, imagesLeft };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "request failed" };
  }
}
