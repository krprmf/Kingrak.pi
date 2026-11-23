import { createClient } from "./server";

export async function uploadCharacterImage(
  userId: string,
  characterId: string,
  imageBuffer: Buffer
): Promise<{ url: string; path: string }> {
  const supabase = await createClient();
  const path = `${userId}/${characterId}.webp`;

  const { error } = await supabase.storage
    .from("characters")
    .upload(path, imageBuffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("characters").getPublicUrl(path);

  return { url: publicUrl, path };
}
