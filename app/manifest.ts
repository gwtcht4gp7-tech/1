import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FocusBoard",
    short_name: "FocusBoard",
    description: "A personal productivity dashboard for todos, habits, and finance.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
