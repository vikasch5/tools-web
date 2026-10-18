const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

export function byteLength(text: string) {
  return encoder ? encoder.encode(text).length : text.length;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** 0-based offsets of the start and end of a 1-based line. */
export function lineRange(text: string, line: number) {
  let start = 0;
  for (let current = 1; current < line; current++) {
    const next = text.indexOf("\n", start);
    if (next === -1) break;
    start = next + 1;
  }
  const end = text.indexOf("\n", start);
  return { start, end: end === -1 ? text.length : end };
}
