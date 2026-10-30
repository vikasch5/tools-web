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

  // Added in batch 5: the most-used PDF tools
  { slug: "compress-pdf", name: "Compress PDF", category: "pdf-tools", description: "Shrink PDFs for email and upload limits.", status: "live", popular: true, isNew: true, keywords: ["reduce pdf size", "shrink pdf", "pdf compressor", "make pdf smaller", "optimize pdf", "1mb", "200kb", "email"] },
  { slug: "word-to-pdf", name: "Word to PDF", category: "pdf-tools", description: "Convert .docx documents to PDF.", status: "live", popular: true, isNew: true, keywords: ["docx to pdf", "doc to pdf", "convert word", "microsoft word", "resume to pdf", "cv"] },
  { slug: "pdf-to-word", name: "PDF to Word", category: "pdf-tools", description: "Get a PDF's text into an editable .docx.", status: "live", popular: true, isNew: true, keywords: ["pdf to docx", "pdf to doc", "edit pdf text", "convert pdf", "editable", "microsoft word"] },
  { slug: "organize-pdf", name: "Organize PDF", category: "pdf-tools", description: "Reorder, turn and remove pages with previews.", status: "live", isNew: true, keywords: ["reorder pages", "rearrange pdf", "sort pages", "move pages", "page order"] },
  { slug: "delete-pdf-pages", name: "Delete PDF Pages", category: "pdf-tools", description: "Remove pages you do not need.", status: "live", isNew: true, keywords: ["remove pages", "delete page", "blank pages", "cut pages", "pdf page remover"] },
  { slug: "add-page-numbers", name: "Add Page Numbers", category: "pdf-tools", description: "Number PDF pages at the top or bottom.", status: "live", isNew: true, keywords: ["page numbers", "pagination", "number pages", "footer", "page x of y", "bates"] },
  { slug: "watermark-pdf", name: "Watermark PDF", category: "pdf-tools", description: "Stamp text or a logo on PDF pages.", status: "live", isNew: true, keywords: ["add watermark", "confidential", "draft", "stamp", "logo", "brand"] },
  { slug: "protect-pdf", name: "Protect PDF", category: "pdf-tools", description: "Lock a PDF with an AES-256 password.", status: "live", isNew: true, keywords: ["password protect", "encrypt pdf", "lock pdf", "secure pdf", "add password"] },
  { slug: "unlock-pdf", name: "Unlock PDF", category: "pdf-tools", description: "Remove a PDF password you know.", status: "live", isNew: true, keywords: ["remove password", "decrypt pdf", "pdf password remover", "unprotect", "restrictions", "bank statement"] },

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
  { slug: "exam-photo-resizer", name: "Exam Photo & Signature Resizer", category: "image-tools", description: "Exact pixel and KB sizes for IBPS, SSC, UPSC, GDS and PAN forms.", status: "live", popular: true, isNew: true, keywords: ["exam photo", "ibps", "sbi", "ssc", "upsc", "gds", "pan card", "20kb", "50kb", "200x230", "thumb impression", "sarkari form"] },
  { slug: "signature-resizer", name: "Signature Resizer", category: "image-tools", description: "Clean, cropped signatures at 140 × 60 px, 10–20 KB and more.", status: "live", isNew: true, keywords: ["signature", "sign", "10kb", "20kb", "140x60", "scan signature", "white background"] },
  { slug: "passport-photo", name: "Passport Photo Maker", category: "image-tools", description: "Crop photos to official size presets.", status: "live", isNew: true, keywords: ["visa", "id photo", "2x2", "35x45", "crop"] },
  { slug: "word-counter", name: "Word Counter", category: "text-tools", description: "Count words, characters and reading time.", status: "live", popular: true, isNew: true, keywords: ["character count", "characters", "letters", "reading time", "essay"] },
  { slug: "diff-checker", name: "Diff Checker", category: "text-tools", description: "Compare two texts side by side.", status: "live", isNew: true, keywords: ["compare", "difference", "text compare", "changes"] },
  { slug: "csv-to-json", name: "CSV to JSON", category: "converters", description: "Turn spreadsheet rows into JSON objects.", status: "live", isNew: true, keywords: ["spreadsheet", "excel", "convert", "tsv"] },
  { slug: "gradient-generator", name: "Gradient Generator", category: "web-design-tools", description: "Build linear, radial and conic CSS gradients.", status: "live", isNew: true, keywords: ["css gradient", "background", "colors", "linear", "radial"] },
  { slug: "uuid-generator", name: "UUID Generator", category: "generators", description: "Create v4 and v7 UUIDs in bulk.", status: "live", isNew: true, keywords: ["guid", "unique id", "random id", "v4", "v7"] },
  { slug: "percentage-calculator", name: "Percentage Calculator", category: "calculators", description: "Work out increases, decreases and ratios.", status: "live", isNew: true, keywords: ["percent", "discount", "increase", "decrease", "ratio"] },
];

/**
 * Landing pages for one setting of a live tool ("Compress Image to 50 KB").
 * They have their own URL, title and guide, appear in the sitemap and in
 * search results, but not in category listings or tool counts.
 */
export type ToolVariant = {
  slug: string;
  name: string;
  category: string;
  description: string;
  /** Slug of the live tool whose widget the page uses. */
  variantOf: string;
  keywords?: string[];
};

const kbVariant = (kb: number): ToolVariant => ({
  slug: `compress-image-to-${kb}kb`,
  name: `Compress Image to ${kb} KB`,
  category: "image-tools",
  description: `Get a JPG under ${kb} KB for upload forms.`,
  variantOf: "compress-image",
  keywords: [`${kb}kb`, `${kb} kb`, "reduce size", "target size", "form upload"],
});

const formVariant = (slug: string, name: string, description: string, keywords: string[]): ToolVariant => ({
  slug,
  name,
  category: "image-tools",
  description,
  variantOf: "exam-photo-resizer",
  keywords,
});

const loanVariant = (slug: string, name: string, description: string, keywords: string[]): ToolVariant => ({
  slug,
  name,
  category: "calculators",
  description,
  variantOf: "loan-calculator",
  keywords: [...keywords, "emi", "prepayment"],
});

export const toolVariants: ToolVariant[] = [
  ...[10, 20, 30, 50, 100, 200, 500].map(kbVariant),
  formVariant("pan-card-photo-resizer", "PAN Card Photo Resizer", "PAN photo and signature for the online form.", ["pan", "pan card", "nsdl", "protean", "utiitsl", "form 49a"]),
  formVariant("ibps-photo-signature-resizer", "IBPS & SBI Photo and Signature Resizer", "200 × 230 px photo, 140 × 60 px signature.", ["ibps", "sbi", "rbi", "bank exam", "po", "clerk"]),
  formVariant("upsc-photo-resizer", "UPSC Photo and Signature Resizer", "20–200 KB photo for UPSC forms.", ["upsc", "ias", "civil services", "cse"]),
  loanVariant("home-loan-emi-calculator", "Home Loan EMI Calculator", "EMI, interest and prepayment savings on a home loan.", ["home loan", "housing loan", "mortgage"]),
  loanVariant("car-loan-emi-calculator", "Car Loan EMI Calculator", "EMI and total interest on a car loan.", ["car loan", "auto loan", "vehicle loan"]),
  loanVariant("personal-loan-emi-calculator", "Personal Loan EMI Calculator", "EMI and interest on a personal loan.", ["personal loan", "instant loan"]),
  formVariant("india-post-gds-photo-resizer", "India Post GDS Photo Resizer", "320 × 400 px photo for the GDS form.", ["gds", "india post", "gramin dak sevak", "postal"]),
];

export const toolPath = (tool: Pick<Tool, "category" | "slug">) =>
  `/${tool.category}/${tool.slug}`;

export const liveTools = tools.filter((t) => t.status === "live");

export const toolsInCategory = (category: string) =>
  tools.filter((t) => t.category === category);

/** Live tools plus landing-page variants, for search results only. */
export const searchableTools: Tool[] = [
  ...liveTools,
  ...toolVariants.map((v): Tool => ({
    slug: v.slug,
    name: v.name,
    category: v.category,
    description: v.description,
    status: "live",
    keywords: v.keywords,
  })),
];
