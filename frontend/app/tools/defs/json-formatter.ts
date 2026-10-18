import type { TextToolDefinition } from "../types";
import { indentOption, privacyFaq } from "./shared";

export const jsonFormatter: TextToolDefinition = {
  workspace: "text",
  slug: "json-formatter",
  category: "developer-tools",
  name: "JSON Formatter & Validator",
  metaTitle: "JSON Formatter & Validator – Beautify and Minify JSON",
  description:
    "Format, minify and validate JSON in your browser. Pinpoint errors by line and column, and explore your data in a searchable tree view.",
  engine: "json",
  tree: true,
  actions: [
    { id: "format", label: "Format" },
    { id: "minify", label: "Minify" },
    { id: "validate", label: "Validate" },
  ],
  options: [
    indentOption,
    { type: "switch", id: "sortKeys", label: "Sort keys", default: false },
  ],
  language: "JSON",
  accept: [".json", ".txt"],
  downloadExtension: "json",
  sample: `{"id":1024,"name":"Ada Lovelace","email":"ada@example.com","active":true,"roles":["admin","editor"],"profile":{"timezone":"Europe/London","newsletter":false},"lastLogin":null}`,
  howTo: [
    "Paste your JSON into the input panel, open a .json file, or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Choose an indent size and whether keys should be sorted alphabetically.",
    "Press Format to pretty-print, Minify to remove whitespace, or Validate to check syntax only.",
    "If the JSON is invalid, the status bar shows the error with its line and column. Use “Go to error” to jump to it.",
    "Switch the output to Tree to browse nested data: expand or collapse nodes, search keys and values, and copy any node’s path or value.",
    "Copy the result or download it as a .json file.",
  ],
  examples: [
    {
      title: "Pretty-print a compact API response",
      input: `{"user":{"id":7,"tags":["a","b"]}}`,
      output: `{\n  "user": {\n    "id": 7,\n    "tags": [\n      "a",\n      "b"\n    ]\n  }\n}`,
    },
    {
      title: "Find a trailing comma",
      input: `{\n  "a": 1,\n  "b": 2,\n}`,
      output: "Error on line 4: a property name was expected after the comma. JSON does not allow trailing commas.",
    },
  ],
  limitations: [
    "Strict JSON only: comments, trailing commas, single quotes and unquoted keys are reported as errors (they are valid in JavaScript, not JSON).",
    "Numbers larger than 2^53 lose precision when formatted, because browsers parse JSON numbers as 64-bit floats.",
    "Very large files (tens of megabytes) may take a few seconds on slower devices.",
  ],
  faq: [
    {
      question: "What is the difference between Format and Minify?",
      answer:
        "Format adds line breaks and indentation so JSON is easy to read. Minify removes all optional whitespace to make the payload as small as possible, which is useful for APIs and storage.",
    },
    {
      question: "Does Validate change my JSON?",
      answer:
        "No. Validate only checks the syntax and reports the first error it finds. Your input and output stay as they are.",
    },
    {
      question: "Why is my JSON invalid when it works in JavaScript?",
      answer:
        "JSON is stricter than JavaScript object syntax. Keys and strings must use double quotes, and comments and trailing commas are not allowed.",
    },
    {
      question: "How do I explore large or deeply nested JSON?",
      answer:
        "Format your JSON, then switch the output panel to Tree. Expand only the parts you need, search for a key or value and jump between matches, and copy the JSONPath (for example $.items[0].id) of any node.",
    },
    privacyFaq,
  ],
  related: ["js-formatter", "js-minifier", "css-formatter"],
};
