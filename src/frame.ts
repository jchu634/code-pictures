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
  minimum: WindowSize = { width: 1, height: 1 },
): WindowSize {
  return {
    width: Math.max(minimum.width, Math.min(2400, Math.round(size.width))),
    height: Math.max(minimum.height, Math.min(1600, Math.round(size.height))),
  };
}

export function measureMinimumWindow(container: HTMLElement): WindowSize | null {
  const root = container.shadowRoot;
  const pre = root?.querySelector<HTMLElement>("pre");
  const body = container.closest<HTMLElement>("[data-code-body]");
  const frame = container.closest<HTMLElement>("[data-code-window]");
  if (!root || !pre || !body || !frame || !container.offsetWidth) return null;

  const zoom = frame.getBoundingClientRect().width / frame.offsetWidth;
  if (!zoom) return null;
  const bodyStyle = getComputedStyle(body);
  const frameStyle = getComputedStyle(frame);
  const header = frame.querySelector<HTMLElement>("[data-code-header]");
  const rows = [
    ...root.querySelectorAll<HTMLElement>("[data-content] [data-line]"),
  ].filter((row) => getComputedStyle(row).display !== "none");
  const context = document.createElement("canvas").getContext("2d");
  let contentWidth = 1;
  for (const row of rows) {
    const style = getComputedStyle(row);
    if (context) context.font = `${style.fontSize} ${style.fontFamily}`;
    // Wrapped code needs room for one character, or the skipped-lines marker.
    const marker = getComputedStyle(row, "::after").content === '"···"';
    const characterWidth =
      context?.measureText(marker ? "···" : "M").width ??
      parseFloat(style.fontSize);
    contentWidth = Math.max(
      contentWidth,
      characterWidth +
        parseFloat(style.paddingLeft) +
        parseFloat(style.paddingRight),
    );
  }
  const gutter = root.querySelector<HTMLElement>("[data-gutter]");
  return {
    width: Math.ceil(
      contentWidth +
        (gutter?.getBoundingClientRect().width ?? 0) / zoom +
        parseFloat(bodyStyle.paddingLeft) +
        parseFloat(bodyStyle.paddingRight) +
        parseFloat(frameStyle.borderLeftWidth) +
        parseFloat(frameStyle.borderRightWidth),
    ),
    height: Math.ceil(
      pre.getBoundingClientRect().height / zoom +
        (header?.getBoundingClientRect().height ?? 0) / zoom +
        parseFloat(bodyStyle.paddingTop) +
        parseFloat(bodyStyle.paddingBottom) +
        parseFloat(frameStyle.borderTopWidth) +
        parseFloat(frameStyle.borderBottomWidth),
    ),
  };
}

// Shared by the live window and the detached export renderer.
export const frameClasses =
  "flex flex-col overflow-hidden border border-black/10 bg-code-background text-code-foreground dark:border-white/10";
export const frameHeaderClasses =
  "flex h-11 shrink-0 items-center border-b border-black/8 px-[18px] text-xs dark:border-white/8";
export const frameBodyClasses =
  "min-h-0 flex-1 [&_diffs-container]:block";
