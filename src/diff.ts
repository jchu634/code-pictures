import { parseDiffFromFile } from "@pierre/diffs";
import type { FileContents, FileDiffMetadata } from "@pierre/diffs";
import type { LineSettings } from "./LineSettingsFields";

export type DiffLayout = "side-by-side" | "stacked";

type DiffSideSettings = LineSettings & {
  skipped: Set<number>;
  lineCount: number;
};

export function buildDiffCSS({
  font,
  fontSize,
  layout = "side-by-side",
  before,
  after,
}: {
  layout?: DiffLayout;
  font: string;
  fontSize: number;
  before: DiffSideSettings;
  after: DiffSideSettings;
}): string {
  let css = `:host { --diffs-font-family: "${font}", monospace; --diffs-font-size: ${fontSize}px; --diffs-line-height: ${Math.round(fontSize * 1.65)}px; --diffs-gap-block: 0px; --diffs-gap-inline: 20px; } pre { overflow: hidden !important; } [data-code] { overflow: visible !important; }`;
  if (layout === "stacked") {
    css += `pre { display: flex !important; flex-direction: column; } [data-code] { display: grid !important; width: 100%; position: relative; padding-top: 33px; grid-template-columns: minmax(min-content, max-content) minmax(0, 1fr); grid-template-rows: auto; } [data-gutter] { grid-column: 1 !important; } [data-content] { grid-column: 2 !important; } [data-code]::before { position: absolute; inset: 0 0 auto; height: 33px; box-sizing: border-box; padding: 8px 20px; font: 12px/16px var(--diffs-header-font-fallback); color: var(--diffs-fg-number); border-bottom: 1px solid color-mix(in srgb, var(--diffs-fg) 8%, transparent); } [data-deletions]::before { content: "Before"; } [data-additions]::before { content: "After"; border-top: 1px solid color-mix(in srgb, var(--diffs-fg) 8%, transparent); }`;
  }
  for (const [side, settings] of [
    ["deletions", before],
    ["additions", after],
  ] satisfies [string, DiffSideSettings][]) {
    const scope = `[data-${side}]`;
    css += `${scope} { --diffs-min-number-column-width: ${String(settings.startLine + settings.lineCount - 1).length + 1}ch; } ${scope} [data-line-number-content] { color: transparent; position: relative; } ${scope} [data-line-number-content]::after { position: absolute; inset: 0; color: var(--diffs-fg-number); }`;
    if (!settings.lineNumbers)
      css += `${scope} [data-line-number-content]::after { visibility: hidden; }`;
    for (let line = 1; line <= settings.lineCount; line++) {
      const number = `${scope} [data-column-number="${line}"] [data-line-number-content]::after`;
      css += `${number} { content: "${settings.skipped.has(line) ? "···" : settings.startLine + line - 1}"; }`;
      // Preserve aligned diff rows when a side hides code.
      if (settings.skipped.has(line))
        css += `${scope} [data-line="${line}"] { position: relative; color: transparent; } ${scope} [data-line="${line}"] * { visibility: hidden; } ${scope} [data-line="${line}"]::after { content: "···"; position: absolute; inset-inline-start: 1ch; color: var(--diffs-fg-number); }`;
    }
  }
  return css;
}

// Keep both screenshot columns, including identical files and an empty side.
export function buildScreenshotDiff(
  oldFile: FileContents,
  newFile: FileContents,
): FileDiffMetadata {
  const diff = parseDiffFromFile(oldFile, newFile);
  diff.type = "change";
  if (oldFile.contents === newFile.contents) {
    const count = Math.max(1, diff.additionLines.length);
    if (!diff.additionLines.length) {
      diff.additionLines = [""];
      diff.deletionLines = [""];
    }
    diff.splitLineCount = count;
    diff.unifiedLineCount = count;
    diff.hunks = [
      {
        collapsedBefore: 0,
        additionStart: 1,
        additionCount: count,
        additionLines: 0,
        additionLineIndex: 0,
        deletionStart: 1,
        deletionCount: count,
        deletionLines: 0,
        deletionLineIndex: 0,
        splitLineStart: 0,
        splitLineCount: count,
        unifiedLineStart: 0,
        unifiedLineCount: count,
        noEOFCRAdditions: false,
        noEOFCRDeletions: false,
        hunkContent: [
          {
            type: "context",
            lines: count,
            additionLineIndex: 0,
            deletionLineIndex: 0,
          },
        ],
      },
    ];
  }
  for (const hunk of diff.hunks) {
    hunk.noEOFCRAdditions = false;
    hunk.noEOFCRDeletions = false;
  }
  return diff;
}
