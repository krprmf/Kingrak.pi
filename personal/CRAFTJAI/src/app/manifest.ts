import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRAFTJAI — Mood Character Journal",
    short_name: "CRAFTJAI",
    description: "Write your diary and collect AI-generated mood characters",
    start_url: "/diary",
    scope: "/",
    display: "standalone",
    background_color: "#faf5ff",
    theme_color: "#7c3aed",
    orientation: "any",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
