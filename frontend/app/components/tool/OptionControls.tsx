import { useId } from "react";
import type { ToolOption, ToolOptionValues } from "~/tools/types";
import { cn } from "~/lib/cn";

/** Renders a tool's options as native radio groups and switches. */
export function OptionControls({
  options,
  values,
  onChange,
}: {
  options: ToolOption[];
  values: ToolOptionValues;
  onChange: (id: string, value: string | boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {options.map((option) =>
        option.type === "segmented" ? (
          <Segmented
            key={option.id}
            label={option.label}
            choices={option.choices}
            value={String(values[option.id] ?? option.default)}
            onChange={(value) => onChange(option.id, value)}
          />
        ) : (
          <Switch
            key={option.id}
            label={option.label}
            checked={Boolean(values[option.id] ?? option.default)}
            onChange={(checked) => onChange(option.id, checked)}
          />
        ),
      )}
    </div>
  );
}

export function Segmented({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="flex items-center gap-2.5">
      <legend className="label-mono float-left mr-2.5 text-fg-subtle">
        {label}
      </legend>
      <div className="inline-flex rounded-md border border-border bg-bg p-0.5">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center rounded-sm px-2.5 text-[0.8125rem] font-medium text-fg-muted transition-colors pointer-coarse:h-9",
              "hover:text-fg has-checked:bg-surface has-checked:text-fg has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-ring",
            )}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="sr-only"
            />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-8 cursor-pointer items-center gap-2.5 text-[0.8125rem] font-medium text-fg-muted hover:text-fg pointer-coarse:min-h-11">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked ? "border-fg bg-fg" : "border-border-strong bg-surface",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-3.5 rounded-full transition-transform duration-150",
            checked
              ? "translate-x-[1.0625rem] bg-bg"
              : "translate-x-0.5 bg-border-strong",
          )}
        />
      </button>
      {label}
    </label>
  );
}
