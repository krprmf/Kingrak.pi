// Shared "cozy game UI" class strings, so every (game) screen looks the same.
// Colors come from the cozy-* tokens in globals.css.

/** Cream panel with a chunky bottom shadow (HUD cards, round buttons). */
export const panel =
  "rounded-2xl border-2 border-cozy-paper bg-cozy-cream/90 shadow-[0_4px_0_rgba(74,52,38,0.22)] backdrop-blur";

/** Big paper card that holds a screen's main content (journal page, album, ...). */
export const paperCard =
  "rounded-[28px] border-4 border-cozy-paper bg-cozy-cream/95 shadow-[0_10px_0_rgba(74,52,38,0.18),0_20px_40px_rgba(74,52,38,0.18)]";

/** Pressable 3D button base: thick bottom border that squashes when pressed. */
const press =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-b-[5px] font-bold transition-transform active:translate-y-[3px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-[5px] cursor-pointer";

export const btnPrimary = `${press} border-cozy-clay-dark bg-cozy-clay text-white hover:bg-cozy-clay-light`;
export const btnSecondary = `${press} border-cozy-honey-dark bg-cozy-honey text-cozy-cocoa hover:bg-cozy-honey-light`;

/** Small rounded chip (suggestion prompts, small toggles). */
export const chip =
  "rounded-full border-2 border-cozy-paper bg-white/80 px-3 py-1 text-sm text-cozy-mocha transition-colors hover:border-cozy-clay hover:text-cozy-clay cursor-pointer";

/** Text input / textarea look. */
export const field =
  "w-full rounded-2xl border-2 border-cozy-paper bg-white px-4 text-base text-cozy-cocoa outline-none placeholder:text-cozy-mocha/60 focus:border-cozy-clay";
