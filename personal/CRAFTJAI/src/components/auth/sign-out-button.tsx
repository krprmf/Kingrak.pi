"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { btnSecondary } from "@/components/game/ui";

export function SignOutButton({ isGuest = false }: { isGuest?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    // A guest cannot come back to this room after signing out, so ask first
    if (isGuest && !window.confirm("You are a guest. Signing out means this room cannot be opened again. Sign out anyway?")) return;
    setBusy(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button type="button" onClick={handleSignOut} disabled={busy} className={`${btnSecondary} h-11 w-full text-sm`}>
      <LogOut className="h-4 w-4" />
      {busy ? "Leaving..." : "Sign out"}
    </button>
  );
}
