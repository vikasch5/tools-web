import { base64ToBytes } from "./base64";
import type { EngineError, EngineResult } from "./types";

const decoder = new TextDecoder("utf-8", { fatal: true });

function decodePart(part: string, name: string) {
  let text: string;
  try {
    text = decoder.decode(base64ToBytes(part));
  } catch {
    throw new Error(`The ${name} is not valid Base64URL.`);
  }
  try {
    const value = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new Error(`The ${name} does not decode to a JSON object.`);
  }
}

const utc = (seconds: number) =>
  new Date(seconds * 1000).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

/**
 * Decodes (never verifies) a JWS compact token. Time claims are checked
 * against `now` so expired or not-yet-valid tokens are flagged.
 */
export function decodeJwt(input: string, now = Date.now()): EngineResult {
  const token = input.trim().replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length === 5)
    return {
      ok: false,
      error: {
        message:
          "This looks like an encrypted token (JWE). Its payload cannot be read without the key.",
      },
    };
  if (parts.length !== 3)
    return {
      ok: false,
      error: {
        message: `A JWT has three parts separated by dots; this input has ${parts.length}.`,
      },
    };

  try {
    const header = decodePart(parts[0], "header");
    const payload = decodePart(parts[1], "payload");
    const warnings: EngineError[] = [];
    const notes: string[] = [];
    const seconds = now / 1000;
    if (typeof payload.iat === "number") notes.push(`issued ${utc(payload.iat)}`);
    if (typeof payload.exp === "number") {
      notes.push(`expires ${utc(payload.exp)}`);
      if (payload.exp < seconds)
        warnings.push({ message: `The token expired on ${utc(payload.exp)}.` });
    }
    if (typeof payload.nbf === "number" && payload.nbf > seconds)
      warnings.push({ message: `The token is not valid before ${utc(payload.nbf)}.` });
    if (String(header.alg).toLowerCase() === "none")
      warnings.push({ message: "The algorithm is “none”: this token is unsigned." });

    const output = JSON.stringify(
      { header, payload, signature: parts[2] },
      null,
      2,
    );
    return {
      ok: true,
      output,
      message: ["Decoded (signature not verified)", ...notes].join(" · "),
      ...(warnings.length ? { warnings } : {}),
    };
  } catch (error) {
    return { ok: false, error: { message: (error as Error).message } };
  }
}
