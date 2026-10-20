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

  // Added in batch 4
  { slug: "image-to-pdf", name: "JPG to PDF", category: "pdf-tools", description: "Turn images into a PDF, one per page.", status: "live", popular: true, isNew: true, keywords: ["image to pdf", "jpg to pdf", "png to pdf", "photo to pdf", "convert", "scan", "jpeg"] },
  { slug: "timestamp-converter", name: "Unix Timestamp Converter", category: "developer-tools", description: "Epoch seconds or milliseconds to dates and back.", status: "live", isNew: true, keywords: ["epoch", "unix time", "date", "milliseconds", "iso 8601", "utc", "time zone"] },
  { slug: "hash-generator", name: "Hash Generator", category: "developer-tools", description: "MD5, SHA-1 and SHA-256 of text or files.", status: "live", isNew: true, keywords: ["md5", "sha1", "sha256", "sha512", "checksum", "digest", "verify file"] },
  { slug: "color-converter", name: "Color Converter", category: "web-design-tools", description: "HEX, RGB, HSL, HSV and CMYK, with contrast check.", status: "live", isNew: true, keywords: ["hex to rgb", "rgb to hex", "hsl", "cmyk", "colour", "color picker", "contrast", "wcag"] },
  { slug: "age-calculator", name: "Age Calculator", category: "calculators", description: "Exact age in years, months and days.", status: "live", isNew: true, keywords: ["birthday", "date of birth", "how old", "years old", "days alive"] },
  { slug: "bmi-calculator", name: "BMI Calculator", category: "calculators", description: "Body mass index in metric or US units.", status: "live", isNew: true, keywords: ["body mass index", "healthy weight", "weight", "height", "obesity"] },
  { slug: "loan-calculator", name: "Loan & EMI Calculator", category: "calculators", description: "Monthly payment, interest and schedule.", status: "live", isNew: true, keywords: ["emi", "mortgage", "car loan", "personal loan", "interest", "amortization", "repayment"] },

  // Added in batch 3
  { slug: "html-minifier", name: "HTML Minifier", category: "developer-tools", description: "Strip comments and whitespace, compress inline CSS and JS.", status: "live", isNew: true, keywords: ["compress", "minify", "markup", "smaller", "optimize"] },
  { slug: "xml-formatter", name: "XML Formatter & Validator", category: "developer-tools", description: "Indent, minify and check XML with error locations.", status: "live", isNew: true, keywords: ["beautify", "pretty print", "validate", "svg", "rss", "sitemap", "well-formed"] },
  { slug: "yaml-to-json", name: "YAML ⇄ JSON Converter", category: "converters", description: "Convert YAML to JSON and JSON back to YAML.", status: "live", isNew: true, keywords: ["yml", "convert", "kubernetes", "docker compose", "config", "json to yaml"] },
  { slug: "url-encoder", name: "URL Encode / Decode", category: "developer-tools", description: "Percent-encode text, decode escapes and parse URLs.", status: "live", isNew: true, keywords: ["percent encoding", "urlencode", "urldecode", "query string", "%20", "uri"] },
  { slug: "image-converter", name: "Image Converter", category: "image-tools", description: "Convert images to JPG, PNG or WebP in bulk.", status: "live", isNew: true, keywords: ["png to jpg", "jpg to png", "webp to jpg", "jpg to webp", "gif", "bmp", "avif", "format"] },
  { slug: "rotate-pdf", name: "Rotate PDF", category: "pdf-tools", description: "Turn single pages or the whole PDF, with previews.", status: "live", isNew: true, keywords: ["turn", "landscape", "portrait", "sideways", "upside down", "pdf"] },
  { slug: "pdf-to-image", name: "PDF to Image", category: "pdf-tools", description: "Save PDF pages as PNG, JPG or WebP images.", status: "live", isNew: true, keywords: ["pdf to jpg", "pdf to png", "convert pdf", "export pages", "screenshot", "dpi"] },
  { slug: "password-generator", name: "Password Generator", category: "generators", description: "Strong random passwords with a strength meter.", status: "live", isNew: true, keywords: ["secure password", "random password", "passphrase", "strong", "credentials"] },
  { slug: "qr-code-generator", name: "QR Code Generator", category: "generators", description: "QR codes for links and Wi-Fi, as PNG or SVG.", status: "live", isNew: true, keywords: ["qr", "barcode", "wifi qr", "link", "scan"] },
  { slug: "case-converter", name: "Case Converter", category: "text-tools", description: "UPPER, lower, Title, camelCase, snake_case and more.", status: "live", isNew: true, keywords: ["uppercase", "lowercase", "title case", "sentence case", "camelcase", "snake case", "kebab case"] },
  { slug: "lorem-ipsum", name: "Lorem Ipsum Generator", category: "generators", description: "Placeholder text by paragraphs, sentences or words.", status: "live", isNew: true, keywords: ["placeholder text", "dummy text", "filler", "lipsum"] },

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
