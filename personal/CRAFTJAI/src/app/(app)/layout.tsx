export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { JaiD } from "@/components/mascot/jaid";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { count: characterCount } = await supabase
    .from("characters")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: moodCounts } = await supabase
    .from("characters")
    .select("mood")
    .eq("user_id", user.id);

  const uniqueMoods = new Set(moodCounts?.map((c) => c.mood) ?? []).size;

  // Get last mascot response
  const { data: lastEntry } = await supabase
    .from("diary_entries")
    .select("mascot_response, primary_mood")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentStreak={streak?.current_streak ?? 0}
        uniqueMoods={uniqueMoods}
        totalCharacters={characterCount ?? 0}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          displayName={profile?.display_name ?? user.email ?? "User"}
          avatarUrl={profile?.avatar_url}
          currentStreak={streak?.current_streak ?? 0}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-20 lg:pb-8">{children}</main>
      </div>
      <JaiD lastResponse={lastEntry?.mascot_response} lastMood={lastEntry?.primary_mood} />
    </div>
  );
}
