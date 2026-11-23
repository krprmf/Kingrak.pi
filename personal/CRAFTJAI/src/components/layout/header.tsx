"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Sparkles } from "lucide-react";

interface HeaderProps {
  displayName: string;
  avatarUrl: string | null;
  currentStreak: number;
}

export function Header({ displayName, avatarUrl, currentStreak }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="lg:hidden flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-500" />
        <span className="text-lg font-bold text-violet-600">CRAFTJAI</span>
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-sm font-medium text-orange-600">
            <Flame className="w-4 h-4" />
            {currentStreak}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {displayName}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
