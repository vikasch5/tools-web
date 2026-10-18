import type { TextToolDefinition } from "../types";
import { indentOption, printWidthOption, privacyFaq } from "./shared";

export const htmlFormatter: TextToolDefinition = {
  workspace: "text",
  slug: "html-formatter",
  category: "developer-tools",
  name: "HTML Formatter",
  metaTitle: "HTML Formatter – Beautify and Indent HTML Online",
  description:
    "Beautify HTML with clean indentation, including embedded CSS and JavaScript. Powered by Prettier and processed in your browser.",
  engine: "prettier",
  actions: [{ id: "format", label: "Format" }],
  options: [
    indentOption,
    printWidthOption,
    { type: "switch", id: "autoFix", label: "Fix broken tags", default: true },
  ],
  engineOptions: { parser: "html" },
  language: "HTML",
  accept: [".html", ".htm", ".txt"],
  downloadExtension: "html",
  sample: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Demo</title><style>body{font-family:system-ui;margin:0}</style></head><body><header class="site-header"><nav><a href="/">Home</a><a href="/tools">Tools</a></nav></header><main><h1>Hello</h1><p>This page was <strong>minified</strong>.</p></main><script>document.querySelector("h1").textContent="Formatted"</script></body></html>`,
  overview: [
    "HTML from a CMS export, an email template or a page's view-source is often a single dense block, with inline styles and scripts mixed in. Indentation that follows the element nesting makes the structure visible: which elements are inside which, where a section ends, and where a tag was left unclosed.",
    "The formatter uses Prettier and also formats CSS inside style tags and JavaScript inside script tags. Because whitespace between inline elements can change how text renders, it keeps such text intact rather than forcing every line to the chosen width. Warnings point to common mistakes, such as elements that are never closed, with their line and column.",
  ],
  howTo: [
    "Paste your markup, open an .html file, or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Choose indent size and line width.",
    "Press Format. Inline <style> and <script> blocks are formatted too.",
    "Copy the result or download it.",
  ],
  examples: [
    {
      title: "Indent nested elements",
      input: `<ul><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul>`,
      output: `<ul>\n  <li><a href="/a">A</a></li>\n  <li><a href="/b">B</a></li>\n</ul>`,
    },
  ],
  limitations: [
    "With “Fix broken tags” on, tags broken by a space after “<” (such as `<   /p>`) are repaired before formatting and listed in the status bar. Other mistakes, such as an element that is never closed, are flagged as warnings with their line and column.",
    "Whitespace between inline elements is significant in HTML, so some lines may stay longer than the chosen width to avoid changing how the page renders.",
    "Template syntax (Blade, Handlebars, JSX) is not supported and may be reported as an error.",
  ],
  faq: [
    {
      question: "Will formatting change how my page looks?",
      answer:
        "No. The formatter follows HTML whitespace rules so inline text renders the same. Only indentation and line breaks change.",
    },
    {
      question: "Can I format a snippet instead of a whole page?",
      answer:
        "Yes. A fragment such as a single <div> or a list of <li> elements is formatted as it is, without adding <html>, <head> or <body> tags.",
    },
    privacyFaq,
  ],
  related: ["css-formatter", "js-formatter", "css-minifier"],
};

export const htmlMinifier: TextToolDefinition = {
  workspace: "text",
  slug: "html-minifier",
  category: "developer-tools",
  name: "HTML Minifier",
  metaTitle: "HTML Minifier – Compress HTML, Inline CSS and JS",
  description:
    "Minify HTML: strip comments and extra whitespace, and compress inline <style> and <script> blocks. Pre and textarea content is kept. Runs in your browser.",
  engine: "html-minify",
  actions: [{ id: "minify", label: "Minify" }],
  options: [
    { type: "switch", id: "removeComments", label: "Remove comments", default: true },
    { type: "switch", id: "minifyCss", label: "Minify inline CSS", default: true },
    { type: "switch", id: "minifyJs", label: "Minify inline JS", default: true },
  ],
  language: "HTML",
  accept: [".html", ".htm", ".txt"],
  downloadExtension: "min.html",
  sample: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Demo page</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; }
      .card { padding: 16px; border-radius: 12px; }
    </style>
  </head>
  <body>
    <!-- Main content -->
    <main class="card">
      <h1>Hello</h1>
      <p>This page is <strong>about to be</strong> minified.</p>
      <pre>  Preformatted text
    keeps its spacing.</pre>
    </main>
    <script>
      const heading = document.querySelector("h1");
      heading.textContent = "Minified";
    </script>
  </body>
</html>`,
  overview: [
    "Minified HTML loads faster because there is less to download before the browser can start building the page. The savings matter most for large static pages, HTML emails with size limits, and markup embedded in scripts or databases.",
    "This minifier removes comments and whitespace that browsers ignore, and compresses inline CSS and JavaScript using the same engines as the dedicated minifiers on this site. It is careful where whitespace matters: text between inline elements keeps a single space, and the content of pre and textarea elements is left exactly as written, so the page looks the same afterwards.",
  ],
  howTo: [
    "Paste your markup, open an .html file, or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Choose whether to remove comments and compress inline CSS and JavaScript.",
    "Press Minify. The status bar shows how many bytes were saved.",
    "Copy the result or download it as .min.html.",
  ],
  examples: [
    {
      title: "Drop comments and whitespace between blocks",
      input: `<ul>\n  <!-- links -->\n  <li><a href="/a">A</a></li>\n  <li><a href="/b">B</a></li>\n</ul>`,
      output: `<ul><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul>`,
    },
    {
      title: "Keep the space between inline elements",
      input: `<p>\n  Read the <a href="/docs">docs</a>   or   <em>ask</em>.\n</p>`,
      output: `<p>Read the <a href="/docs">docs</a> or <em>ask</em>.</p>`,
    },
    {
      title: "Compress an inline style block",
      input: `<style>\n  .btn { color: #ffffff; margin: 0px; }\n</style>`,
      output: `<style>.btn{color:#fff;margin:0}</style>`,
    },
  ],
  limitations: [
    "Whitespace is removed only next to block-level tags such as <div>, <p> and <li>. Between inline elements it is collapsed to one space, because removing it would change the rendered text.",
    "Content inside <pre> and <textarea> is kept exactly as written.",
    "Conditional comments (<!--[if IE]>) and comments starting with <!--! are kept.",
    "Inline scripts with a syntax error, and JSON scripts that do not parse, are left as is and listed as warnings.",
    "Template syntax (Blade, Handlebars, JSX) is not understood and may be altered. Minify the rendered HTML instead.",
  ],
  faq: [
    {
      question: "Is it safe to minify inline JavaScript?",
      answer:
        "Yes for standard scripts. Top-level names are not renamed, so code in other scripts that uses them keeps working.",
    },
    {
      question: "Does CSS white-space: pre still work after minifying?",
      answer:
        "Not for elements other than <pre> and <textarea>. If an element relies on white-space: pre or pre-wrap, its spacing will be collapsed.",
    },
    privacyFaq,
  ],
  related: ["html-formatter", "css-minifier", "js-minifier"],
};
