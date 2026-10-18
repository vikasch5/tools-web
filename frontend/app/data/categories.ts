import {
  ArrowLeftRight,
  Braces,
  Calculator,
  FileText,
  Image,
  Palette,
  Type,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export type CategoryHue =
  | "dev"
  | "pdf"
  | "image"
  | "text"
  | "convert"
  | "design"
  | "generate"
  | "calc";

export type Category = {
  slug: string;
  name: string;
  /** Short label for compact navigation. */
  shortName: string;
  description: string;
  icon: LucideIcon;
  /** Three-letter mono code shown as a compact label. */
  code: string;
  /** Tint for the category icon tile. */
  hue: CategoryHue;
};

/** Mock category registry. Order here is display order. */
export const categories: Category[] = [
  {
    slug: "developer-tools",
    name: "Developer Tools",
    shortName: "Developer",
    description: "Format, minify and validate JSON, CSS, JavaScript and HTML.",
    icon: Braces,
    code: "DEV",
    hue: "dev",
  },
  {
    slug: "pdf-tools",
    name: "PDF Tools",
    shortName: "PDF",
    description: "Merge, split, compress, rotate and convert PDF files.",
    icon: FileText,
    code: "PDF",
    hue: "pdf",
  },
  {
    slug: "image-tools",
    name: "Image Tools",
    shortName: "Image",
    description: "Resize, crop, compress and convert images and photos.",
    icon: Image,
    code: "IMG",
    hue: "image",
  },
  {
    slug: "text-tools",
    name: "Text Tools",
    shortName: "Text",
    description: "Count words, change case, clean up and compare text.",
    icon: Type,
    code: "TXT",
    hue: "text",
  },
  {
    slug: "converters",
    name: "Converters",
    shortName: "Converters",
    description: "Convert between CSV and JSON, timestamps, units and more.",
    icon: ArrowLeftRight,
    code: "CNV",
    hue: "convert",
  },
  {
    slug: "web-design-tools",
    name: "Web Design Tools",
    shortName: "Design",
    description: "Pick colours and build gradients, shadows and CSS snippets.",
    icon: Palette,
    code: "CSS",
    hue: "design",
  },
  {
    slug: "generators",
    name: "Generators",
    shortName: "Generators",
    description: "Generate UUIDs, passwords, placeholder text and QR codes.",
    icon: WandSparkles,
    code: "GEN",
    hue: "generate",
  },
  {
    slug: "calculators",
    name: "Calculators",
    shortName: "Calculators",
    description: "Percentages, dates, ratios and everyday calculations.",
    icon: Calculator,
    code: "CLC",
    hue: "calc",
  },
];

export const categoryPath = (slug: string) => `/${slug}`;
