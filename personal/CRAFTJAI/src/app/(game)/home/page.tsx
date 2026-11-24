import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { JaiDGhost } from "@/components/mascot/jaid-ghost";
import { DialogueProvider } from "@/components/room/dialogue";
import { Hotspot } from "@/components/room/hotspot";
import { EMOTION_MAP, ALL_EMOTIONS, type EmotionKey } from "@/lib/constants/emotions";
import { PenLine, BookOpen, Sparkles, DoorOpen, ImagePlus, Flame, CalendarDays, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Positions are % of the floating room image (public/images/room-float-v2.webp, 1024x1024),
// so every hotspot stays on its object at any screen size.
type Box = { left: number; top: number; width: number; height: number };

// New filename on every image change: browsers and the Next image optimizer cache by URL.
const ROOM_IMAGE = "/images/room-float-v2.webp";

// tag: where the floating name tag sits. "inside" keeps neighbours from overlapping on small screens.
const HOTSPOTS: { href: string | null; label: string; hint: string; icon: LucideIcon; box: Box; tag?: "above" | "inside" }[] = [
  { href: "/diary", label: "Desk", hint: "Sit down and write about your day.", icon: PenLine, box: { left: 10, top: 53, width: 17, height: 17 } },
  { href: "/calendar", label: "Mirror", hint: "Look back at how you have been feeling.", icon: Sparkles, box: { left: 27, top: 44, width: 9, height: 16 } },
  { href: "/collection", label: "Bookshelf", hint: "Open your journal and flip back through your days.", icon: BookOpen, box: { left: 53, top: 36, width: 13, height: 21 } },
  { href: null, label: "Door", hint: "The outside world is not ready yet. Soon!", icon: DoorOpen, box: { left: 67, top: 40, width: 10, height: 28 }, tag: "inside" },
];

// Three frames along the blank right wall. That wall slopes down to the right
// in the isometric view, so each frame steps down and is skewed to lie flat on it.
const FRAME_SLOTS: Box[] = [
  { left: 44, top: 13, width: 8, height: 8 },
  { left: 55, top: 18.5, width: 8, height: 8 },
  { left: 66, top: 24, width: 8, height: 8 },
];
const WALL_SKEW = "skewY(27deg)";

const pct = (b: Box) => ({
  left: `${b.left}%`,
  top: `${b.top}%`,
  width: `${b.width}%`,
  height: `${b.height}%`,
});

// Shared "game UI" look: white panel, chunky bottom shadow.
const panel = "rounded-2xl border-2 border-cozy-paper bg-cozy-cream/90 shadow-[0_4px_0_rgba(74,52,38,0.22)] backdrop-blur";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // The (game) layout already redirects guests, so user is set here.
  const uid = user!.id;

  const [{ data: profile }, { data: recent }, { data: allMoods }, { data: streak }, { data: lastEntry }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", uid).single(),
    supabase
      .from("characters")
      .select("id, mood, animal_name, image_url")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(FRAME_SLOTS.length),
    supabase.from("characters").select("mood").eq("user_id", uid),
    supabase.from("streaks").select("current_streak").eq("user_id", uid).maybeSingle(),
    supabase
      .from("diary_entries")
      .select("mascot_response, primary_mood")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const name = profile?.display_name ?? "You";
  const frames = recent ?? [];
  const pages = allMoods?.length ?? 0;
  const met = new Set((allMoods ?? []).map((c) => c.mood));

  return (
    <DialogueProvider>
    {/* overflow-clip (not hidden): hidden boxes can still be scrolled by focus/scrollIntoView,
        which would slide the whole scene sideways; clip cannot scroll at all. */}
    <div className="relative h-dvh w-full overflow-clip bg-[radial-gradient(ellipse_at_50%_45%,#fff7ee_0%,#fde8d7_45%,#f3cdb8_100%)]">
      {/* Soft clouds drifting in the sky around the floating room */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="cj-cloud absolute left-[6%] top-[18%] h-24 w-56 rounded-full bg-white/60 blur-2xl" />
        <span className="cj-cloud absolute right-[8%] top-[60%] h-28 w-72 rounded-full bg-white/50 blur-2xl [animation-delay:-12s]" />
        <span className="cj-cloud absolute left-[30%] bottom-[6%] h-20 w-64 rounded-full bg-white/40 blur-2xl [animation-delay:-24s]" />
      </div>

      {/* Stage: a square that always fits the screen, so % hotspots never drift.
          No background, no shadow, no transform here: mix-blend-multiply on the
          image needs to blend with the sky behind, and a transformed parent
          would isolate it. */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* The room sits at ~42% across its image, so nudge right by 8% of the stage.
            `left` (not transform) keeps mix-blend-multiply working. */}
        <div
          className="relative aspect-square shrink-0"
          style={{ width: "min(125vw, 92dvh)", left: "calc(min(125vw, 92dvh) * 0.08)" }}
        >
          {/* multiply: the image's white background takes the sky color, so the room floats */}
          <Image
            src={ROOM_IMAGE}
            alt="Your floating room with a desk, a standing mirror, a bookshelf and a door"
            fill
            priority
            sizes="(min-width: 640px) 92dvh, 125vw"
            className="cj-float select-none object-contain mix-blend-multiply [mask-image:radial-gradient(closest-side,#000_82%,transparent)]"
          />

          {/* Frames and hotspots float with the room (same animation, separate layer) */}
          <div className="cj-float absolute inset-0">

          {/* Latest diary scenes hang on the wall like photos */}
          {FRAME_SLOTS.map((slot, i) => {
            const c = frames[i];
            const color = c ? EMOTION_MAP[c.mood as EmotionKey]?.hex : undefined;
            return c ? (
              <Link
                key={c.id}
                href={`/character/${c.id}`}
                style={{ ...pct(slot), borderColor: color, transform: WALL_SKEW }}
                className="absolute rounded-md border-[3px] bg-white p-[2px] shadow-md transition-transform hover:-rotate-3 hover:scale-110"
                title={c.animal_name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image_url} alt={c.animal_name} className="h-full w-full rounded-sm object-cover" />
              </Link>
            ) : (
              <Link
                key={`empty-${i}`}
                href="/diary"
                style={{ ...pct(slot), transform: WALL_SKEW }}
                className="absolute flex items-center justify-center rounded-md border-[3px] border-dashed border-cozy-honey/80 bg-white/40 text-cozy-mocha/70 transition-colors hover:bg-white/70"
                title="Write a diary to fill this frame"
              >
                <ImagePlus className="h-1/3 w-1/3" />
              </Link>
            );
          })}

          {/* Objects in the room are the navigation. Hover / hold shows a hint in the dialogue box. */}
          {HOTSPOTS.map((h, i) => (
            <Hotspot
              key={h.label}
              index={i}
              href={h.href}
              label={h.label}
              hint={h.hint}
              icon={<h.icon />}
              box={h.box}
              tag={h.tag}
            />
          ))}

          {/* โกส (the ghost) floats by the door (the stool was painted out of the image), moving with the room */}
          <JaiDGhost
            box={{ left: 55, top: 57, width: 12 }}
            lastResponse={lastEntry?.mascot_response}
            lastMood={(lastEntry?.primary_mood as EmotionKey | null) ?? null}
          />
          </div>
        </div>
      </div>

      {/* HUD top: player card + quick buttons */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2 sm:inset-x-5 sm:top-5">
        <div className={`${panel} pointer-events-auto flex items-center gap-3 px-3 py-2`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cozy-clay text-lg font-bold text-white ring-2 ring-cozy-paper">
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-cozy-cocoa">{name}</p>
            <div className="mt-0.5 flex items-center gap-2.5 text-xs font-semibold text-cozy-mocha">
              <span className="flex items-center gap-0.5" title="Day streak">
                <Flame className="h-3.5 w-3.5 text-cozy-clay" />
                {streak?.current_streak ?? 0}
              </span>
              <span className="flex items-center gap-0.5" title="Pages in your book">
                <BookOpen className="h-3.5 w-3.5 text-cozy-sage-dark" />
                {pages}
              </span>
              <span className="flex items-center gap-0.5" title={`Feelings met: ${met.size}/8`}>
                {ALL_EMOTIONS.map((m) => (
                  <span
                    key={m}
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: met.has(m) ? EMOTION_MAP[m].hex : "#e7e5e4" }}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-2">
          {[
            { href: "/calendar", icon: CalendarDays, label: "Calendar" },
            { href: "/profile", icon: User, label: "Profile" },
          ].map((b) => (
            <Link
              key={b.href}
              href={b.href}
              aria-label={b.label}
              title={b.label}
              className={`${panel} flex h-11 w-11 items-center justify-center text-cozy-cocoa transition-transform hover:scale-105 active:translate-y-0.5`}
            >
              <b.icon className="h-5 w-5" />
            </Link>
          ))}
        </div>
      </div>

      {/* HUD bottom: the main action of the game loop */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center px-24 sm:bottom-8">
        <Link
          href="/diary"
          className="flex items-center gap-2 whitespace-nowrap rounded-2xl border-b-[5px] border-cozy-clay-dark bg-cozy-clay px-7 py-3 text-lg font-bold text-white shadow-xl transition-transform hover:bg-cozy-clay-light active:translate-y-[3px] active:border-b-2"
        >
          <PenLine className="h-5 w-5" />
          Write today
        </Link>
      </div>
    </div>
    </DialogueProvider>
  );
}
