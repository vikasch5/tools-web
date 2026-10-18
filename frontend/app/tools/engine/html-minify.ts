import type { EngineError, EngineOptions, EngineResult } from "./types";

/**
 * Whitespace next to these tags never renders, so it can be dropped rather
 * than collapsed. Inline elements (a, span, strong…) are left out because
 * the space beside them is visible text.
 */
const BLOCK = new Set(
  (
    "html head body title meta link base script style noscript template " +
    "address article aside blockquote details summary dialog dd div dl dt " +
    "fieldset legend figcaption figure footer form h1 h2 h3 h4 h5 h6 header " +
    "hgroup hr li main nav ol p pre section table caption colgroup col thead " +
    "tbody tfoot tr td th ul option optgroup select br iframe video audio " +
    "source track picture canvas svg"
  ).split(" "),
);

/** Elements whose contents are kept byte-for-byte (or handed to a minifier). */
const RAW = /^<(script|style|pre|textarea)\b/i;

const TOKEN = new RegExp(
  [
    "<!--[\\s\\S]*?-->",
    "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
    "<![^>]*>",
    "<(script|style|pre|textarea)\\b(?:\"[^\"]*\"|'[^']*'|[^>\"'])*>[\\s\\S]*?<\\/\\1\\s*>",
    "<\\/?[a-zA-Z][\\w:-]*(?:\"[^\"]*\"|'[^']*'|[^>\"'])*>",
  ].join("|"),
  "gi",
);

type Token = { kind: "text" | "comment" | "tag" | "raw" | "other"; value: string; name?: string; closing?: boolean };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of input.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ kind: "text", value: input.slice(last, index) });
    const value = match[0];
    if (value.startsWith("<!--")) tokens.push({ kind: "comment", value });
    else if (value.startsWith("<!")) tokens.push({ kind: "other", value });
    else {
      const name = /^<\/?([a-zA-Z][\w:-]*)/.exec(value)?.[1].toLowerCase();
      tokens.push({ kind: RAW.test(value) ? "raw" : "tag", value, name, closing: value.startsWith("</") });
    }
    last = index + value.length;
  }
  if (last < input.length) tokens.push({ kind: "text", value: input.slice(last) });
  return tokens;
}

/** Collapses whitespace between attributes, leaving quoted values untouched. */
function minifyTag(tag: string) {
  return tag
    .replace(/("[^"]*"|'[^']*')|\s*=\s*|\s+/g, (m, quoted) =>
      quoted ?? (m.includes("=") ? "=" : " "),
    )
    .replace(/ (\/?>)$/, "$1");
}

const isBlock = (token: Token | undefined) =>
  !token || ((token.kind === "tag" || token.kind === "raw") && BLOCK.has(token.name ?? "")) ||
  token.kind === "other";

const JS_TYPES = /^(|text\/javascript|application\/javascript|module)$/i;
const JSON_TYPES = /^(application\/(ld\+)?json|importmap)$/i;

async function minifyRaw(
  token: Token,
  options: EngineOptions,
  warnings: EngineError[],
): Promise<string> {
  const match = /^(<[^>]*>)([\s\S]*?)(<\/[^>]*>)$/.exec(token.value);
  if (!match) return token.value;
  const [, open, body, close] = match;
  const openTag = minifyTag(open);
  const closeTag = `</${token.name}>`;
  if (token.name === "pre" || token.name === "textarea") return openTag + body + closeTag;
  if (!body.trim()) return openTag + closeTag;

  if (token.name === "style" && options.minifyCss !== false) {
    const { minify } = await import("csso/dist/csso.esm");
    return openTag + minify(body, { restructure: false }).css + closeTag;
  }

  if (token.name === "script") {
    const type = /\stype\s*=\s*["']?([^"'\s>]*)/i.exec(open)?.[1] ?? "";
    if (JSON_TYPES.test(type)) {
      try {
        return openTag + JSON.stringify(JSON.parse(body)) + closeTag;
      } catch {
        warnings.push({ message: `A <script type="${type}"> block is not valid JSON, so it was left as is.` });
      }
    } else if (JS_TYPES.test(type) && options.minifyJs !== false) {
      try {
        const { minify } = await import("terser");
        const result = await minify(body, { module: type === "module", format: { comments: false } });
        return openTag + (result.code ?? body) + closeTag;
      } catch (error) {
        warnings.push({ message: `An inline script could not be minified and was left as is: ${String((error as Error).message ?? error).replace(/ \(undefined\)$/, "")}` });
      }
    }
  }
  return openTag + body.trim() + closeTag;
}

export async function minifyHtml(
  input: string,
  options: EngineOptions,
): Promise<EngineResult> {
  const tokens = tokenize(input);
  const warnings: EngineError[] = [];
  const out: string[] = [];
  // Comments are removed before whitespace is judged, so neighbours are real.
  const kept = tokens.filter(
    (t) =>
      t.kind !== "comment" ||
      options.removeComments === false ||
      // Conditional comments still change behaviour in some mail clients.
      /^<!--\[if|^<!--\s*!/.test(t.value),
  );

  for (let i = 0; i < kept.length; i++) {
    const token = kept[i];
    if (token.kind === "text") {
      let text = token.value.replace(/\s+/g, " ");
      if (isBlock(kept[i - 1])) text = text.replace(/^ /, "");
      if (isBlock(kept[i + 1])) text = text.replace(/ $/, "");
      out.push(text);
    } else if (token.kind === "tag") out.push(minifyTag(token.value));
    else if (token.kind === "raw") out.push(await minifyRaw(token, options, warnings));
    else out.push(token.value.replace(/\s+/g, " "));
  }

  return {
    ok: true,
    output: out.join(""),
    message: "Minified",
    ...(warnings.length ? { warnings } : {}),
  };
}
