import { File, preloadHighlighter } from "@pierre/diffs";
import type { FileContents, BaseCodeOptions } from "@pierre/diffs";
import { toBlob } from "html-to-image";
import { frameClasses, frameHeaderClasses, frameBodyClasses } from "./frame";
import type { WindowSize } from "./frame";
import type { CodeTheme } from "./themes";
import { themeStyle } from "./themes";

export async function exportScreenshot({
  file,
  size,
  mode,
  theme,
  options,
  scale,
  font,
  fontSize,
  showHeader,
  roundedCorners,
  showPadding,
}: {
  file: FileContents;
  size: WindowSize;
  mode: "dark" | "light";
  theme: CodeTheme;
  options: BaseCodeOptions;
  scale: number;
  font: string;
  fontSize: number;
  showHeader: boolean;
  roundedCorners: boolean;
  showPadding: boolean;
}): Promise<Blob> {
  await preloadHighlighter({
    themes: [theme.name],
    langs: [file.lang ?? "text"],
  });
  await document.fonts.load(`${fontSize}px "${font}"`);
  await document.fonts.ready;

  const staging = document.createElement("div");
  staging.style.cssText =
    "position:fixed;left:-100000px;top:0;pointer-events:none";
  staging.setAttribute("aria-hidden", "true");
  const frame = document.createElement("div");
  frame.className = `${mode} ${frameClasses} ${roundedCorners ? "rounded-lg" : "rounded-none"}`;
  frame.style.width = `${size.width}px`;
  frame.style.height = `${size.height}px`;
  for (const [property, value] of Object.entries(themeStyle(theme))) {
    frame.style.setProperty(property, value);
  }
  const header = document.createElement("div");
  header.className = `${frameHeaderClasses} truncate`;
  header.textContent = file.name || "untitled";
  const body = document.createElement("div");
  body.className = `${frameBodyClasses} ${showPadding ? "py-3" : "py-0"} overflow-hidden`;
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
    const blob = await toBlob(frame, {
      pixelRatio: scale,
      cacheBust: true,
      width: size.width,
      height: size.height,
    });
    if (!blob) throw new Error("Could not create the PNG image.");
    return blob;
  } finally {
    renderer.cleanUp();
    staging.remove();
  }
}
