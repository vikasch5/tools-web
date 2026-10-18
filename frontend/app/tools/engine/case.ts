export type CaseId =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "constant"
  | "kebab"
  | "dot"
  | "swap";

export const cases: { id: CaseId; label: string; identifier: boolean }[] = [
  { id: "sentence", label: "Sentence case", identifier: false },
  { id: "lower", label: "lower case", identifier: false },
  { id: "upper", label: "UPPER CASE", identifier: false },
  { id: "title", label: "Title Case", identifier: false },
  { id: "swap", label: "sWAP cASE", identifier: false },
  { id: "camel", label: "camelCase", identifier: true },
  { id: "pascal", label: "PascalCase", identifier: true },
  { id: "snake", label: "snake_case", identifier: true },
  { id: "constant", label: "CONSTANT_CASE", identifier: true },
  { id: "kebab", label: "kebab-case", identifier: true },
  { id: "dot", label: "dot.case", identifier: true },
];

/** Short words kept lower case in titles, unless they start a line or sentence. */
const MINOR = new Set(
  "a an and as at but by for from in into nor of on onto or over per the to up via vs with".split(" "),
);

const WORD = /[\p{L}\p{N}][\p{L}\p{M}\p{N}'’]*/gu;
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

/** Splits "parseHTTPResponse_v2-final" into ["parse", "http", "response", "v2", "final"]. */
export function splitWords(text: string) {
  return text
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function titleCase(line: string) {
  let first = true;
  return line.toLowerCase().replace(WORD, (word, offset: number, all: string) => {
    const afterBreak = /[.:!?—–]\s*$/.test(all.slice(0, offset));
    const end = !/[\p{L}\p{N}]/u.test(all.slice(offset + word.length));
    const keepLower = MINOR.has(word) && !first && !afterBreak && !end;
    first = false;
    return keepLower ? word : cap(word);
  });
}

function sentenceCase(text: string) {
  return text
    .toLowerCase()
    .replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase())
    .replace(/\bi\b/g, "I");
}

function identifier(line: string, id: CaseId) {
  const words = splitWords(line);
  if (!words.length) return line;
  switch (id) {
    case "camel":
      return words[0] + words.slice(1).map(cap).join("");
    case "pascal":
      return words.map(cap).join("");
    case "snake":
      return words.join("_");
    case "constant":
      return words.join("_").toUpperCase();
    case "kebab":
      return words.join("-");
    default:
      return words.join(".");
  }
}

/** Converts text; identifier cases work line by line, so lists stay lists. */
export function convertCase(text: string, id: CaseId) {
  switch (id) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "sentence":
      return sentenceCase(text);
    case "title":
      return text.split("\n").map(titleCase).join("\n");
    case "swap":
      return [...text].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("");
    default:
      return text.split("\n").map((line) => identifier(line, id)).join("\n");
  }
}
