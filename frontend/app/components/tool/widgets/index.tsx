import { lazy, Suspense, type ComponentType } from "react";
import type { WidgetId, WidgetPreset } from "~/tools/types";

export type WidgetProps = { preset?: WidgetPreset };

const load = <K extends string>(factory: () => Promise<Record<K, ComponentType<WidgetProps>>>, name: K) =>
  lazy(() => factory().then((m) => ({ default: m[name] })));

/** Each tool panel is its own chunk, so a page only downloads its own UI. */
const widgets: Record<WidgetId, ComponentType<WidgetProps>> = {
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
  "pdf-to-image": load(() => import("./PdfToImage"), "PdfToImage"),
  "image-to-pdf": load(() => import("./ImageToPdf"), "ImageToPdf"),
  "age-calculator": load(() => import("./AgeCalculator"), "AgeCalculator"),
  "bmi-calculator": load(() => import("./BmiCalculator"), "BmiCalculator"),
  "loan-calculator": load(() => import("./LoanCalculator"), "LoanCalculator"),
  "timestamp-converter": load(() => import("./TimestampConverter"), "TimestampConverter"),
  "hash-generator": load(() => import("./HashGenerator"), "HashGenerator"),
  "color-converter": load(() => import("./ColorConverter"), "ColorConverter"),
  "case-converter": load(() => import("./CaseConverter"), "CaseConverter"),
  "password-generator": load(() => import("./PasswordGenerator"), "PasswordGenerator"),
  "qr-code-generator": load(() => import("./QrCode"), "QrCode"),
  "lorem-ipsum": load(() => import("./LoremIpsum"), "LoremIpsum"),
  "image-converter": load(() => import("./ImageConverter"), "ImageConverter"),
  "compress-pdf": load(() => import("./CompressPdf"), "CompressPdf"),
  "word-to-pdf": load(() => import("./WordToPdf"), "WordToPdf"),
  "pdf-to-word": load(() => import("./PdfToWord"), "PdfToWord"),
  "organize-pdf": load(() => import("./PageArranger"), "OrganizePdf"),
  "delete-pdf-pages": load(() => import("./PageArranger"), "DeletePdfPages"),
  "add-page-numbers": load(() => import("./PageNumbers"), "PageNumbers"),
  "watermark-pdf": load(() => import("./Watermark"), "Watermark"),
  "protect-pdf": load(() => import("./PdfPassword"), "ProtectPdf"),
  "unlock-pdf": load(() => import("./PdfPassword"), "UnlockPdf"),
  "form-photo": load(() => import("./FormPhoto"), "FormPhoto"),
  "gst-calculator": load(() => import("./GstCalculator"), "GstCalculator"),
  "sip-calculator": load(() => import("./SipCalculator"), "SipCalculator"),
  "fd-calculator": load(() => import("./FdCalculator"), "FdCalculator"),
  "ppf-calculator": load(() => import("./PpfCalculator"), "PpfCalculator"),
  "gratuity-calculator": load(() => import("./GratuityCalculator"), "GratuityCalculator"),
  "hra-calculator": load(() => import("./HraCalculator"), "HraCalculator"),
  "income-tax-calculator": load(() => import("./IncomeTaxCalculator"), "IncomeTaxCalculator"),
  "crop-image": load(() => import("./CropImage"), "CropImage"),
  "add-text": load(() => import("./AddText"), "AddText"),
  "date-calculator": load(() => import("./DateCalculator"), "DateCalculator"),
  "discount-calculator": load(() => import("./DiscountCalculator"), "DiscountCalculator"),
  "gold-calculator": load(() => import("./GoldCalculator"), "GoldCalculator"),
  "unit-converter": load(() => import("./UnitConverter"), "UnitConverter"),
  "typing-test": load(() => import("./TypingTest"), "TypingTest"),
};

export function ToolWidget({ id, preset }: { id: WidgetId; preset?: WidgetPreset }) {
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
      <Widget preset={preset} />
    </Suspense>
  );
}
