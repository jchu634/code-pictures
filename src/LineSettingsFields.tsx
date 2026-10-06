import { useState } from "react";

export type LineSettings = {
  startLine: number;
  skip: string;
  lineNumbers: boolean;
};

export function LineSettingsFields({
  label,
  settings,
  onChange,
  error,
}: {
  label?: string;
  settings: LineSettings;
  onChange: (settings: LineSettings) => void;
  error: string | null;
}) {
  const [startLineDraft, setStartLineDraft] = useState<string | null>(null);
  const field =
    "h-8 rounded-md border border-border bg-field px-2 text-xs text-ink";
  const errorId = `skip-error-${label ?? "shared"}`;
  return (
    <fieldset className="space-y-3">
      {label && (
        <legend className="mb-2 text-xs text-secondary">{label}</legend>
      )}
      <label className="flex items-center justify-between gap-3 text-xs text-secondary">
        Start line
        <input
          aria-label={label ? `${label} start line` : "Start line"}
          type="number"
          min="1"
          max="999999"
          className={`${field} w-20`}
          value={startLineDraft ?? settings.startLine}
          onFocus={(event) => setStartLineDraft(event.target.value)}
          onChange={(event) => {
            setStartLineDraft(event.target.value);
            const number = event.target.valueAsNumber;
            if (Number.isInteger(number) && number >= 1 && number <= 999999) {
              onChange({ ...settings, startLine: number });
            }
          }}
          onBlur={(event) => {
            const number = event.target.valueAsNumber;
            onChange({
              ...settings,
              startLine: Number.isFinite(number)
                ? Math.max(1, Math.min(999999, Math.trunc(number)))
                : 1,
            });
            setStartLineDraft(null);
          }}
        />
      </label>
      <label className="block space-y-1.5 text-xs text-secondary">
        Skip lines
        <input
          aria-label={label ? `${label} skip lines` : "Skip lines"}
          className={`${field} w-full`}
          value={settings.skip}
          onChange={(event) =>
            onChange({ ...settings, skip: event.target.value })
          }
          placeholder={`${settings.startLine + 2}-${settings.startLine + 4}`}
          title="Use the displayed line numbers"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </label>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[11px] leading-relaxed text-red-400"
        >
          {error}
        </p>
      )}
      <label className="flex items-center gap-2 text-xs text-secondary">
        <input
          aria-label={label ? `${label} line numbers` : "Line numbers"}
          type="checkbox"
          className="size-3.5 accent-accent"
          checked={settings.lineNumbers}
          onChange={(event) =>
            onChange({ ...settings, lineNumbers: event.target.checked })
          }
        />
        Line numbers
      </label>
    </fieldset>
  );
}
