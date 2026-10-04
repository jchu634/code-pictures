import { File, preloadHighlighter } from "@pierre/diffs";
import type { FileContents, BaseCodeOptions } from "@pierre/diffs";
import { toPng } from "html-to-image";
import { frameClasses, frameHeaderClasses, frameBodyClasses } from "./frame";
import type { WindowSize } from "./frame";

export async function exportScreenshot({
  file,
  size,
  mode,
  options,
  scale,
  font,
  fontSize,
  showHeader,
}: {
  file: FileContents;
  size: WindowSize;
  mode: "dark" | "light";
  options: BaseCodeOptions;
  scale: number;
  font: string;
  fontSize: number;
  showHeader: boolean;
}): Promise<void> {
  await preloadHighlighter({
    themes: ["github-dark", "github-light"],
    langs: [file.lang ?? "text"],
  });
  await document.fonts.load(`${fontSize}px "${font}"`);
  await document.fonts.ready;

  const staging = document.createElement("div");
  staging.style.cssText =
    "position:fixed;left:-100000px;top:0;pointer-events:none";
  staging.setAttribute("aria-hidden", "true");
  const frame = document.createElement("div");
  frame.className = `${mode} ${frameClasses}`;
  frame.style.width = `${size.width}px`;
  frame.style.height = `${size.height}px`;
  const header = document.createElement("div");
  header.className = `${frameHeaderClasses} truncate`;
  header.textContent = file.name || "untitled";
  const body = document.createElement("div");
  body.className = `${frameBodyClasses} overflow-hidden`;
  const content = document.createElement("div");
  const container = document.createElement("diffs-container");
  content.append(container);
  body.append(content);
  if (showHeader) frame.append(header);
  frame.append(body);
  staging.append(frame);
  document.body.append(staging);
  const renderer = new File(options);

  try {
    // Render without an editor so carets, selections, and resize controls never enter the PNG.
    renderer.render({ file, fileContainer: container });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const dataUrl = await toPng(frame, {
      pixelRatio: scale,
      cacheBust: true,
      width: size.width,
      height: size.height,
    });
    const link = document.createElement("a");
    link.download = `${file.name.replace(/\.[^.]+$/, "") || "code"}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    renderer.cleanUp();
    staging.remove();
  }
}
