import { useRef } from "react";
import { GripHorizontal } from "lucide-react";

const MIN = 160;
const MAX = 2400;
const STEP = 48;

export const clampPaneHeight = (px: number) =>
  Math.round(Math.min(MAX, Math.max(MIN, px)));

/**
 * Horizontal drag handle that resizes the editor panes (ARIA window
 * splitter). Works with mouse, touch and keyboard (Arrow keys; Home or
 * double-click resets to the automatic height).
 */
export function PaneResizer({
  value,
  measure,
  onChange,
  controls,
}: {
  /** Current height in px, or null when automatic. */
  value: number | null;
  /** Reads the current rendered pane height (used when value is null). */
  measure: () => number;
  onChange: (height: number | null) => void;
  controls: string;
}) {
  const drag = useRef<{ startY: number; startHeight: number } | null>(null);
  const current = () => value ?? measure();

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize editor height"
      aria-controls={controls}
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={Math.round(value ?? 0) || undefined}
      tabIndex={0}
      title="Drag to resize. Double-click to reset."
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { startY: event.clientY, startHeight: current() };
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const delta = event.clientY - drag.current.startY;
        onChange(clampPaneHeight(drag.current.startHeight + delta));
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onDoubleClick={() => onChange(null)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown")
          onChange(clampPaneHeight(current() + STEP));
        else if (event.key === "ArrowUp")
          onChange(clampPaneHeight(current() - STEP));
        else if (event.key === "Home") onChange(null);
        else return;
        event.preventDefault();
      }}
      className="group flex h-3 shrink-0 cursor-row-resize touch-none items-center justify-center border-t border-border bg-surface-2/50 outline-none hover:bg-accent-soft focus-visible:bg-accent-soft pointer-coarse:h-6"
    >
      <GripHorizontal
        aria-hidden
        size={16}
        className="text-fg-subtle transition-colors group-hover:text-accent-fg group-focus-visible:text-accent-fg"
      />
    </div>
  );
}
