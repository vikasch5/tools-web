/**
 * Public tool registry: lightweight entries used by navigation, listings
 * and search. "live" tools have a working page (full definitions live in
 * app/tools/registry.ts); "soon" tools are planned and shown as such.
 */
export type ToolStatus = "live" | "soon";

export type Tool = {
  slug: string;
  name: string;
  /** Category slug from data/categories.ts. */
  category: string;
  description: string;
  status: ToolStatus;
  popular?: boolean;
  /** Recently added; drives the "New" label. */
  isNew?: boolean;
};

export const tools: Tool[] = [
  // Batch 1: developer tools
  { slug: "json-formatter", name: "JSON Formatter & Validator", category: "developer-tools", description: "Format, minify and validate JSON with error locations.", status: "live", popular: true },
  { slug: "css-formatter", name: "CSS Formatter", category: "developer-tools", description: "Beautify CSS, SCSS and Less with Prettier.", status: "live", popular: true },
  { slug: "css-minifier", name: "CSS Minifier", category: "developer-tools", description: "Compress CSS and see the bytes saved.", status: "live", popular: true },
  { slug: "js-formatter", name: "JavaScript Formatter", category: "developer-tools", description: "Beautify JavaScript and TypeScript.", status: "live", popular: true },
  { slug: "js-minifier", name: "JavaScript Minifier", category: "developer-tools", description: "Minify JavaScript with Terser.", status: "live", popular: true },
  { slug: "html-formatter", name: "HTML Formatter", category: "developer-tools", description: "Indent HTML, including inline CSS and JS.", status: "live", popular: true },

  // Added in batch 2
  { slug: "sql-formatter", name: "SQL Formatter", category: "developer-tools", description: "Format SQL for MySQL, PostgreSQL, SQL Server and more.", status: "live", isNew: true },
  { slug: "base64", name: "Base64 Encode / Decode", category: "developer-tools", description: "Encode text to Base64 and decode it back.", status: "live", isNew: true },
  { slug: "jwt-decoder", name: "JWT Decoder", category: "developer-tools", description: "Inspect a token's header, payload and expiry.", status: "live", isNew: true },
  { slug: "merge-pdf", name: "Merge PDF", category: "pdf-tools", description: "Combine several PDFs into one file.", status: "live", popular: true, isNew: true },
  { slug: "split-pdf", name: "Split PDF", category: "pdf-tools", description: "Extract pages or split by range.", status: "live", isNew: true },
  { slug: "compress-image", name: "Compress Image", category: "image-tools", description: "Shrink JPG, PNG and WebP file sizes.", status: "live", popular: true, isNew: true },
  { slug: "resize-image", name: "Resize Image", category: "image-tools", description: "Set exact pixel dimensions or a percentage.", status: "live", isNew: true },
  { slug: "passport-photo", name: "Passport Photo Maker", category: "image-tools", description: "Crop photos to official size presets.", status: "live", isNew: true },
  { slug: "word-counter", name: "Word Counter", category: "text-tools", description: "Count words, characters and reading time.", status: "live", popular: true, isNew: true },
  { slug: "diff-checker", name: "Diff Checker", category: "text-tools", description: "Compare two texts side by side.", status: "live", isNew: true },
  { slug: "csv-to-json", name: "CSV to JSON", category: "converters", description: "Turn spreadsheet rows into JSON objects.", status: "live", isNew: true },
  { slug: "gradient-generator", name: "Gradient Generator", category: "web-design-tools", description: "Build linear, radial and conic CSS gradients.", status: "live", isNew: true },
  { slug: "uuid-generator", name: "UUID Generator", category: "generators", description: "Create v4 and v7 UUIDs in bulk.", status: "live", isNew: true },
  { slug: "percentage-calculator", name: "Percentage Calculator", category: "calculators", description: "Work out increases, decreases and ratios.", status: "live", isNew: true },
];

export const toolPath = (tool: Pick<Tool, "category" | "slug">) =>
  `/${tool.category}/${tool.slug}`;

export const liveTools = tools.filter((t) => t.status === "live");

export const toolsInCategory = (category: string) =>
  tools.filter((t) => t.category === category);
