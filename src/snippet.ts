export const sampleCode = `// A little kindness goes a long way.
type Greeting = {
  name: string;
  coffee?: boolean;
};

function sayHello({ name, coffee = true }: Greeting) {
  const message = \`Hello, \${name}!\`;

  return {
    message,
    coffee: coffee ? "☕ Freshly brewed" : "Maybe later",
    haveAGoodDay: true,
  };
}

sayHello({ name: "world" });`;

export const fonts = [
  "Intel One Mono",
  "JetBrains Mono",
  "Fira Code",
  "IBM Plex Mono",
  "Source Code Pro",
];

export function parseSkippedLines(
  input: string,
  lineCount: number,
  startLine = 1,
): { lines: Set<number>; error: string | null } {
  const lines = new Set<number>();
  if (!input.trim()) return { lines, error: null };
  for (const part of input.split(",")) {
    const match = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(part.trim());
    if (!match)
      return { lines: new Set(), error: "Use numbers or ranges, e.g. 3-5, 8." };
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    const lastLine = startLine + lineCount - 1;
    if (start < startLine || end < start || end > lastLine)
      return {
        lines: new Set(),
        error: `Choose lines between ${startLine} and ${lastLine}, in ascending ranges.`,
      };
    for (let line = start; line <= end; line++) lines.add(line - startLine + 1);
  }
  if (lines.size === lineCount)
    return { lines: new Set(), error: "Keep at least one line visible." };
  return { lines, error: null };
}

export function buildPreviewCSS({
  font,
  fontSize,
  startLine,
  skipped,
  lineCount,
}: {
  font: string;
  fontSize: number;
  startLine: number;
  skipped: Set<number>;
  lineCount: number;
}): string {
  const visibleCount =
    lineCount - [...skipped].filter((line) => skipped.has(line - 1)).length;
  let css = `:host { --diffs-font-family: "${font}", monospace; --diffs-font-size: ${fontSize}px; --diffs-line-height: ${Math.round(fontSize * 1.65)}px; --diffs-gap-block: 0px; --diffs-gap-inline: 20px; --diffs-min-number-column-width: ${String(startLine + lineCount - 1).length + 1}ch; } pre { overflow: hidden !important; } [data-line] { white-space: pre !important; } [data-code] { overflow: visible !important; scrollbar-width: none; } [data-line-number-content] { color: transparent; position: relative; } [data-line-number-content]::after { position: absolute; inset: 0; color: var(--diffs-fg-number); } [data-gutter], [data-content] { grid-row: span ${visibleCount} !important; }`;
  for (let line = 1; line <= lineCount; line++) {
    const number = `[data-column-number="${line}"]`;
    if (skipped.has(line)) {
      if (!skipped.has(line - 1)) {
        css += `${number} [data-line-number-content]::after { content: "···"; } [data-line="${line}"] { position: relative; color: transparent; } [data-line="${line}"] * { display: none; } [data-line="${line}"]::after { content: "···"; position: absolute; inset-inline-start: 1ch; color: var(--diffs-fg-number); }`;
      } else
        css += `${number}, [data-line="${line}"] { display: none !important; }`;
    } else
      css += `${number} [data-line-number-content]::after { content: "${startLine + line - 1}"; font-size: ${fontSize}px; }`;
  }
  return css;
}
