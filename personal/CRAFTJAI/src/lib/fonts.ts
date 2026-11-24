import { Fredoka, Itim } from "next/font/google";

// Rounded, chunky display font for game-style titles and buttons (Latin only).
export const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-fredoka",
});

// Soft rounded Thai font, used automatically for Thai letters (e.g. the ghost's name "โกส")
// because Fredoka has no Thai glyphs.
export const itim = Itim({
  subsets: ["thai", "latin"],
  weight: "400",
  display: "swap",
  variable: "--font-itim",
});

// Put this class on any "game" area. `.font-game` (globals.css) uses
// Fredoka first and falls back to Itim per letter.
export const gameFontClass = `${fredoka.variable} ${itim.variable} font-game`;
