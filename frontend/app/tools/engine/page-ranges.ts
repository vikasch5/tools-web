/**
 * Parses "1-3, 5, 8-" into groups of 0-based page indexes. Throws a
 * readable error for pages outside 1..pageCount.
 */
export function parsePageRanges(input: string, pageCount: number): number[][] {
  const parts = input.split(/[,;\s]+/).filter(Boolean);
  if (parts.length === 0) throw new Error("Enter at least one page or range, e.g. 1-3, 5.");
  return parts.map((part) => {
    const m = part.match(/^(\d*)(?:(-|–)(\d*))?$/);
    if (!m || (m[1] === "" && !m[2])) throw new Error(`“${part}” is not a page or range.`);
    const from = m[1] === "" ? 1 : Number(m[1]);
    const to = m[2] ? (m[3] === "" ? pageCount : Number(m[3])) : from;
    for (const page of [from, to])
      if (page < 1 || page > pageCount)
        throw new Error(`Page ${page} does not exist; this PDF has ${pageCount} ${pageCount === 1 ? "page" : "pages"}.`);
    if (from > to) throw new Error(`“${part}” runs backwards. Write it as ${to}-${from}.`);
    return Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
  });
}

/** Writes 0-based page indexes as 1-based ranges: [0, 1, 2, 4] → "1-3, 5". */
export function formatPageRanges(indexes: Iterable<number>) {
  const sorted = [...new Set(indexes)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j > i ? `${sorted[i] + 1}-${sorted[j] + 1}` : `${sorted[i] + 1}`);
    i = j;
  }
  return parts.join(", ");
}
