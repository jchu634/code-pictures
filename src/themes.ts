import type { DiffsThemeNames } from "@pierre/diffs";
import type { CSSProperties } from "react";

export type CodeTheme = {
  name: DiffsThemeNames;
  background: string;
  foreground: string;
};

export const themes = [
  {
    label: "GitHub",
    dark: { name: "github-dark", background: "#24292e", foreground: "#e1e4e8" },
    light: {
      name: "github-light",
      background: "#ffffff",
      foreground: "#24292e",
    },
  },
  {
    label: "Catppuccin",
    dark: {
      name: "catppuccin-mocha",
      background: "#1e1e2e",
      foreground: "#cdd6f4",
    },
    light: {
      name: "catppuccin-latte",
      background: "#eff1f5",
      foreground: "#4c4f69",
    },
  },
  {
    label: "Solarized",
    dark: {
      name: "solarized-dark",
      background: "#002b36",
      foreground: "#839496",
    },
    light: {
      name: "solarized-light",
      background: "#fdf6e3",
      foreground: "#657b83",
    },
  },
] satisfies { label: string; dark: CodeTheme; light: CodeTheme }[];

export function themeStyle(
  theme: CodeTheme,
): CSSProperties & Record<`--${string}`, string> {
  return {
    "--color-code-background": theme.background,
    "--color-code-foreground": theme.foreground,
  };
}

export function themeCSS(theme: CodeTheme): string {
  // Catppuccin adds inline italics to syntax tokens, including function names.
  return theme.name.startsWith("catppuccin-")
    ? "[data-line], [data-line] * { font-style: normal !important; }"
    : "";
}
