import type { BundledLanguage } from "@pierre/diffs";

export const languages = [
  ["typescript", "TypeScript"],
  ["tsx", "TSX"],
  ["javascript", "JavaScript"],
  ["c", "C"],
  ["cpp", "C++"],
  ["python", "Python"],
  ["rust", "Rust"],
  ["go", "Go"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["json", "JSON"],
  ["bash", "Shell"],
  ["text", "Plain text"],
] satisfies [BundledLanguage | "text", string][];
