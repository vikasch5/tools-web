import { createZip } from "./zip";

/** One run of text on a PDF page, as pdf.js reports it (y grows upwards). */
export type TextItem = { text: string; x: number; y: number; width: number; size: number; bold: boolean; italic: boolean };
export type TextPage = { width: number; height: number; items: TextItem[] };

export type Run = { text: string; bold: boolean; italic: boolean; size: number };
export type Block = { kind: "heading1" | "heading2" | "paragraph" | "list"; runs: Run[]; align: "left" | "center" };
export type WordPage = { width: number; height: number; blocks: Block[] };

type Line = { y: number; x: number; right: number; size: number; runs: Run[] };

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

const sameStyle = (a: Run, b: Run) => a.bold === b.bold && a.italic === b.italic && Math.abs(a.size - b.size) < 0.5;

function pushRun(runs: Run[], run: Run) {
  const last = runs[runs.length - 1];
  if (last && sameStyle(last, run)) last.text += run.text;
  else runs.push({ ...run });
}

/** Items on (about) the same baseline become one line, left to right, with spaces where there are gaps. */
function toLines(items: TextItem[]) {
  const sorted = items.filter((i) => i.text.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: { y: number; size: number; items: TextItem[] }[] = [];
  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l.y - item.y) <= Math.max(l.size, item.size) * 0.4);
    if (line) {
      line.items.push(item);
      line.size = Math.max(line.size, item.size);
    } else lines.push({ y: item.y, size: item.size, items: [item] });
  }
  return lines
    .sort((a, b) => b.y - a.y)
    .map<Line>((l) => {
      const parts = l.items.sort((a, b) => a.x - b.x);
      const runs: Run[] = [];
      let end = parts[0].x;
      parts.forEach((p, i) => {
        const gap = p.x - end;
        const prev = runs[runs.length - 1]?.text ?? "";
        const space = i > 0 && gap > p.size * 0.15 && !/\s$/.test(prev) && !/^\s/.test(p.text) ? " " : "";
        pushRun(runs, { text: space + p.text, bold: p.bold, italic: p.italic, size: p.size });
        end = Math.max(end, p.x + p.width);
      });
      return { y: l.y, x: parts[0].x, right: end, size: l.size, runs };
    });
}

const BULLET = /^\s*([•●▪◦‣\-–*]|\d{1,3}[.)]|[a-z][.)])\s+/i;

/**
 * Turns a page's text into headings and paragraphs. Lines join into a
 * paragraph while their spacing and size stay alike; text clearly larger
 * than the body size becomes a heading; lines starting with a bullet or a
 * number start list items.
 */
export function pageBlocks(page: TextPage, bodySize: number): Block[] {
  const lines = toLines(page.items);
  const blocks: Block[] = [];
  let current: { block: Block; last: Line } | null = null;
  const kindOf = (line: Line): Block["kind"] => {
    if (line.size >= bodySize * 1.6) return "heading1";
    if (line.size >= bodySize * 1.2) return "heading2";
    return BULLET.test(line.runs[0].text) ? "list" : "paragraph";
  };
  for (const line of lines) {
    const kind = kindOf(line);
    const centred =
      line.x > page.width * 0.15 && Math.abs((line.x + line.right) / 2 - page.width / 2) < page.width * 0.04;
    const gap = current ? current.last.y - line.y : 0;
    const joins =
      current &&
      kind !== "list" &&
      (current.block.kind === kind || (current.block.kind === "list" && kind === "paragraph")) &&
      Math.abs(current.last.size - line.size) < 0.6 &&
      gap < Math.max(current.last.size, line.size) * 1.75;
    if (joins && current) {
      const runs = current.block.runs;
      const last = runs[runs.length - 1];
      // Rejoin words hyphenated at the end of a line.
      if (/[a-z]-$/i.test(last.text) && /^[a-z]/.test(line.runs[0].text)) last.text = last.text.slice(0, -1);
      else if (!/\s$/.test(last.text)) last.text += " ";
      for (const run of line.runs) pushRun(runs, run);
      if (!centred) current.block.align = "left";
      current.last = line;
    } else {
      const runs: Run[] = [];
      for (const run of line.runs) pushRun(runs, run);
      if (kind === "list") runs[0].text = runs[0].text.replace(/^\s+/, "");
      const block: Block = { kind, runs, align: centred ? "center" : "left" };
      blocks.push(block);
      current = { block, last: line };
    }
  }
  for (const block of blocks) {
    const last = block.runs[block.runs.length - 1];
    last.text = last.text.replace(/\s+$/, "");
  }
  return blocks;
}

/** The most common text size, weighted by characters: the body text. */
export function bodyTextSize(pages: TextPage[]) {
  const weight = new Map<number, number>();
  for (const page of pages)
    for (const item of page.items) {
      const size = Math.round(item.size * 2) / 2;
      weight.set(size, (weight.get(size) ?? 0) + item.text.trim().length);
    }
  let best = 0;
  let most = -1;
  for (const [size, w] of weight) if (w > most || (w === most && size < best)) [best, most] = [size, w];
  return best || median(pages.flatMap((p) => p.items.map((i) => i.size))) || 11;
}

export function textToWordPages(pages: TextPage[]): WordPage[] {
  const characters = pages.reduce((n, p) => n + p.items.reduce((m, i) => m + i.text.trim().length, 0), 0);
  if (characters < 10)
    throw new Error(
      "No text was found in this PDF. It is probably a scan or a picture of text, which needs OCR (text recognition). This tool only converts PDFs with real text.",
    );
  const body = bodyTextSize(pages);
  return pages.map((p) => ({ width: p.width, height: p.height, blocks: pageBlocks(p, body) }));
}

/** A one-line description of the converted text, used for examples and the status line. */
export function describeBlocks(pages: WordPage[]) {
  const blocks = pages.flatMap((p) => p.blocks);
  const count = (kind: Block["kind"]) => blocks.filter((b) => b.kind === kind).length;
  const headings = count("heading1") + count("heading2");
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return [
    plural(pages.length, "page"),
    plural(headings, "heading"),
    plural(count("paragraph"), "paragraph"),
    ...(count("list") ? [plural(count("list"), "list item")] : []),
  ].join(", ");
}

/* ---------- .docx writer ---------- */

// Characters XML 1.0 does not allow, which some PDFs contain.
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
const xml = (text: string) =>
  text.replace(INVALID_XML, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const twips = (points: number) => Math.round(points * 20);

function runXml(run: Run, bodySize: number, inHeading: boolean) {
  const props = [
    run.bold && !inHeading ? "<w:b/>" : "",
    run.italic ? "<w:i/>" : "",
    !inHeading && Math.abs(run.size - bodySize) >= 1 ? `<w:sz w:val="${Math.round(run.size * 2)}"/>` : "",
  ].join("");
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}<w:t xml:space="preserve">${xml(run.text)}</w:t></w:r>`;
}

const styleIds: Record<Block["kind"], string> = {
  heading1: "Heading1",
  heading2: "Heading2",
  paragraph: "Normal",
  list: "ListParagraph",
};

function blockXml(block: Block, bodySize: number, pageBreakBefore: boolean) {
  const heading = block.kind.startsWith("heading");
  const props = [
    `<w:pStyle w:val="${styleIds[block.kind]}"/>`,
    pageBreakBefore ? "<w:pageBreakBefore/>" : "",
    block.align === "center" ? '<w:jc w:val="center"/>' : "",
  ].join("");
  return `<w:p><w:pPr>${props}</w:pPr>${block.runs.map((r) => runXml(r, bodySize, heading)).join("")}</w:p>`;
}

function stylesXml(bodySize: number) {
  const half = (pt: number) => Math.round(pt * 2);
  const style = (id: string, name: string, extra: string, run: string) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr>${extra}</w:pPr><w:rPr>${run}</w:rPr></w:style>`;
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="${half(bodySize)}"/><w:szCs w:val="${half(bodySize)}"/></w:rPr></w:rPrDefault>` +
    '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    style("Heading1", "heading 1", '<w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/>', `<w:b/><w:sz w:val="${half(bodySize * 1.8)}"/>`) +
    style("Heading2", "heading 2", '<w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/>', `<w:b/><w:sz w:val="${half(bodySize * 1.35)}"/>`) +
    style("ListParagraph", "List Paragraph", '<w:spacing w:after="60"/><w:ind w:left="360" w:hanging="360"/>', "") +
    "</w:styles>"
  );
}

/** A Word document (.docx) with each PDF page starting on a new page. */
export function buildDocx(pages: WordPage[], bodySize: number) {
  const first = pages[0] ?? { width: 612, height: 792 };
  const body = pages
    .flatMap((page, p) => page.blocks.map((block, b) => blockXml(block, bodySize, p > 0 && b === 0)))
    .join("");
  const landscape = first.width > first.height;
  const margin = 1080; // 0.75 in
  const document =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<w:body>${body || "<w:p/>"}<w:sectPr><w:pgSz w:w="${twips(first.width)}" w:h="${twips(first.height)}"${landscape ? ' w:orient="landscape"' : ""}/>` +
    `<w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const encoder = new TextEncoder();
  const files = {
    "[Content_Types].xml":
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    "_rels/.rels":
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    "word/_rels/document.xml.rels":
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "word/document.xml": document,
    "word/styles.xml": stylesXml(bodySize),
  };
  return createZip(Object.entries(files).map(([name, text]) => ({ name, data: encoder.encode(text) })));
}

export const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const kindLabels: Record<Block["kind"], string> = {
  heading1: "Heading 1",
  heading2: "Heading 2",
  paragraph: "Paragraph",
  list: "List item",
};

/** The converted structure, one block per line, e.g. "Heading 1: Annual report". */
export function describeOutline(pages: WordPage[]) {
  return pages
    .flatMap((p) => p.blocks)
    .map((b) => `${kindLabels[b.kind]}: ${b.runs.map((r) => r.text).join("")}`)
    .join("\n");
}

/** How a Word file becomes PDF pages, depending on whether it carries Word's own page breaks. */
export function describeWordLayout(savedPageBreaks: boolean) {
  return savedPageBreaks
    ? "Pages break where Word breaks them; headers and footers are kept"
    : "Your browser splits the text into pages; headers and footers are left out";
}

/**
 * Pages are often stored sideways, with text running up or down the
 * displayed page. `angle` is each item's reading direction in degrees
 * (counter-clockwise, y up). The page is turned so that its most common
 * direction reads left to right, which line grouping relies on.
 */
export function turnUpright(width: number, height: number, items: (TextItem & { angle: number })[]): TextPage {
  const weight = new Map<number, number>();
  for (const item of items) {
    const q = (((Math.round(item.angle / 90) * 90) % 360) + 360) % 360;
    weight.set(q, (weight.get(q) ?? 0) + item.text.trim().length);
  }
  let turn = 0;
  let most = -1;
  for (const [q, w] of weight) if (w > most) [turn, most] = [q, w];
  const map = (x: number, y: number): [number, number] => {
    switch (turn) {
      case 90:
        return [y, width - x];
      case 180:
        return [width - x, height - y];
      case 270:
        return [height - y, x];
      default:
        return [x, y];
    }
  };
  const sideways = turn === 90 || turn === 270;
  return {
    width: sideways ? height : width,
    height: sideways ? width : height,
    items: items.map(({ angle: _angle, ...item }) => {
      const [x, y] = map(item.x, item.y);
      return { ...item, x, y };
    }),
  };
}

/**
 * Word's usual bullets are private-use characters in the Symbol and
 * Wingdings fonts, which only Windows has. Mapped to standard characters
 * they show everywhere.
 */
const symbolBullets: Record<string, string> = {
  "": "•",
  "": "▪",
  "": "◆",
  "": "➢",
  "": "❖",
  "": "✓",
  "": "■",
  "": "□",
  "": "➔",
};

/** Rewrites list-marker CSS generated for a Word file so bullets need no Symbol or Wingdings font. */
export function portableBullets(css: string) {
  return css.replace(/:before\s*\{[^}]*\}/g, (rule) => {
    if (!/[-]/.test(rule)) return rule;
    return rule
      .replace(/[-]/g, (c) => symbolBullets[c] ?? "•")
      .replace(/font-family:\s*(Symbol|Wingdings[^;]*);?/gi, "");
  });
}
