import { useEffect, useRef, useState } from "react";
import type { ComponentProps, KeyboardEvent, PointerEvent } from "react";
import { File, EditProvider } from "@pierre/diffs/react";
import { Editor } from "@pierre/diffs/edit";
import type { BaseCodeOptions } from "@pierre/diffs";
import { Download, Minimize2, Moon, RotateCcw, Sun, WandSparkles } from "lucide-react";
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
  const [message, setMessage] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    size: WindowSize;
    zoom: number;
  } | null>(null);
  const skipped = parseSkippedLines(skip, lineCount, startLine);
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
  const preset =
    windowSizes.find(
      (item) => item.width === size.width && item.height === size.height,
    )?.name ?? "custom";

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

  function startResize(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, size, zoom };
  }

  function resize(event: PointerEvent<HTMLButtonElement>) {
    const initial = drag.current;
    if (!initial) return;
    resizeTo({
      width: initial.size.width + (event.clientX - initial.x) / initial.zoom,
      height: initial.size.height + (event.clientY - initial.y) / initial.zoom,
    });
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      !["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)
    )
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
            : 0),
      height:
        size.height +
        (event.key === "ArrowDown"
          ? step
          : event.key === "ArrowUp"
            ? -step
            : 0),
    });
  }

  async function download() {
    if (exporting || skipped.error) return;
    setExporting(true);
    setMessage("");
    try {
      await exportScreenshot({
        file: { name: filename, contents: code.current, lang: file.lang },
        size,
        mode,
        theme: palette,
        options,
        scale,
        font,
        fontSize,
        showHeader,
        roundedCorners,
        showPadding,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Export failed: ${error.message}`
          : "Export failed. Please try again.",
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
          className="flex min-w-0 justify-end px-3 pb-3 md:col-start-1 md:row-start-2"
        >
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
              </div>
            </div>
            <button
              aria-label="Resize code window"
              title="Drag to resize. Arrow keys adjust by 10 pixels; Shift adjusts by 40."
              className="absolute -right-2 -bottom-2 grid size-7 touch-none cursor-nwse-resize place-items-center rounded-md text-muted hover:bg-field hover:text-ink"
              onPointerDown={startResize}
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
              onKeyDown={resizeWithKeyboard}
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
                <input
                  aria-label="Font size"
                  type="number"
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
            <label className={labelClasses}>
              Start line
              <input
                type="number"
                min="1"
                max="999999"
                className={`${fieldClasses} w-20`}
                value={startLine}
                onChange={(event) =>
                  setStartLine(
                    Math.max(
                      1,
                      Math.min(999999, Number(event.target.value) || 1),
                    ),
                  )
                }
              />
            </label>
            <label className="block space-y-1.5 text-xs text-secondary">
              Skip lines
              <input
                className={`${fieldClasses} w-full`}
                value={skip}
                onChange={(event) => setSkip(event.target.value)}
                placeholder={`${startLine + 2}-${startLine + 4}`}
                title="Use the displayed line numbers"
                aria-invalid={!!skipped.error}
                aria-describedby={skipped.error ? "skip-error" : undefined}
              />
            </label>
            {skipped.error && (
              <p
                id="skip-error"
                role="alert"
                className="text-[11px] leading-relaxed text-red-400"
              >
                {skipped.error}
              </p>
            )}
            <label className="flex items-center gap-2 text-xs text-secondary">
              <input
                type="checkbox"
                className="size-3.5 accent-accent"
                checked={lineNumbers}
                onChange={(event) => setLineNumbers(event.target.checked)}
              />
              Line numbers
            </label>
          </section>
          <section className={sectionClasses}>
            <h2 className={headingClasses}>Window</h2>
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
              <input
                aria-label="Window width"
                type="number"
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
              <input
                aria-label="Window height"
                type="number"
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
            <button
              onClick={download}
              disabled={exporting || !!skipped.error}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent px-3 text-xs font-medium text-[#2b203e] hover:bg-[#cfbafa]"
            >
              <Download size={15} />
              {exporting ? "Exporting…" : "Export PNG"}
            </button>
            {message && (
              <p role="alert" className="text-xs text-red-400">
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
