import type { Category, CategoryHue } from "~/data/categories";
import { cn } from "~/lib/cn";

// Literal class strings so Tailwind can see them.
const hues: Record<CategoryHue, string> = {
  dev: "bg-cat-dev-soft text-cat-dev",
  pdf: "bg-cat-pdf-soft text-cat-pdf",
  image: "bg-cat-image-soft text-cat-image",
  text: "bg-cat-text-soft text-cat-text",
  convert: "bg-cat-convert-soft text-cat-convert",
  design: "bg-cat-design-soft text-cat-design",
  generate: "bg-cat-generate-soft text-cat-generate",
  calc: "bg-cat-calc-soft text-cat-calc",
};

const sizes = {
  sm: { box: "size-8 rounded-sm", icon: 16 },
  md: { box: "size-10 rounded-md", icon: 19 },
  lg: { box: "size-12 rounded-lg", icon: 22 },
};

/** Decorative tinted icon tile for a category. */
export function CategoryIcon({
  category,
  size = "md",
  className,
}: {
  category: Pick<Category, "icon" | "hue">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const Icon = category.icon;
  const s = sizes[size];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center ring-1 ring-current/10 ring-inset",
        hues[category.hue],
        s.box,
        className,
      )}
    >
      <Icon size={s.icon} strokeWidth={1.75} />
    </span>
  );
}
