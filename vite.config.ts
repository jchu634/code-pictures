import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { webfontDownload } from "vite-plugin-webfont-dl";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    webfontDownload(
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;450;500;550;600;650;700&family=Fira+Code:wght@400;500&family=IBM+Plex+Mono:wght@400;500&family=Intel+One+Mono:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Source+Code+Pro:wght@400;500&display=swap",
      { injectAsStyleTag: false, throwError: true },
    ),
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
