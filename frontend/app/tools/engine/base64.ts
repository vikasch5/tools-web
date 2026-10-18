import type { EngineAction, EngineOptions, EngineResult } from "./types";

/** Base64 of the UTF-8 bytes of a string. */
export function encodeBase64(text: string, urlSafe = false) {
  const bytes = new TextEncoder().encode(text);
  return bytesToBase64(bytes, urlSafe);
}

export function bytesToBase64(bytes: Uint8Array, urlSafe = false) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const b64 = btoa(binary);
  return urlSafe
    ? b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : b64;
}

/**
 * Accepts standard and URL-safe alphabets, missing padding and embedded
 * whitespace or line breaks. Throws with the position of the first invalid
 * character.
 */
export function base64ToBytes(input: string) {
  const compact = input.replace(/\s+/g, "");
  const bad = compact.search(/[^A-Za-z0-9+/\-_=]/);
  if (bad >= 0)
    throw new Error(
      `“${compact[bad]}” is not a Base64 character (position ${bad + 1}).`,
    );
  const body = compact.replace(/=+$/, "");
  if (body.includes("="))
    throw new Error("Padding (=) can only appear at the end.");
  if (body.length % 4 === 1)
    throw new Error("The input is truncated: its length is not valid Base64.");
  const standard = body.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(standard + "=".repeat((4 - (standard.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function decodeBase64(input: string) {
  const bytes = base64ToBytes(input);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(
      `Decoded ${bytes.length.toLocaleString("en")} bytes, but they are not UTF-8 text. The data is probably a binary file such as an image.`,
    );
  }
}

export function runBase64(
  action: EngineAction,
  input: string,
  options: EngineOptions,
): EngineResult {
  try {
    if (action === "decode")
      return { ok: true, output: decodeBase64(input), message: "Decoded" };
    let output = encodeBase64(input, options.urlSafe === true);
    if (options.wrap === true) output = output.replace(/(.{76})(?=.)/g, "$1\n");
    return { ok: true, output, message: "Encoded" };
  } catch (error) {
    return { ok: false, error: { message: (error as Error).message } };
  }
}
