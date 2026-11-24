export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gameFontClass } from "@/lib/fonts";

// Full-screen "game" layout: no sidebar, no header, no page padding.
// Pages in (game) share this; pages in (app) keep the normal web layout.
// The ghost (โกส) is drawn inside each game scene (e.g. standing in the room), not here.
export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <div className={gameFontClass}>{children}</div>;
}
