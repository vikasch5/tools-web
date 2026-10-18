import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "~/lib/cn";

const control =
  "h-10 w-full min-w-0 rounded-md border border-border bg-bg px-3 text-sm text-fg shadow-sm transition-colors " +
  "placeholder:text-fg-subtle hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 " +
  "disabled:opacity-50 aria-invalid:border-danger pointer-coarse:h-11";

function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-fg-muted">
        {children}
      </label>
      {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
    </span>
  );
}

/** Labelled text or number input. */
export function TextField({
  label,
  hint,
  suffix,
  className,
  id,
  ...rest
}: { label: ReactNode; hint?: ReactNode; suffix?: ReactNode } & ComponentPropsWithoutRef<"input">) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>
      <div className="relative">
        <input id={inputId} className={cn(control, suffix ? "pr-10" : undefined)} {...rest} />
        {suffix && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-fg-subtle"
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/** Labelled native select. */
export function SelectField({
  label,
  hint,
  className,
  id,
  children,
  ...rest
}: { label: ReactNode; hint?: ReactNode } & ComponentPropsWithoutRef<"select">) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={selectId} hint={hint}>
        {label}
      </Label>
      <div className="relative">
        <select id={selectId} className={cn(control, "appearance-none pr-9")} {...rest}>
          {children}
        </select>
        <ChevronDown
          aria-hidden
          size={16}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-subtle"
        />
      </div>
    </div>
  );
}

/** Labelled range slider with its current value shown. */
export function RangeField({
  label,
  valueText,
  className,
  id,
  ...rest
}: { label: ReactNode; valueText: ReactNode } & Omit<ComponentPropsWithoutRef<"input">, "type">) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={inputId} hint={<span className="font-mono tabular-nums">{valueText}</span>}>
        {label}
      </Label>
      <input
        id={inputId}
        type="range"
        className="h-6 w-full cursor-pointer accent-fg pointer-coarse:h-11"
        {...rest}
      />
    </div>
  );
}

/** Multi-line labelled textarea. */
export function TextAreaField({
  label,
  hint,
  className,
  id,
  ...rest
}: { label: ReactNode; hint?: ReactNode } & ComponentPropsWithoutRef<"textarea">) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>
      <textarea
        id={inputId}
        className={cn(control, "h-auto min-h-24 py-2 font-mono leading-relaxed")}
        spellCheck={false}
        {...rest}
      />
    </div>
  );
}
