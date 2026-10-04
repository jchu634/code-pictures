export type WindowSize = { width: number; height: number };

export const windowSizes = [
  { name: "640 × 480", width: 640, height: 480 },
  { name: "800 × 600", width: 800, height: 600 },
  { name: "1024 × 768", width: 1024, height: 768 },
  { name: "1280 × 720", width: 1280, height: 720 },
  { name: "1440 × 900", width: 1440, height: 900 },
];

export function constrainWindowSize(
  size: WindowSize,
  minimum: WindowSize = { width: 320, height: 200 },
): WindowSize {
  return {
    width: Math.max(
      320,
      minimum.width,
      Math.min(Math.max(2400, minimum.width), Math.round(size.width)),
    ),
    height: Math.max(
      200,
      minimum.height,
      Math.min(Math.max(1600, minimum.height), Math.round(size.height)),
    ),
  };
}

export function measureMinimumWindow(
  container: HTMLElement,
  showHeader: boolean,
): WindowSize | null {
  const root = container.shadowRoot;
  if (!root) return null;
  const rows = [
    ...root.querySelectorAll<HTMLElement>("[data-content] [data-line]"),
  ].filter((row) => getComputedStyle(row).display !== "none");
  if (!rows.length || !container.offsetWidth) return null;
  // DOM ranges measure the rendered font, including tabs and fallback glyphs.
  // Account for the preview's CSS zoom without applying it to export dimensions.
  const zoom = container.getBoundingClientRect().width / container.offsetWidth;
  if (!zoom) return null;
  let width = 0;
  let height = 0;
  for (const row of rows) {
    const range = document.createRange();
    range.selectNodeContents(row);
    const style = getComputedStyle(row);
    const textWidth =
      getComputedStyle(row, "::after").content === '"···"'
        ? parseFloat(style.fontSize) * 3
        : range.getBoundingClientRect().width / zoom;
    width = Math.max(
      width,
      textWidth +
        parseFloat(style.paddingLeft) +
        parseFloat(style.paddingRight),
    );
    height += row.getBoundingClientRect().height / zoom;
  }
  const gutter = root.querySelector<HTMLElement>("[data-gutter]");
  return {
    width: Math.ceil(width + (gutter?.offsetWidth ?? 0) + 6),
    height: Math.ceil(height + 28 + (showHeader ? 44 : 0) + 4),
  };
}

// Shared by the live window and the detached export renderer.
export const frameClasses =
  "flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white text-[#24292e] dark:border-white/10 dark:bg-[#24292e] dark:text-[#e1e4e8]";
export const frameHeaderClasses =
  "flex h-11 shrink-0 items-center border-b border-black/8 px-[18px] text-xs dark:border-white/8";
export const frameBodyClasses =
  "min-h-0 flex-1 pt-3 pb-4 [&_diffs-container]:block";
