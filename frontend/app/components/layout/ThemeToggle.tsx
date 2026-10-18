import { useId } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "~/lib/theme";
import { cn } from "~/lib/cn";

/** Header icon button: flips between light and dark. */
export function ThemeToggle() {
  const { resolved, setPreference } = useTheme();
  const isDark = resolved === "dark";
  return (
    <button
      type="button"
      aria-label="Dark theme"
      aria-pressed={isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setPreference(isDark ? "light" : "dark")}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg pointer-coarse:size-11"
    >
      {/* CSS picks the icon so the server render never mismatches. */}
      <Moon aria-hidden size={18} strokeWidth={1.75} className="dark:hidden" />
      <Sun aria-hidden size={18} strokeWidth={1.75} className="hidden dark:block" />
    </button>
  );
}

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/** Three-way theme choice as a native radio group. */
export function ThemeSelect({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();
  const name = useId();
  return (
    <fieldset
      className={cn(
        "inline-flex rounded-md border border-border bg-surface p-0.5",
        className,
      )}
    >
      <legend className="sr-only">Theme</legend>
      {options.map(({ value, label, icon: Icon }) => (
        <label
          key={value}
          className={cn(
            "relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm px-2.5 text-xs font-medium text-fg-muted transition-colors pointer-coarse:h-10",
            "hover:text-fg has-checked:bg-fg has-checked:text-bg has-focus-visible:outline-2 has-focus-visible:outline-ring",
          )}
        >
          <input
            type="radio"
            name={name}
            value={value}
            checked={preference === value}
            onChange={() => setPreference(value)}
            className="sr-only"
          />
          <Icon aria-hidden size={14} strokeWidth={1.75} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
