import type { EngineAction, EngineOptions, EngineResult } from "./types";
import { offsetToLineColumn } from "./json";

/**
 * Percent-encoding. "component" escapes everything except unreserved
 * characters (for a query value or path segment); "uri" keeps the
 * characters that structure a URL (: / ? # & =); "form" is component
 * encoding with spaces as "+", as HTML forms submit them.
 */
export function encodeUrl(input: string, mode: string) {
  if (mode === "uri") return encodeURI(input);
  // encodeURIComponent leaves !'()* alone; RFC 3986 reserves them.
  const encoded = encodeURIComponent(input).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
  return mode === "form" ? encoded.replace(/%20/g, "+") : encoded;
}

export function decodeUrl(input: string, mode: string) {
  const source = mode === "form" ? input.replace(/\+/g, " ") : input;
  const bad = source.search(/%(?![0-9a-fA-F]{2})/);
  if (bad >= 0) throw Object.assign(new Error("“%” must be followed by two hex digits, such as %20."), { offset: bad });
  try {
    return decodeURIComponent(source);
  } catch {
    // Valid escapes that are not UTF-8: find the first one that fails.
    const match = [...source.matchAll(/(%[0-9a-fA-F]{2})+/g)].find((m) => {
      try {
        decodeURIComponent(m[0]);
        return false;
      } catch {
        return true;
      }
    });
    throw Object.assign(new Error("These escapes are not valid UTF-8."), { offset: match?.index ?? 0 });
  }
}

const safeDecode = (text: string) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

/** Splits a URL into its parts, with query parameters decoded. */
export function parseUrl(input: string) {
  const text = input.trim();
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error("This is not a complete URL. Include the scheme, such as https://.");
  }
  const params: [string, string][] = [...url.searchParams];
  return {
    protocol: url.protocol.replace(/:$/, ""),
    ...(url.username ? { username: safeDecode(url.username) } : {}),
    ...(url.password ? { password: "(hidden)" } : {}),
    host: url.hostname,
    ...(url.port ? { port: url.port } : {}),
    path: safeDecode(url.pathname),
    query: Object.fromEntries(
      [...new Set(params.map(([k]) => k))].map((key) => {
        const values = url.searchParams.getAll(key);
        return [key, values.length === 1 ? values[0] : values];
      }),
    ),
    ...(url.hash ? { fragment: safeDecode(url.hash.slice(1)) } : {}),
  };
}

export function runUrl(action: EngineAction, input: string, options: EngineOptions): EngineResult {
  const mode = String(options.mode ?? "component");
  try {
    if (action === "decode") return { ok: true, output: decodeUrl(input, mode), message: "Decoded" };
    if (action === "parse")
      return { ok: true, output: JSON.stringify(parseUrl(input), null, 2), message: "Parsed URL" };
    return { ok: true, output: encodeUrl(input, mode), message: "Encoded" };
  } catch (error) {
    const e = error as Error & { offset?: number };
    return {
      ok: false,
      error: { message: e.message, ...(e.offset === undefined ? {} : offsetToLineColumn(input, e.offset)) },
    };
  }
}
