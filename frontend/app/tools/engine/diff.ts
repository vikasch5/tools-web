export type DiffLine =
  | { type: "equal"; text: string; a: number; b: number }
  | { type: "remove"; text: string; a: number }
  | { type: "add"; text: string; b: number };

export type DiffOptions = { ignoreWhitespace?: boolean; ignoreCase?: boolean };

export type DiffResult = {
  lines: DiffLine[];
  added: number;
  removed: number;
  /** True when the inputs only differ in ignored ways (or not at all). */
  identical: boolean;
};

const splitLines = (text: string) =>
  text === "" ? [] : text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");

/**
 * Line diff using Myers' O(ND) algorithm, so large files with few changes
 * stay fast. Lines are compared after the chosen normalisation; output
 * shows the original text.
 */
export function diffLines(
  original: string,
  changed: string,
  options: DiffOptions = {},
): DiffResult {
  const a = splitLines(original);
  const b = splitLines(changed);
  const norm = (line: string) => {
    let s = line;
    if (options.ignoreWhitespace) s = s.trim().replace(/\s+/g, " ");
    if (options.ignoreCase) s = s.toLowerCase();
    return s;
  };
  const na = a.map(norm);
  const nb = b.map(norm);

  // Skip the common prefix and suffix before running Myers.
  let start = 0;
  while (start < na.length && start < nb.length && na[start] === nb[start]) start++;
  let endA = na.length;
  let endB = nb.length;
  while (endA > start && endB > start && na[endA - 1] === nb[endB - 1]) {
    endA--;
    endB--;
  }

  const ops = myers(na.slice(start, endA), nb.slice(start, endB));
  const lines: DiffLine[] = [];
  for (let i = 0; i < start; i++) lines.push({ type: "equal", text: b[i], a: i + 1, b: i + 1 });
  let i = start;
  let j = start;
  for (const op of ops) {
    if (op === 0) {
      lines.push({ type: "equal", text: b[j], a: i + 1, b: j + 1 });
      i++;
      j++;
    } else if (op < 0) {
      lines.push({ type: "remove", text: a[i], a: i + 1 });
      i++;
    } else {
      lines.push({ type: "add", text: b[j], b: j + 1 });
      j++;
    }
  }
  for (; i < a.length; i++, j++) lines.push({ type: "equal", text: b[j], a: i + 1, b: j + 1 });

  const added = lines.filter((l) => l.type === "add").length;
  const removed = lines.filter((l) => l.type === "remove").length;
  return { lines, added, removed, identical: added === 0 && removed === 0 };
}

/** Edit script: 0 keep, -1 delete from a, 1 insert from b. */
function myers(a: string[], b: string[]): number[] {
  const n = a.length;
  const m = b.length;
  if (n === 0) return Array(m).fill(1);
  if (m === 0) return Array(n).fill(-1);
  const max = n + m;
  const offset = max;
  const v = new Int32Array(2 * max + 2);
  // Snapshot only diagonals -d..d before each round, keeping memory ~D².
  const trace: Int32Array[] = [];
  outer: for (let d = 0; d <= max; d++) {
    trace.push(v.slice(offset - d, offset + d + 1));
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
          ? v[offset + k + 1]
          : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) break outer;
    }
  }

  // Walk the trace backwards to recover the path.
  const ops: number[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d > 0; d--) {
    const vd = trace[d];
    const k = x - y;
    const at = (diagonal: number) => vd[diagonal + d];
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push(0);
      x--;
      y--;
    }
    ops.push(x === prevX ? 1 : -1);
    x = prevX;
    y = prevY;
  }
  while (x > 0 && y > 0) {
    ops.push(0);
    x--;
    y--;
  }
  return ops.reverse();
}

/** Unified-diff style text (" ", "-", "+" prefixes), used for copy and examples. */
export function diffToText(result: DiffResult) {
  return result.lines
    .map((l) => `${l.type === "add" ? "+" : l.type === "remove" ? "-" : " "} ${l.text}`)
    .join("\n");
}
