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
  // Developer tools — live
  { slug: "json-formatter", name: "JSON Formatter & Validator", category: "developer-tools", description: "Format, minify and validate JSON with error locations.", status: "live", popular: true },
  { slug: "css-formatter", name: "CSS Formatter", category: "developer-tools", description: "Beautify CSS, SCSS and Less with Prettier.", status: "live", popular: true, isNew: true },
  { slug: "css-minifier", name: "CSS Minifier", category: "developer-tools", description: "Compress CSS and see the bytes saved.", status: "live", popular: true, isNew: true },
  { slug: "js-formatter", name: "JavaScript Formatter", category: "developer-tools", description: "Beautify JavaScript and TypeScript.", status: "live", popular: true, isNew: true },
  { slug: "js-minifier", name: "JavaScript Minifier", category: "developer-tools", description: "Minify JavaScript with Terser.", status: "live", popular: true },
  { slug: "html-formatter", name: "HTML Formatter", category: "developer-tools", description: "Indent HTML, including inline CSS and JS.", status: "live", popular: true, isNew: true },

  // Planned
  { slug: "sql-formatter", name: "SQL Formatter", category: "developer-tools", description: "Format SQL queries for common dialects.", status: "soon" },
  { slug: "base64", name: "Base64 Encode / Decode", category: "developer-tools", description: "Encode text or files to Base64 and back.", status: "soon" },
  { slug: "jwt-decoder", name: "JWT Decoder", category: "developer-tools", description: "Inspect a token's header and payload.", status: "soon" },
  { slug: "merge-pdf", name: "Merge PDF", category: "pdf-tools", description: "Combine several PDFs into one file.", status: "soon", popular: true },
  { slug: "split-pdf", name: "Split PDF", category: "pdf-tools", description: "Extract pages or split by range.", status: "soon" },
  { slug: "compress-image", name: "Compress Image", category: "image-tools", description: "Shrink JPG, PNG and WebP file sizes.", status: "soon", popular: true },
  { slug: "resize-image", name: "Resize Image", category: "image-tools", description: "Set exact pixel dimensions or a percentage.", status: "soon" },
  { slug: "passport-photo", name: "Passport Photo Maker", category: "image-tools", description: "Crop photos to official size presets.", status: "soon" },
  { slug: "word-counter", name: "Word Counter", category: "text-tools", description: "Count words, characters and reading time.", status: "soon" },
  { slug: "diff-checker", name: "Diff Checker", category: "text-tools", description: "Compare two texts side by side.", status: "soon" },
  { slug: "csv-to-json", name: "CSV to JSON", category: "converters", description: "Turn spreadsheet rows into JSON objects.", status: "soon" },
  { slug: "gradient-generator", name: "Gradient Generator", category: "web-design-tools", description: "Build linear and radial CSS gradients.", status: "soon" },
  { slug: "uuid-generator", name: "UUID Generator", category: "generators", description: "Create v4 and v7 UUIDs in bulk.", status: "soon" },
  { slug: "percentage-calculator", name: "Percentage Calculator", category: "calculators", description: "Work out increases, decreases and ratios.", status: "soon" },
];

export const toolPath = (tool: Pick<Tool, "category" | "slug">) =>
  `/${tool.category}/${tool.slug}`;

export const liveTools = tools.filter((t) => t.status === "live");

export const toolsInCategory = (category: string) =>
  tools.filter((t) => t.category === category);
