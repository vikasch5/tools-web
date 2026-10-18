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
  /** Extra search terms people use for this tool (synonyms, formats). */
  keywords?: string[];
};

export const tools: Tool[] = [
  // Batch 1: developer tools
  { slug: "json-formatter", name: "JSON Formatter & Validator", category: "developer-tools", description: "Format, minify and validate JSON with error locations.", status: "live", popular: true, keywords: ["beautify", "pretty print", "validate", "lint", "json viewer", "tree"] },
  { slug: "css-formatter", name: "CSS Formatter", category: "developer-tools", description: "Beautify CSS, SCSS and Less with Prettier.", status: "live", popular: true, keywords: ["beautify", "pretty", "scss", "less", "stylesheet"] },
  { slug: "css-minifier", name: "CSS Minifier", category: "developer-tools", description: "Compress CSS and see the bytes saved.", status: "live", popular: true, keywords: ["compress", "minify", "optimize", "stylesheet", "smaller"] },
  { slug: "js-formatter", name: "JavaScript Formatter", category: "developer-tools", description: "Beautify JavaScript and TypeScript.", status: "live", popular: true, keywords: ["javascript", "typescript", "ts", "beautify", "pretty", "prettier"] },
  { slug: "js-minifier", name: "JavaScript Minifier", category: "developer-tools", description: "Minify JavaScript with Terser.", status: "live", popular: true, keywords: ["javascript", "compress", "uglify", "terser", "minify"] },
  { slug: "html-formatter", name: "HTML Formatter", category: "developer-tools", description: "Indent HTML, including inline CSS and JS.", status: "live", popular: true, keywords: ["beautify", "indent", "pretty", "markup"] },

  // Added in batch 2
  { slug: "sql-formatter", name: "SQL Formatter", category: "developer-tools", description: "Format SQL for MySQL, PostgreSQL, SQL Server and more.", status: "live", isNew: true, keywords: ["query", "mysql", "postgres", "postgresql", "sqlite", "sql server", "tsql", "beautify"] },
  { slug: "base64", name: "Base64 Encode / Decode", category: "developer-tools", description: "Encode text to Base64 and decode it back.", status: "live", isNew: true, keywords: ["encode", "decode", "b64", "atob", "btoa"] },
  { slug: "jwt-decoder", name: "JWT Decoder", category: "developer-tools", description: "Inspect a token's header, payload and expiry.", status: "live", isNew: true, keywords: ["token", "json web token", "bearer", "auth", "claims"] },
  { slug: "merge-pdf", name: "Merge PDF", category: "pdf-tools", description: "Combine several PDFs into one file.", status: "live", popular: true, isNew: true, keywords: ["combine", "join", "pdf"] },
  { slug: "split-pdf", name: "Split PDF", category: "pdf-tools", description: "Extract pages or split by range.", status: "live", isNew: true, keywords: ["extract pages", "separate", "cut", "pdf"] },
  { slug: "compress-image", name: "Compress Image", category: "image-tools", description: "Shrink JPG, PNG and WebP file sizes.", status: "live", popular: true, isNew: true, keywords: ["optimize", "reduce size", "shrink", "jpg", "jpeg", "png", "webp", "photo"] },
  { slug: "resize-image", name: "Resize Image", category: "image-tools", description: "Set exact pixel dimensions or a percentage.", status: "live", isNew: true, keywords: ["scale", "dimensions", "pixels", "jpg", "png", "photo"] },
  { slug: "passport-photo", name: "Passport Photo Maker", category: "image-tools", description: "Crop photos to official size presets.", status: "live", isNew: true, keywords: ["visa", "id photo", "2x2", "35x45", "crop"] },
  { slug: "word-counter", name: "Word Counter", category: "text-tools", description: "Count words, characters and reading time.", status: "live", popular: true, isNew: true, keywords: ["character count", "characters", "letters", "reading time", "essay"] },
  { slug: "diff-checker", name: "Diff Checker", category: "text-tools", description: "Compare two texts side by side.", status: "live", isNew: true, keywords: ["compare", "difference", "text compare", "changes"] },
  { slug: "csv-to-json", name: "CSV to JSON", category: "converters", description: "Turn spreadsheet rows into JSON objects.", status: "live", isNew: true, keywords: ["spreadsheet", "excel", "convert", "tsv"] },
  { slug: "gradient-generator", name: "Gradient Generator", category: "web-design-tools", description: "Build linear, radial and conic CSS gradients.", status: "live", isNew: true, keywords: ["css gradient", "background", "colors", "linear", "radial"] },
  { slug: "uuid-generator", name: "UUID Generator", category: "generators", description: "Create v4 and v7 UUIDs in bulk.", status: "live", isNew: true, keywords: ["guid", "unique id", "random id", "v4", "v7"] },
  { slug: "percentage-calculator", name: "Percentage Calculator", category: "calculators", description: "Work out increases, decreases and ratios.", status: "live", isNew: true, keywords: ["percent", "discount", "increase", "decrease", "ratio"] },
];

export const toolPath = (tool: Pick<Tool, "category" | "slug">) =>
  `/${tool.category}/${tool.slug}`;

export const liveTools = tools.filter((t) => t.status === "live");

export const toolsInCategory = (category: string) =>
  tools.filter((t) => t.category === category);
