import type { TextToolDefinition } from "../types";
import { indentOption, printWidthOption, privacyFaq } from "./shared";

const cssSample = `/* Card component */
.card{display:flex;flex-direction:column;gap:12px;padding:16px 20px;border:1px solid #e0ded5;border-radius:8px;background:#ffffff}
.card:hover{border-color:#16150f}
.card__title{margin:0;font-size:1.125rem;font-weight:600;color:#16150f}
@media (max-width:640px){.card{padding:12px}}`;

const cssReadable = `/* Card component */
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  border: 1px solid #e0ded5;
  border-radius: 8px;
  background: #ffffff;
}

.card:hover {
  border-color: #16150f;
}

.card__title {
  margin: 0px;
  font-size: 1.125rem;
  font-weight: 600;
  color: #16150f;
}

@media (max-width: 640px) {
  .card {
    padding: 12px;
  }
}
`;

export const cssFormatter: TextToolDefinition = {
  workspace: "text",
  slug: "css-formatter",
  category: "developer-tools",
  name: "CSS Formatter",
  metaTitle: "CSS Formatter – Beautify CSS, SCSS and Less Online",
  description:
    "Beautify messy or minified CSS, SCSS and Less with consistent indentation and spacing. Powered by Prettier and runs in your browser.",
  engine: "prettier",
  actions: [{ id: "format", label: "Format" }],
  options: [
    {
      type: "segmented",
      id: "parser",
      label: "Syntax",
      choices: [
        { value: "css", label: "CSS" },
        { value: "scss", label: "SCSS" },
        { value: "less", label: "Less" },
      ],
      default: "css",
    },
    indentOption,
    printWidthOption,
  ],
  language: "CSS",
  accept: [".css", ".scss", ".less", ".txt"],
  downloadExtension: "css",
  sample: cssSample,
  howTo: [
    "Paste your stylesheet, open a .css, .scss or .less file, or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Pick the syntax that matches your code, plus indent size and line width.",
    "Press Format. Each rule and declaration is placed on its own line with consistent spacing.",
    "Copy the result or download it.",
  ],
  examples: [
    {
      title: "Expand minified CSS",
      input: `.btn{color:#fff;background:#16150f}.btn:hover{opacity:.9}`,
      output: `.btn {\n  color: #fff;\n  background: #16150f;\n}\n.btn:hover {\n  opacity: 0.9;\n}`,
    },
  ],
  limitations: [
    "Formatting changes whitespace and quotes only. It does not reorder rules, remove duplicates or fix invalid properties.",
    "Code with syntax errors (such as a missing closing brace) cannot be formatted until the error is fixed.",
  ],
  faq: [
    {
      question: "Which formatter does this use?",
      answer:
        "Prettier, the open-source formatter used in most code editors, so the output matches what your team gets from Prettier with the same settings.",
    },
    {
      question: "Can I format SCSS and Less?",
      answer:
        "Yes. Choose SCSS or Less under Syntax so nesting, variables and mixins are formatted correctly.",
    },
    privacyFaq,
  ],
  related: ["css-minifier", "html-formatter", "js-formatter"],
};

export const cssMinifier: TextToolDefinition = {
  workspace: "text",
  slug: "css-minifier",
  category: "developer-tools",
  name: "CSS Minifier",
  metaTitle: "CSS Minifier – Compress CSS and Reduce File Size",
  description:
    "Minify CSS to cut file size: removes whitespace and comments, shortens colours and values, and merges rules. Runs entirely in your browser.",
  engine: "csso",
  actions: [{ id: "minify", label: "Minify" }],
  options: [
    { type: "switch", id: "restructure", label: "Merge rules", default: true },
    { type: "switch", id: "keepLicense", label: "Keep /*! */ comments", default: false },
  ],
  language: "CSS",
  accept: [".css", ".txt"],
  downloadExtension: "min.css",
  sample: cssReadable,
  howTo: [
    "Paste your CSS, open a .css file, or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Leave “Merge rules” on for the smallest output, or turn it off to keep the original rule order.",
    "Turn on “Keep /*! */ comments” if your CSS includes a licence banner that must be preserved.",
    "Press Minify. The status bar shows how many bytes were saved.",
  ],
  examples: [
    {
      title: "Shorten values and drop comments",
      input: `/* button */\n.btn {\n  color: #ffffff;\n  margin: 0px 0px 0px 0px;\n}`,
      output: `.btn{color:#fff;margin:0}`,
    },
  ],
  limitations: [
    "“Merge rules” can reorder declarations. If your CSS relies on a specific cascade order across duplicate selectors, test the result or turn the option off.",
    "Invalid CSS is passed through as-is rather than reported as an error.",
  ],
  faq: [
    {
      question: "How much smaller will my CSS get?",
      answer:
        "It depends on the source. Hand-written, commented CSS often shrinks by 20–40%. Already-minified CSS will barely change.",
    },
    {
      question: "Should I still use gzip or Brotli on my server?",
      answer:
        "Yes. Minification and compression work together: minify first, then let your server compress the file for transfer.",
    },
    privacyFaq,
  ],
  related: ["css-formatter", "js-minifier", "html-formatter"],
};
