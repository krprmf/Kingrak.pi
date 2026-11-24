"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { House, PenLine, Grid3X3, CalendarDays, User, Flame, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/diary", label: "Diary", icon: PenLine },
  { href: "/collection", label: "Collection", icon: Grid3X3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  currentStreak: number;
  uniqueMoods: number;
  totalCharacters: number;
}

export function Sidebar({ currentStreak, uniqueMoods, totalCharacters }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r bg-card p-4 gap-2">
        <Link href="/home" className="flex items-center gap-2 px-3 py-2 mb-4">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <span className="text-xl font-bold text-violet-600">CRAFTJAI</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-violet-100 text-violet-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t pt-4 space-y-3">
          <div className="px-3">
            <p className="text-xs text-muted-foreground mb-1">
              Mood Discovery {uniqueMoods}/8
            </p>
            <Progress value={(uniqueMoods / 8) * 100} className="h-2" />
          </div>
          <div className="px-3 flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              {currentStreak} streak
            </span>
            <span>{totalCharacters} collected</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-card/95 backdrop-blur">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                  pathname.startsWith(item.href)
                    ? "text-violet-600"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
