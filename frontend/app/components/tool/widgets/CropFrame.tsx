import { useRef } from "react";
import type { Rect, Size } from "~/tools/engine/image-geometry";

export type Offset = { x: number; y: number };

const clamp = (n: number) => Math.min(1, Math.max(-1, n));

/**
 * Preview of a crop: the photo can be dragged, or moved with the arrow
 * keys, inside a frame of the output's shape. `offset` runs from -1 to 1
 * on each axis (see coverCrop).
 */
export function CropFrame({
  url,
  source,
  crop,
  ratio,
  offset,
  onOffset,
  label,
  guides = "none",
  className = "max-w-72",
  filter,
}: {
  url: string;
  source: Size;
  crop: Rect;
  /** Output width / height, as CSS aspect-ratio parts. */
  ratio: { width: number; height: number };
  offset: Offset;
  onOffset: (next: Offset) => void;
  label: string;
  guides?: "face" | "none";
  className?: string;
  /** CSS filter for the preview, e.g. to approximate a clean-up. */
  filter?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  /** Pixels on screen per unit of offset, for dragging. */
  const offsetPerPx = () => {
    const frame = frameRef.current;
    if (!frame) return { x: 0, y: 0 };
    const scale = frame.clientWidth / crop.width;
    const spareX = ((source.width - crop.width) / 2) * scale;
    const spareY = ((source.height - crop.height) / 2) * scale;
    return { x: spareX ? 1 / spareX : 0, y: spareY ? 1 / spareY : 0 };
  };

  return (
    <div
      ref={frameRef}
      tabIndex={0}
      role="img"
      aria-label={`${label}. Use arrow keys to move the photo.`}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 0.1 : 0.02;
        const moves: Record<string, [number, number]> = {
          ArrowLeft: [step, 0],
          ArrowRight: [-step, 0],
          ArrowUp: [0, step],
          ArrowDown: [0, -step],
        };
        const move = moves[event.key];
        if (move) {
          event.preventDefault();
          onOffset({ x: clamp(offset.x + move[0]), y: clamp(offset.y + move[1]) });
        }
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const per = offsetPerPx();
        onOffset({
          x: clamp(drag.current.ox - (event.clientX - drag.current.x) * per.x),
          y: clamp(drag.current.oy - (event.clientY - drag.current.y) * per.y),
        });
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      className={`relative w-full cursor-grab touch-none overflow-hidden bg-white shadow-lg ring-1 ring-border select-none active:cursor-grabbing ${className}`}
      style={{ aspectRatio: `${ratio.width} / ${ratio.height}` }}
    >
      <img
        src={url}
        alt=""
        draggable={false}
        className="pointer-events-none absolute max-w-none"
        style={{
          width: `${(source.width / crop.width) * 100}%`,
          height: `${(source.height / crop.height) * 100}%`,
          left: `${(-crop.x / crop.width) * 100}%`,
          top: `${(-crop.y / crop.height) * 100}%`,
          filter,
        }}
      />
      {guides === "face" && (
        // Alignment guides: preview only, not in the download.
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-[22%] top-[10%] bottom-[18%] rounded-[50%] border-2 border-dashed border-white/80 mix-blend-difference" />
          <div className="absolute inset-x-0 top-[40%] border-t border-white/70 mix-blend-difference" />
          <div className="absolute inset-x-0 bottom-[18%] border-t border-white/70 mix-blend-difference" />
        </div>
      )}
    </div>
  );
}
