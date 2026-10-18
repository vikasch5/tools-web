import type { TextToolDefinition } from "../types";
import { indentOption, printWidthOption, privacyFaq } from "./shared";

const jsSample = `// Debounce a function call
function debounce(fn,wait=200){let timer;return function(...args){clearTimeout(timer);timer=setTimeout(()=>fn.apply(this,args),wait)}}
const onResize=debounce(()=>{console.log("Resized to",window.innerWidth,"px")},150);
window.addEventListener("resize",onResize)`;

const jsReadable = `// Debounce a function call
function debounce(callback, waitMs = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => callback.apply(this, args), waitMs);
  };
}

const handleResize = debounce(() => {
  console.log("Resized to", window.innerWidth, "px");
}, 150);

window.addEventListener("resize", handleResize);
`;

export const jsFormatter: TextToolDefinition = {
  workspace: "text",
  slug: "js-formatter",
  category: "developer-tools",
  name: "JavaScript Formatter",
  metaTitle: "JavaScript Formatter – Beautify JS and TypeScript Online",
  description:
    "Beautify JavaScript and TypeScript with Prettier. Choose indentation, quotes, semicolons and line width. Your code stays in your browser.",
  engine: "prettier",
  actions: [{ id: "format", label: "Format" }],
  options: [
    {
      type: "segmented",
      id: "parser",
      label: "Language",
      choices: [
        { value: "babel", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
      ],
      default: "babel",
    },
    indentOption,
    printWidthOption,
    { type: "switch", id: "semi", label: "Semicolons", default: true },
    { type: "switch", id: "singleQuote", label: "Single quotes", default: false },
  ],
  language: "JavaScript",
  accept: [".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".txt"],
  downloadExtension: "js",
  sample: jsSample,
  howTo: [
    "Paste your code, open a .js or .ts file, or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Choose JavaScript or TypeScript, then set indentation, line width, semicolons and quote style.",
    "Press Format. Syntax errors are reported with their line and column.",
    "Copy the result or download it.",
  ],
  examples: [
    {
      title: "Tidy a one-line function",
      input: `const sum=(a,b)=>{return a+b}`,
      output: `const sum = (a, b) => {\n  return a + b;\n};`,
    },
  ],
  limitations: [
    "Formatting does not change behaviour, rename variables or remove unused code.",
    "Code must be syntactically valid. JSX is supported in JavaScript mode; TSX in TypeScript mode.",
  ],
  faq: [
    {
      question: "Is the output the same as running Prettier locally?",
      answer:
        "Yes, for the same options. This tool runs the official Prettier library in your browser.",
    },
    {
      question: "Can it un-minify (deobfuscate) code?",
      answer:
        "It restores readable layout, but it cannot recover original variable names that a minifier shortened.",
    },
    privacyFaq,
  ],
  related: ["js-minifier", "json-formatter", "html-formatter"],
};

export const jsMinifier: TextToolDefinition = {
  workspace: "text",
  slug: "js-minifier",
  category: "developer-tools",
  name: "JavaScript Minifier",
  metaTitle: "JavaScript Minifier – Compress JS with Terser Online",
  description:
    "Minify JavaScript with Terser: removes whitespace and comments, shortens variable names and simplifies code. Runs locally in your browser.",
  engine: "terser",
  actions: [{ id: "minify", label: "Minify" }],
  options: [
    { type: "switch", id: "compress", label: "Compress", default: true },
    { type: "switch", id: "mangle", label: "Shorten names", default: true },
    { type: "switch", id: "keepLicense", label: "Keep licence comments", default: false },
  ],
  language: "JavaScript",
  accept: [".js", ".mjs", ".cjs", ".txt"],
  downloadExtension: "min.js",
  sample: jsReadable,
  howTo: [
    "Paste your JavaScript, open a .js file, or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Keep Compress and Shorten names on for the smallest output. Turn them off for whitespace-only minification.",
    "Turn on “Keep licence comments” to preserve /*! … */ and @license banners.",
    "Press Minify. The status bar shows the size before and after.",
  ],
  examples: [
    {
      title: "Minify a small function",
      input: `function greet(name) {\n  return "Hello, " + name;\n}\nconsole.log(greet("Ada"));`,
      output: `function greet(e){return"Hello, "+e}console.log(greet("Ada"));`,
    },
  ],
  limitations: [
    "TypeScript and JSX must be compiled to plain JavaScript first.",
    "“Shorten names” only renames local variables; global names and object properties are kept so your code keeps working.",
    "No source map is produced.",
  ],
  faq: [
    {
      question: "Which minifier does this use?",
      answer:
        "Terser, the open-source minifier used by tools such as Vite and webpack.",
    },
    {
      question: "Will minified code behave the same?",
      answer:
        "It should, as long as the code does not depend on function names or on code that Terser considers unused. Always test minified output before shipping it.",
    },
    privacyFaq,
  ],
  related: ["js-formatter", "css-minifier", "json-formatter"],
};
