import { lazy, Suspense, type ComponentType } from "react";
import type { WidgetId } from "~/tools/types";

const load = <K extends string>(factory: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => factory().then((m) => ({ default: m[name] })));

/** Each tool panel is its own chunk, so a page only downloads its own UI. */
const widgets: Record<WidgetId, ComponentType> = {
  "word-counter": load(() => import("./WordCounter"), "WordCounter"),
  "diff-checker": load(() => import("./DiffChecker"), "DiffChecker"),
  "uuid-generator": load(() => import("./UuidGenerator"), "UuidGenerator"),
  "gradient-generator": load(() => import("./GradientGenerator"), "GradientGenerator"),
  "percentage-calculator": load(() => import("./PercentageCalculator"), "PercentageCalculator"),
  "compress-image": load(() => import("./CompressImage"), "CompressImage"),
  "resize-image": load(() => import("./ResizeImage"), "ResizeImage"),
  "passport-photo": load(() => import("./PassportPhoto"), "PassportPhoto"),
  "merge-pdf": load(() => import("./MergePdf"), "MergePdf"),
  "split-pdf": load(() => import("./SplitPdf"), "SplitPdf"),
  "rotate-pdf": load(() => import("./RotatePdf"), "RotatePdf"),
  "image-converter": load(() => import("./ImageConverter"), "ImageConverter"),
};

export function ToolWidget({ id }: { id: WidgetId }) {
  const Widget = widgets[id];
  return (
    <Suspense
      fallback={
        <div
          aria-busy
          className="flex min-h-80 items-center justify-center rounded-xl border border-border bg-surface text-sm text-fg-subtle shadow-md"
        >
          Loading tool…
        </div>
      }
    >
      <Widget />
    </Suspense>
  );
}
