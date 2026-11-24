import localFont from "next/font/local";

// Fonts are self-hosted (files in src/fonts, all SIL Open Font License) instead of
// next/font/google: Vercel builds failed twice on 2026-11-24 while downloading
// Google Fonts, and local files make the build independent of that network call.

// Rounded, chunky display font for game-style titles and buttons (Latin only).
export const fredoka = localFont({
  src: "../fonts/fredoka-latin.woff2",
  weight: "300 700",
  display: "swap",
  variable: "--font-fredoka",
});

// Soft rounded font: Latin part (journal handwriting) and Thai part (e.g. "โกส").
// Two separate faces, chained in CSS as --font-itim (see .font-game in globals.css).
export const itimLatin = localFont({
  src: "../fonts/itim-latin.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-itim-latin",
});

export const itimThai = localFont({
  src: "../fonts/itim-thai.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-itim-thai",
});

// Put this class on any "game" area. `.font-game` (globals.css) uses
// Fredoka first and falls back to Itim per letter.
export const gameFontClass = `${fredoka.variable} ${itimLatin.variable} ${itimThai.variable} font-game`;
