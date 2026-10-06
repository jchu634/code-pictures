import { useEffect, useRef, useState } from "react";
import type { ComponentProps, KeyboardEvent, PointerEvent } from "react";
import { File, FileDiff, EditProvider } from "@pierre/diffs/react";
import { Editor } from "@pierre/diffs/edit";
import type { BaseCodeOptions, FileDiffOptions } from "@pierre/diffs";
import {
  ChevronDown,
  Copy,
  Download,
  Minimize2,
  Moon,
  RotateCcw,
  Sun,
  WandSparkles,
} from "lucide-react";
import { buildDiffCSS, buildScreenshotDiff } from "./diff";
import type { DiffLayout } from "./diff";
import { NumberInput } from "./NumberInput";
import { LineSettingsFields } from "./LineSettingsFields";
import { canFormat, formatCode } from "./format";
import { themes, themeStyle, themeCSS } from "./themes";
import {
  buildPreviewCSS,
  parseSkippedLines,
  sampleCode,
  fonts,
} from "./snippet";
import {
  constrainWindowSize,
  measureMinimumWindow,
  measureFittedWindow,
  windowSizes,
  frameClasses,
  frameHeaderClasses,
  frameBodyClasses,
} from "./frame";
import type { WindowSize } from "./frame";
import { exportScreenshot } from "./exportScreenshot";
import { downloadImage, imageFilename } from "./saveImage";

const createEditor: ComponentProps<typeof EditProvider>["createEditor"] = (
  type,
  options,
) => new Editor(type, options);
const languages = [
  ["typescript", "TypeScript"],
  ["tsx", "TSX"],
  ["javascript", "JavaScript"],
  ["python", "Python"],
  ["rust", "Rust"],
  ["go", "Go"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["json", "JSON"],
  ["bash", "Shell"],
  ["text", "Plain text"],
];
const fieldClasses =
  "h-8 rounded-md border border-border bg-field px-2 text-xs text-ink";
const iconClasses =
  "grid size-8 place-items-center rounded-md text-muted hover:bg-field hover:text-ink";
const labelClasses =
  "flex items-center justify-between gap-3 text-xs text-secondary";
const sectionClasses = "space-y-3 border-b border-border pb-4";
const headingClasses =
  "text-[10px] font-medium tracking-wider text-muted uppercase";

function App() {
  const [editorMode, setEditorMode] = useState<"code" | "diff">("code");
  const [diffLayout, setDiffLayout] = useState<DiffLayout>("side-by-side");
  const [before, setBefore] = useState(sampleCode);
  const [after, setAfter] = useState(
    sampleCode.replace("Hello World", "Hello there"),
  );
  const [lineTarget, setLineTarget] = useState<"synced" | "left" | "right">(
    "synced",
  );
  const diffInputs = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(144);
  const inputHeightRef = useRef(144);
  const [beforeLines, setBeforeLines] = useState({
    startLine: 1,
    skip: "",
    lineNumbers: true,
  });
  const [afterLines, setAfterLines] = useState({
    startLine: 1,
    skip: "",
    lineNumbers: true,
  });
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [theme, setTheme] = useState(themes[0]);
  const palette = theme[mode];
  const [formatting, setFormatting] = useState(false);
  const [formatError, setFormatError] = useState("");
  const formatRequest = useRef(0);
  const [filename, setFilename] = useState("example.ts");
  const [showHeader, setShowHeader] = useState(true);
  const [roundedCorners, setRoundedCorners] = useState(true);
  const [showPadding, setShowPadding] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [minimum, setMinimum] = useState<WindowSize>({ width: 1, height: 1 });
  const [file, setFile] = useState({
    name: "example.ts",
    contents: sampleCode,
    lang: "typescript",
  });
  const code = useRef(sampleCode);
  const [lineCount, setLineCount] = useState(sampleCode.split("\n").length);
  const [font, setFont] = useState("Intel One Mono");
  const [fontSize, setFontSize] = useState(14);
  const [startLine, setStartLine] = useState(1);
  const [skip, setSkip] = useState("");
  const [lineNumbers, setLineNumbers] = useState(true);
  const [scale, setScale] = useState(2);
  const [size, setSize] = useState<WindowSize>({ width: 800, height: 600 });
  const [availableWidth, setAvailableWidth] = useState(1000);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportControls = useRef<HTMLDivElement>(null);
  const exportToggle = useRef<HTMLButtonElement>(null);
  const [exportError, setExportError] = useState(false);
  const [message, setMessage] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    size: WindowSize;
    zoom: number;
    axis: "both" | "width" | "height";
  } | null>(null);
  const skipped = parseSkippedLines(skip, lineCount, startLine);
  const sharedLines = { startLine, skip, lineNumbers };
  const effectiveBefore = beforeLines;
  const effectiveAfter = afterLines;
  const beforeSkipped = parseSkippedLines(
    effectiveBefore.skip,
    before.split("\n").length,
    effectiveBefore.startLine,
  );
  const afterSkipped = parseSkippedLines(
    effectiveAfter.skip,
    after.split("\n").length,
    effectiveAfter.startLine,
  );
  const linesError =
    editorMode === "diff"
      ? beforeSkipped.error || afterSkipped.error
      : skipped.error;
  const zoom = Math.min(1, availableWidth / size.width);
  const options: BaseCodeOptions = {
    theme: palette.name,
    themeType: mode,
    disableFileHeader: true,
    disableLineNumbers: !lineNumbers,
    overflow: "wrap",
    unsafeCSS:
      buildPreviewCSS({
        font,
        fontSize,
        startLine,
        skipped: skipped.lines,
        lineCount,
      }) + themeCSS(palette),
  };
  const diffOptions: FileDiffOptions<undefined, undefined> = {
    theme: palette.name,
    themeType: mode,
    disableFileHeader: true,
    diffStyle: "split",
    expandUnchanged: true,
    hunkSeparators: "simple",
    overflow: "wrap",
    unsafeCSS:
      buildDiffCSS({
        layout: diffLayout,
        font,
        fontSize,
        before: {
          ...effectiveBefore,
          skipped: beforeSkipped.lines,
          lineCount: before.split("\n").length,
        },
        after: {
          ...effectiveAfter,
          skipped: afterSkipped.lines,
          lineCount: after.split("\n").length,
        },
      }) + themeCSS(palette),
  };
  const preset =
    windowSizes.find(
      (item) => item.width === size.width && item.height === size.height,
    )?.name ?? "custom";

  useEffect(() => {
    if (editorMode !== "diff" || !diffInputs.current) return;
    const inputs = [...diffInputs.current.querySelectorAll("textarea")];
    function syncHeight(input: HTMLElement) {
      const height = input.offsetHeight;
      if (!height || height === inputHeightRef.current) return;
      inputHeightRef.current = height;
      setInputHeight(height);
      for (const other of inputs) other.style.height = `${height}px`;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) syncHeight(entry.target);
      }
    });
    // Native textarea resizing writes an inline height. Mirror it immediately,
    // including when browser resize notifications are deferred.
    const styles = new MutationObserver((records) => {
      for (const record of records) {
        if (record.target instanceof HTMLElement) syncHeight(record.target);
      }
    });
    for (const input of inputs) {
      observer.observe(input);
      styles.observe(input, { attributes: true, attributeFilter: ["style"] });
    }
    return () => {
      observer.disconnect();
      styles.disconnect();
    };
  }, [editorMode]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    function dismiss(event: globalThis.PointerEvent) {
      if (
        event.target instanceof Node &&
        !exportControls.current?.contains(event.target)
      ) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [exportMenuOpen]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setAvailableWidth(Math.max(1, element.clientWidth - 24)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!container?.shadowRoot) return;
    let scheduled = 0;
    function measure() {
      if (!container) return;
      const measured = measureMinimumWindow(container);
      if (!measured) return;
      setMinimum((previous) =>
        previous.width === measured.width && previous.height === measured.height
          ? previous
          : measured,
      );
      setSize((previous) => {
        const next = constrainWindowSize(previous, measured);
        return previous.width === next.width && previous.height === next.height
          ? previous
          : next;
      });
    }
    function scheduleMeasure() {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(measure);
    }
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(container.shadowRoot, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    document.fonts.addEventListener("loadingdone", scheduleMeasure);
    scheduleMeasure();
    return () => {
      cancelAnimationFrame(scheduled);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      document.fonts.removeEventListener("loadingdone", scheduleMeasure);
    };
  }, [container, showHeader, showPadding]);

  function resizeTo(next: WindowSize) {
    setSize(constrainWindowSize(next, minimum));
  }

  function fitToCode() {
    if (!container) return;
    const fitted = measureFittedWindow(container);
    if (fitted) setSize(constrainWindowSize(fitted));
  }

  function reset() {
    setMode("dark");
    setTheme(themes[0]);
    setFont("Intel One Mono");
    setFontSize(14);
    setDiffLayout("side-by-side");
    setLineTarget("synced");
    setBeforeLines({ startLine: 1, skip: "", lineNumbers: true });
    setAfterLines({ startLine: 1, skip: "", lineNumbers: true });
    setStartLine(1);
    setSkip("");
    setLineNumbers(true);
    setShowHeader(true);
    setRoundedCorners(true);
    setShowPadding(false);
    setScale(2);
    setSize({ width: 800, height: 600 });
    setMessage("");
    setFormatError("");
  }

  async function prettyPrint() {
    if (formatting || !canFormat(file.lang)) return;
    if (editorMode === "diff") {
      const originalBefore = before;
      const originalAfter = after;
      const request = ++formatRequest.current;
      setFormatting(true);
      setFormatError("");
      try {
        const [formattedBefore, formattedAfter] = await Promise.all([
          formatCode(before, file.lang),
          formatCode(after, file.lang),
        ]);
        if (request !== formatRequest.current) return;
        setBefore((current) =>
          current === originalBefore ? formattedBefore : current,
        );
        setAfter((current) =>
          current === originalAfter ? formattedAfter : current,
        );
      } catch (error) {
        if (request === formatRequest.current)
          setFormatError(
            error instanceof Error
              ? error.message
              : "Could not format this code.",
          );
      } finally {
        setFormatting(false);
      }
      return;
    }
    const contents = code.current;
    const language = file.lang;
    const request = ++formatRequest.current;
    setFormatting(true);
    setFormatError("");
    try {
      const formatted = await formatCode(contents, language);
      // Don't replace edits or a language change made while the formatter loads.
      if (request !== formatRequest.current || code.current !== contents)
        return;
      code.current = formatted;
      setLineCount(formatted.split("\n").length);
      setFile({ name: filename, contents: formatted, lang: language });
    } catch (error) {
      if (request === formatRequest.current) {
        setFormatError(
          error instanceof Error
            ? error.message
            : "Could not format this code.",
        );
      }
    } finally {
      setFormatting(false);
    }
  }

  function startResize(
    event: PointerEvent<HTMLButtonElement>,
    axis: "both" | "width" | "height" = "both",
  ) {
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, size, zoom, axis };
  }

  function resize(event: PointerEvent<HTMLButtonElement>) {
    const initial = drag.current;
    if (!initial) return;
    resizeTo({
      width:
        initial.size.width +
        (initial.axis === "height"
          ? 0
          : ((event.clientX - initial.x) / initial.zoom) *
            (initial.axis === "width" ? -1 : 1)),
      height:
        initial.size.height +
        (initial.axis === "width"
          ? 0
          : (event.clientY - initial.y) / initial.zoom),
    });
  }

  function resizeWithKeyboard(
    event: KeyboardEvent<HTMLButtonElement>,
    axis: "both" | "width" | "height" = "both",
  ) {
    if (
      !["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    if (axis === "width" && !["ArrowLeft", "ArrowRight"].includes(event.key))
      return;
    if (axis === "height" && !["ArrowUp", "ArrowDown"].includes(event.key))
      return;
    event.preventDefault();
    const step = event.shiftKey ? 40 : 10;
    resizeTo({
      width:
        size.width +
        (event.key === "ArrowRight"
          ? step
          : event.key === "ArrowLeft"
            ? -step
            : 0) *
          (axis === "width" ? -1 : 1),
      height:
        size.height +
        (event.key === "ArrowDown"
          ? step
          : event.key === "ArrowUp"
            ? -step
            : 0),
    });
  }

  async function download(action: "save-as" | "save" | "copy") {
    if (exporting || linesError) return;
    setExportMenuOpen(false);

    setExporting(true);
    setMessage("");
    setExportError(false);
    try {
      const name = imageFilename(filename);
      // Open the picker before rendering so the click's user activation is retained.
      const handle =
        action === "save-as" && window.showSaveFilePicker
          ? await window.showSaveFilePicker({
              suggestedName: name,
              types: [
                { description: "PNG image", accept: { "image/png": [".png"] } },
              ],
            })
          : null;
      if (
        action === "copy" &&
        (!navigator.clipboard?.write || typeof ClipboardItem === "undefined")
      ) {
        throw new Error(
          "Copying images is not available in this browser. Use Save instead.",
        );
      }
      const image = exportScreenshot({
        content:
          editorMode === "diff"
            ? {
                kind: "diff",
                layout: diffLayout,
                oldFile: { name: filename, contents: before, lang: file.lang },
                newFile: { name: filename, contents: after, lang: file.lang },
                options: diffOptions,
              }
            : {
                kind: "code",
                file: {
                  name: filename,
                  contents: code.current,
                  lang: file.lang,
                },
                options,
              },
        size,
        mode,
        theme: palette,
        scale,
        font,
        fontSize,
        showHeader,
        roundedCorners,
        showPadding,
      });
      if (action === "copy") {
        // Pass the render promise directly to preserve clipboard activation in Safari.
        await Promise.all([
          navigator.clipboard.write([
            new ClipboardItem({ "image/png": image }),
          ]),
          image,
        ]);
        setMessage("Image copied to clipboard.");
      } else if (handle) {
        const blob = await image;
        const writable = await handle.createWritable();
        try {
          await writable.write(blob);
          await writable.close();
        } catch (error) {
          await writable.abort().catch(() => {});
          throw error;
        }
      } else {
        downloadImage(await image, name);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setExportError(true);
      setMessage(
        error instanceof Error
          ? `${action === "copy" ? "Copy" : "Save"} failed: ${error.message}`
          : "Could not export the image. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <main
      className={`${mode} min-h-screen bg-canvas px-4 py-6 text-ink sm:p-8 lg:py-12`}
    >
      <div className="mx-auto grid max-w-362.5 grid-cols-1 items-start gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_250px]">
        <div
          role="toolbar"
          aria-label="Editor controls"
          className="mr-3 flex w-fit max-w-full flex-wrap items-center justify-end gap-2 justify-self-end p-1.5 md:col-start-1 md:row-start-1"
        >
          <select
            aria-label="Language"
            className={`${fieldClasses} w-32`}
            value={file.lang}
            onChange={(event) => {
              formatRequest.current++;
              setFormatError("");
              setFile({
                name: filename,
                contents: code.current,
                lang: event.target.value,
              });
            }}
          >
            {languages.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Theme"
            className={`${fieldClasses} w-28`}
            value={theme.label}
            onChange={(event) => {
              const next = themes.find(
                (item) => item.label === event.target.value,
              );
              if (next) setTheme(next);
            }}
          >
            {themes.map((item) => (
              <option key={item.label}>{item.label}</option>
            ))}
          </select>
          <div
            role="group"
            aria-label="Editor mode"
            className="flex gap-0.5 rounded-md bg-field p-0.5"
          >
            {(["code", "diff"] satisfies ("code" | "diff")[]).map((next) => (
              <button
                key={next}
                aria-pressed={editorMode === next}
                className={`h-8 rounded-md px-3 text-xs ${editorMode === next ? "bg-border text-ink" : "text-muted hover:text-ink"}`}
                onClick={() => {
                  if (next === editorMode) return;
                  formatRequest.current++;
                  setFormatError("");
                  if (next === "diff")
                    setFile((current) => ({
                      ...current,
                      contents: code.current,
                    }));
                  setEditorMode(next);
                }}
              >
                {next === "code" ? "Code" : "Diffs"}
              </button>
            ))}
          </div>
          <div className="flex gap-0.5 rounded-md bg-field p-0.5">
            <button
              aria-label="Light mode"
              aria-pressed={mode === "light"}
              title="Light mode"
              className={`${iconClasses} ${mode === "light" ? "bg-border text-ink" : ""}`}
              onClick={() => setMode("light")}
            >
              <Sun size={15} />
            </button>
            <button
              aria-label="Dark mode"
              aria-pressed={mode === "dark"}
              title="Dark mode"
              className={`${iconClasses} ${mode === "dark" ? "bg-border text-ink" : ""}`}
              onClick={() => setMode("dark")}
            >
              <Moon size={15} />
            </button>
          </div>
          <button
            className={iconClasses}
            aria-label="Format code"
            title={
              canFormat(file.lang)
                ? "Format code"
                : "Formatting is not available for this language"
            }
            disabled={formatting || !canFormat(file.lang)}
            aria-busy={formatting}
            onClick={prettyPrint}
          >
            <WandSparkles size={15} />
          </button>
          <button
            className={iconClasses}
            aria-label="Fit window to code"
            title="Fit window to code"
            disabled={!container}
            onClick={fitToCode}
          >
            <Minimize2 size={15} />
          </button>
          <button
            className={iconClasses}
            aria-label="Reset appearance"
            title="Reset appearance"
            onClick={reset}
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <div
          ref={stage}
          className="flex min-w-0 flex-col items-end gap-3 px-3 pb-3 md:col-start-1 md:row-start-2"
        >
          {editorMode === "diff" && (
            <div ref={diffInputs} className="grid w-full grid-cols-2 gap-3">
              {[
                { label: "Before", value: before, update: setBefore },
                { label: "After", value: after, update: setAfter },
              ].map((side) => (
                <label
                  key={side.label}
                  className="space-y-1.5 text-xs text-secondary"
                >
                  <span>{side.label}</span>
                  <textarea
                    aria-label={`${side.label} code`}
                    spellCheck={false}
                    style={{ height: inputHeight }}
                    className="block min-h-20 w-full resize-y rounded-md border border-border bg-field p-3 font-mono text-xs text-ink"
                    value={side.value}
                    onChange={(event) => {
                      formatRequest.current++;
                      setFormatError("");
                      side.update(event.target.value);
                    }}
                  />
                </label>
              ))}
            </div>
          )}
          <div
            className="relative shrink-0"
            style={{ width: size.width, height: size.height, zoom }}
          >
            <div
              data-code-window
              style={themeStyle(palette)}
              className={`${frameClasses} ${roundedCorners ? "rounded-lg" : "rounded-none"} h-full w-full`}
            >
              {showHeader && (
                <div data-code-header className={frameHeaderClasses}>
                  <input
                    aria-label="Filename"
                    className="m-0 h-full w-full truncate border-0 bg-transparent p-0 text-xs text-inherit `-outline-offset-4"
                    value={filename}
                    onChange={(event) => setFilename(event.target.value)}
                    placeholder="untitled"
                  />
                </div>
              )}
              <div
                data-code-body
                className={`${frameBodyClasses} ${showPadding ? "py-3" : "py-0"} overflow-hidden`}
              >
                {editorMode === "diff" ? (
                  <>
                    {diffLayout === "side-by-side" && (
                      <div className="grid grid-cols-2 border-b border-black/8 text-xs text-secondary dark:border-white/8">
                        <span className="px-5 py-2">Before</span>
                        <span className="border-l border-black/8 px-5 py-2 dark:border-white/8">
                          After
                        </span>
                      </div>
                    )}
                    <FileDiff
                      fileDiff={buildScreenshotDiff(
                        { name: filename, contents: before, lang: file.lang },
                        { name: filename, contents: after, lang: file.lang },
                      )}
                      options={{ ...diffOptions, onPostRender: setContainer }}
                    />
                  </>
                ) : (
                  <EditProvider createEditor={createEditor}>
                    <File
                      file={file}
                      edit
                      options={{ ...options, onPostRender: setContainer }}
                      onEditChange={(event) => {
                        formatRequest.current++;
                        setFormatError("");
                        code.current = event.file.contents;
                        setLineCount(event.file.contents.split("\n").length);
                      }}
                    />
                  </EditProvider>
                )}
              </div>
            </div>
            {(["width", "height"] satisfies ("width" | "height")[]).map(
              (axis) => (
                <button
                  key={axis}
                  aria-label={`Resize window ${axis}`}
                  title={`Drag to resize ${axis}. ${axis === "width" ? "Left/Right" : "Up/Down"} arrow keys adjust by 10 pixels; Shift adjusts by 40.`}
                  className={`absolute grid size-8 touch-none place-items-center rounded-md text-muted hover:bg-field hover:text-ink ${axis === "width" ? "-left-4 top-1/2 -translate-y-1/2 cursor-ew-resize" : "-bottom-4 left-1/2 -translate-x-1/2 cursor-ns-resize"}`}
                  onPointerDown={(event) => startResize(event, axis)}
                  onPointerMove={resize}
                  onPointerUp={() => {
                    drag.current = null;
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                  }}
                  onLostPointerCapture={() => {
                    drag.current = null;
                  }}
                  onKeyDown={(event) => resizeWithKeyboard(event, axis)}
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d={
                        axis === "width" ? "M6 3v10M10 3v10" : "M3 6h10M3 10h10"
                      }
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              ),
            )}
            <button
              aria-label="Resize code window"
              title="Drag to resize. Arrow keys adjust by 10 pixels; Shift adjusts by 40."
              className="absolute -right-2 -bottom-2 grid size-7 touch-none cursor-nwse-resize place-items-center rounded-md text-muted hover:bg-field hover:text-ink"
              onPointerDown={(event) => startResize(event)}
              onPointerMove={resize}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
              onLostPointerCapture={() => {
                drag.current = null;
              }}
              onKeyDown={(event) => resizeWithKeyboard(event)}
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M4 12 12 4M8 12l4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <aside
          aria-label="Screenshot settings"
          className="space-y-4 rounded-xl border border-border bg-panel p-4 md:col-start-2 md:row-start-2"
        >
          {formatError && (
            <p
              role="alert"
              className="whitespace-pre-wrap text-xs text-red-400"
            >
              {formatError}
            </p>
          )}
          <section className={sectionClasses}>
            <h2 className={headingClasses}>Font</h2>
            <label className="block space-y-1.5 text-xs text-secondary">
              <span className="sr-only">Font family</span>
              <select
                className={`${fieldClasses} w-full`}
                value={font}
                onChange={(event) => setFont(event.target.value)}
              >
                {fonts.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className={labelClasses}>
              Font size
              <div className="flex items-center gap-1.5">
                <NumberInput
                  aria-label="Font size"
                  onWheelValue={(value) => setFontSize(value)}
                  min="11"
                  max="24"
                  className={`${fieldClasses} w-16`}
                  value={fontSize}
                  onChange={(event) =>
                    setFontSize(
                      Math.max(
                        11,
                        Math.min(24, Number(event.target.value) || 11),
                      ),
                    )
                  }
                />
                <span className="text-muted">px</span>
              </div>
            </label>
          </section>
          <section className={sectionClasses}>
            <h2 className={headingClasses}>Lines</h2>
            {editorMode === "diff" && (
              <div
                role="group"
                aria-label="Line settings target"
                className="flex rounded-md bg-field p-0.5"
              >
                {(
                  ["synced", "left", "right"] satisfies (
                    "synced" | "left" | "right"
                  )[]
                ).map((target) => (
                  <button
                    key={target}
                    aria-pressed={lineTarget === target}
                    className={`h-8 flex-1 rounded-md text-xs ${lineTarget === target ? "bg-border text-ink" : "text-muted hover:text-ink"}`}
                    onClick={() => {
                      if (target === "synced" && lineTarget !== "synced") {
                        const settings =
                          lineTarget === "left" ? beforeLines : afterLines;
                        setBeforeLines(settings);
                        setAfterLines(settings);
                      }
                      setLineTarget(target);
                    }}
                  >
                    {target === "synced"
                      ? "Synced"
                      : target === "left"
                        ? "Left"
                        : "Right"}
                  </button>
                ))}
              </div>
            )}
            {editorMode === "diff" ? (
              <LineSettingsFields
                settings={lineTarget === "right" ? afterLines : beforeLines}
                onChange={(next) => {
                  if (lineTarget !== "right") setBeforeLines(next);
                  if (lineTarget !== "left") setAfterLines(next);
                }}
                error={
                  lineTarget === "synced"
                    ? linesError
                    : lineTarget === "left"
                      ? beforeSkipped.error
                      : afterSkipped.error
                }
              />
            ) : (
              <LineSettingsFields
                settings={sharedLines}
                onChange={(next) => {
                  setStartLine(next.startLine);
                  setSkip(next.skip);
                  setLineNumbers(next.lineNumbers);
                }}
                error={skipped.error}
              />
            )}
          </section>
          <section className={sectionClasses}>
            <h2 className={headingClasses}>Window</h2>
            {editorMode === "diff" && (
              <label className={labelClasses}>
                <span>Stack diffs vertically</span>
                <input
                  type="checkbox"
                  className="size-3.5 accent-accent"
                  checked={diffLayout === "stacked"}
                  onChange={(event) =>
                    setDiffLayout(
                      event.target.checked ? "stacked" : "side-by-side",
                    )
                  }
                />
              </label>
            )}
            <select
              aria-label="Window size preset"
              className={`${fieldClasses} w-full`}
              value={preset}
              onChange={(event) => {
                const next = windowSizes.find(
                  (item) => item.name === event.target.value,
                );
                if (next) resizeTo(next);
              }}
            >
              <option value="custom" disabled>
                Custom size
              </option>
              {windowSizes.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-xs text-muted">
              <NumberInput
                aria-label="Window width"
                onWheelValue={(value) => resizeTo({ ...size, width: value })}
                min={minimum.width}
                max={Math.max(2400, minimum.width)}
                className={`${fieldClasses} min-w-0 w-0 flex-1`}
                value={size.width}
                onChange={(event) =>
                  resizeTo({
                    ...size,
                    width: Number(event.target.value) || 1,
                  })
                }
              />
              <span>×</span>
              <NumberInput
                aria-label="Window height"
                onWheelValue={(value) => resizeTo({ ...size, height: value })}
                min={minimum.height}
                max={Math.max(1600, minimum.height)}
                className={`${fieldClasses} min-w-0 w-0 flex-1`}
                value={size.height}
                onChange={(event) =>
                  resizeTo({
                    ...size,
                    height: Number(event.target.value) || 1,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-secondary">
              <input
                type="checkbox"
                className="size-3.5 accent-accent"
                checked={showHeader}
                onChange={(event) => setShowHeader(event.target.checked)}
              />
              Filename header
            </label>
            <label className="flex items-center gap-2 text-xs text-secondary">
              <input
                type="checkbox"
                className="size-3.5 accent-accent"
                checked={roundedCorners}
                onChange={(event) => setRoundedCorners(event.target.checked)}
              />
              Rounded corners
            </label>
            <label className="flex items-center gap-2 text-xs text-secondary">
              <input
                type="checkbox"
                className="size-3.5 accent-accent"
                checked={showPadding}
                onChange={(event) => setShowPadding(event.target.checked)}
              />
              Padding
            </label>
            {!showHeader && (
              <label className="block space-y-1.5 text-xs text-secondary">
                Filename
                <input
                  className={`${fieldClasses} w-full`}
                  value={filename}
                  onChange={(event) => setFilename(event.target.value)}
                />
              </label>
            )}
          </section>
          <section className="space-y-3">
            <h2 className={headingClasses}>Export</h2>
            <label className={labelClasses}>
              Resolution
              <select
                className={`${fieldClasses} w-20`}
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
              >
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={3}>3×</option>
              </select>
            </label>
            <div
              ref={exportControls}
              className="relative"
              onBlur={(event) => {
                if (
                  event.relatedTarget instanceof Node &&
                  !event.currentTarget.contains(event.relatedTarget)
                ) {
                  setExportMenuOpen(false);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && exportMenuOpen) {
                  event.preventDefault();
                  setExportMenuOpen(false);
                  exportToggle.current?.focus();
                }
              }}
            >
              <div className="flex">
                <button
                  onClick={() => download("save-as")}
                  disabled={exporting || !!linesError}
                  aria-busy={exporting}
                  className="flex h-9 flex-1 items-center justify-center gap-2 rounded-l-md bg-accent px-3 text-xs font-medium text-[#2b203e] hover:bg-[#cfbafa]"
                >
                  <Download size={15} />
                  {exporting ? "Exporting…" : "Save as"}
                </button>
                <button
                  ref={exportToggle}
                  aria-label="Export options"
                  aria-expanded={exportMenuOpen}
                  aria-controls="export-options"
                  disabled={exporting || !!linesError}
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="grid h-9 w-9 place-items-center rounded-r-md border-l border-[#2b203e]/20 bg-accent text-[#2b203e] hover:bg-[#cfbafa]"
                >
                  <ChevronDown size={15} />
                </button>
              </div>
              {exportMenuOpen && (
                <div
                  id="export-options"
                  className="absolute right-0 bottom-full z-10 mb-1 w-full rounded-md border border-border bg-panel p-1 shadow-lg"
                >
                  <button
                    onClick={() => download("save-as")}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs hover:bg-field"
                  >
                    <Download size={15} /> Save as
                  </button>
                  <button
                    onClick={() => download("save")}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs hover:bg-field"
                  >
                    <Download size={15} /> Save
                  </button>
                  <button
                    onClick={() => download("copy")}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs hover:bg-field"
                  >
                    <Copy size={15} /> Copy image
                  </button>
                </div>
              )}
            </div>
            {message && (
              <p
                role={exportError ? "alert" : "status"}
                className={`text-xs ${exportError ? "text-red-400" : "text-secondary"}`}
              >
                {message}
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

export default App;
