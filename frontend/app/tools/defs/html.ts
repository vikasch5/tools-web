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
    privacyFaq,
  ],
  related: ["css-formatter", "js-formatter", "css-minifier"],
};
