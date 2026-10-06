import { File, FileDiff, preloadHighlighter } from "@pierre/diffs";
import type {
  FileContents,
  BaseCodeOptions,
  FileDiffOptions,
} from "@pierre/diffs";
import { buildScreenshotDiff } from "./diff";
import { toBlob } from "html-to-image";
import { frameClasses, frameHeaderClasses, frameBodyClasses } from "./frame";
import type { WindowSize } from "./frame";
import type { CodeTheme } from "./themes";
import { themeStyle } from "./themes";

export async function exportScreenshot({
  content,
  size,
  mode,
  theme,
  scale,
  font,
  fontSize,
  showHeader,
  roundedCorners,
  showPadding,
}: {
  content:
    | { kind: "code"; file: FileContents; options: BaseCodeOptions }
    | {
        kind: "diff";
        oldFile: FileContents;
        newFile: FileContents;
        options: FileDiffOptions<undefined, undefined>;
      };
  size: WindowSize;
  mode: "dark" | "light";
  theme: CodeTheme;
  scale: number;
  font: string;
  fontSize: number;
  showHeader: boolean;
  roundedCorners: boolean;
  showPadding: boolean;
}): Promise<Blob> {
  const file = content.kind === "code" ? content.file : content.newFile;
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
  const codeContent = document.createElement("div");
  const container = document.createElement("diffs-container");
  codeContent.append(container);
  body.append(codeContent);
  if (showHeader) frame.append(header);
  frame.append(body);
  staging.append(frame);
  document.body.append(staging);
  const renderer =
    content.kind === "code"
      ? new File(content.options)
      : new FileDiff(content.options);

  try {
    // Render without an editor so carets, selections, and resize controls never enter the PNG.
    if (content.kind === "diff" && renderer instanceof FileDiff) {
      const labels = document.createElement("div");
      labels.className =
        "grid grid-cols-2 border-b border-black/8 text-xs text-secondary dark:border-white/8";
      for (const text of ["Before", "After"]) {
        const label = document.createElement("span");
        label.className =
          text === "Before"
            ? "px-5 py-2"
            : "border-l border-black/8 px-5 py-2 dark:border-white/8";
        label.textContent = text;
        labels.append(label);
      }
      body.prepend(labels);
      renderer.render({
        fileDiff: buildScreenshotDiff(content.oldFile, content.newFile),
        fileContainer: container,
      });
    } else if (content.kind === "code" && renderer instanceof File) {
      renderer.render({ file: content.file, fileContainer: container });
    }
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
