import { offsetToLineColumn } from "./json";
import type { EngineError } from "./types";

const VOID = new Set(
  "area base br col embed hr img input link meta param source track wbr".split(
    " ",
  ),
);
/** Elements whose end tag HTML allows you to omit. */
const OPTIONAL_END = new Set(
  "p li dt dd option optgroup tr td th thead tbody tfoot colgroup caption rt rp html head body".split(
    " ",
  ),
);
/** Elements whose content is raw text (no tags inside). */
const RAW_TEXT = new Set(["script", "style", "textarea", "title"]);

const MAX_WARNINGS = 20;

/**
 * Finds markup mistakes that browsers (and Prettier) silently "repair",
 * so the formatted output would otherwise look surprising:
 * - "<" followed by whitespace, e.g. `<   /p>`, which is plain text, not a tag
 * - elements that are opened but never closed
 * Stray closing tags are already reported as errors by the parser.
 */
export function lintHtml(source: string): EngineError[] {
  const found: { offset: number; message: string }[] = [];
  const stack: { name: string; offset: number }[] = [];
  let i = 0;

  const reportUnclosed = (from: number) => {
    for (const open of stack.slice(from)) {
      if (!OPTIONAL_END.has(open.name)) {
        found.push({
          offset: open.offset,
          message: `<${open.name}> is opened here but never closed, so the formatter closes it automatically.`,
        });
      }
    }
    stack.length = from;
  };

  while (i < source.length && found.length < MAX_WARNINGS) {
    const lt = source.indexOf("<", i);
    if (lt === -1) break;

    if (source.startsWith("<!--", lt)) {
      const end = source.indexOf("-->", lt + 4);
      i = end === -1 ? source.length : end + 3;
      continue;
    }
    if (source.startsWith("<!", lt) || source.startsWith("<?", lt)) {
      const end = source.indexOf(">", lt);
      i = end === -1 ? source.length : end + 1;
      continue;
    }

    const head = source.slice(lt, lt + 120);
    const tag = /^<(\/?)([A-Za-z][\w:-]*)/.exec(head);
    if (!tag) {
      const spaced = /^<(\s+)(\/?)([A-Za-z][\w:-]*)[^<>]*>/.exec(head);
      if (spaced) {
        found.push({
          offset: lt,
          message: `“${spaced[0].replace(/\s+/g, " ")}” is not a tag because of the space after “<”, so it is kept as text. Did you mean <${spaced[2]}${spaced[3]}>?`,
        });
      }
      i = lt + 1;
      continue;
    }

    // Find the end of the tag, ignoring ">" inside quoted attribute values.
    let j = lt + tag[0].length;
    let quote: string | null = null;
    for (; j < source.length; j++) {
      const ch = source[j];
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === ">") break;
    }
    if (j >= source.length) {
      found.push({
        offset: lt,
        message: `The tag <${tag[2]} is missing its closing “>”.`,
      });
      break;
    }

    const name = tag[2].toLowerCase();
    const closing = tag[1] === "/";
    const selfClosing = source[j - 1] === "/";

    if (!closing) {
      if (!VOID.has(name) && !selfClosing) stack.push({ name, offset: lt });
      if (RAW_TEXT.has(name)) {
        const end = source.toLowerCase().indexOf(`</${name}`, j + 1);
        i = end === -1 ? source.length : end;
        continue;
      }
    } else {
      const index = stack.map((s) => s.name).lastIndexOf(name);
      if (index !== -1) {
        reportUnclosed(index + 1);
        stack.length = index;
      }
    }
    i = j + 1;
  }
  reportUnclosed(0);

  return found
    .sort((a, b) => a.offset - b.offset)
    .slice(0, MAX_WARNINGS)
    .map(({ offset, message }) => ({
      message,
      ...offsetToLineColumn(source, offset),
    }));
}

/** Standard HTML element names, used to recognise broken tags safely. */
const HTML_ELEMENTS = new Set(
  (
    "a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup " +
    "data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 " +
    "head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript " +
    "object ol optgroup option output p param picture pre progress q rp rt ruby s samp script search section select slot " +
    "small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u " +
    "ul var video wbr svg path g circle rect line polyline polygon"
  ).split(" "),
);

/**
 * Repairs tags broken by whitespace after "<", e.g. `<   /p>` or `< div class="x">`,
 * but only for real HTML element names so text like `a < b` is untouched.
 * Returns the repaired source and a note for each fix (positions refer to
 * the original input).
 */
export function fixHtml(source: string): {
  fixed: string;
  fixes: EngineError[];
} {
  const fixes: EngineError[] = [];
  const pattern = /<(\s+)(\/?)([A-Za-z][\w-]*)(\s[^<>]*)?>/g;
  const fixed = source.replace(
    pattern,
    (match, _space, slash, name, rest, offset) => {
      if (!HTML_ELEMENTS.has(String(name).toLowerCase())) return match;
      const repaired = `<${slash}${name}${rest ?? ""}>`;
      fixes.push({
        message: `Fixed “${match.replace(/\s+/g, " ")}” → “${repaired}”.`,
        ...offsetToLineColumn(source, offset),
      });
      return repaired;
    },
  );
  return { fixed, fixes };
}
