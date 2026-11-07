/**
 * Draws an invoice, quotation or proforma invoice as an A4 PDF with pdf-lib
 * (runs in the engine worker). Four templates share one body, so GST details
 * and pagination are the same in each; only the header, table and total differ.
 * Long item lists continue on more pages with the table header repeated.
 * Geist and Source Serif are embedded, subset to what validateInvoice allows.
 */
import type { PDFFont, PDFImage, PDFPage, RGB } from "pdf-lib";
import {
  accentRgb,
  displayDate,
  invoiceTotals,
  kindTitle,
  normalTemplate,
  stateLabel,
  validateInvoice,
  type Accent,
  type InvoiceDoc,
  type Template,
} from "./invoice";
import { encodeQr, upiPayload } from "./qr";
import geistRegular from "./fonts/Geist-Regular.ttf?inline";
import geistSemiBold from "./fonts/Geist-SemiBold.ttf?inline";
import serifSemiBold from "./fonts/SourceSerif4-SemiBold.ttf?inline";

export type InvoiceBranding = { logo?: string; signature?: string; template: Template | "modern"; accent: Accent };
/** `draft` skips validation, for the on-screen preview of an unfinished document. Downloads never set it. */
export type InvoicePdfInput = { doc: InvoiceDoc; branding: InvoiceBranding; draft?: boolean };

const W = 595.28;
const H = 841.89;
const M = 40;
const CONTENT = W - 2 * M;
export { displayDate };

const plain = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pdfMoney = (n: number) => `₹${plain(n)}`;
const qtyText = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 3 });
const rateText = (n: number) => `${n.toLocaleString("en-IN", { maximumFractionDigits: 3 })}%`;

/** The soft hyphen is invisible and is not in the embedded fonts. */
const clean = (s: string) => (s ?? "").replace(/\r|­/g, "").replace(/\t/g, " ");

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function dataUrlBytes(url: string) {
  const comma = url.indexOf(",");
  const bin = atob(url.slice(comma + 1));
  return { type: url.slice(5, url.indexOf(";")), bytes: Uint8Array.from(bin, (c) => c.charCodeAt(0)) };
}

export async function buildInvoicePdf({ doc, branding, draft }: InvoicePdfInput) {
  const problems = validateInvoice(doc);
  // Even a draft must stop on other scripts: the embedded font would print empty boxes.
  const blocking = draft ? problems.find((p) => p.field === "text") : problems[0];
  if (blocking) throw new Error(blocking.message);
  const [{ PDFDocument, rgb }, { default: fontkit }] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit")]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const t = invoiceTotals(doc);
  const title = titleCase(kindTitle(doc.kind, doc.seller.gstRegistered));
  pdf.setTitle(`${title} ${doc.number} – ${clean(doc.buyer.name)}`);
  pdf.setAuthor(clean(doc.seller.name));
  pdf.setCreator("AllToolsDesk Invoice Generator");
  const font = await pdf.embedFont(dataUrlBytes(geistRegular).bytes, { subset: true });
  const bold = await pdf.embedFont(dataUrlBytes(geistSemiBold).bytes, { subset: true });
  const serif = await pdf.embedFont(dataUrlBytes(serifSemiBold).bytes, { subset: true });
  const serifChars = new Set(serif.getCharacterSet());
  /** The Elegant headings use the serif, unless the text has a character it lacks (such as the rupee sign). */
  const display = (s: string) => (template === "elegant" && [...s].every((c) => serifChars.has(c.codePointAt(0) as number)) ? serif : bold);

  const template = normalTemplate(branding.template);
  const isClean = template === "clean";
  const isElegant = template === "elegant";
  const isBold = template === "bold";
  const isClassic = template === "classic";

  const [ar, ag, ab] = isClassic ? [0.11, 0.11, 0.13] : accentRgb(branding.accent);
  const luminance = 0.2126 * ar + 0.7152 * ag + 0.0722 * ab;
  const pale = luminance > 0.55;
  const scale = (k: number) => rgb(ar * k, ag * k, ab * k);
  const mix = (share: number) => rgb(ar * share + 1 - share, ag * share + 1 - share, ab * share + 1 - share);
  const ink = rgb(0.09, 0.1, 0.13);
  const muted = rgb(0.4, 0.42, 0.47);
  const line = rgb(0.89, 0.9, 0.92);
  const white = rgb(1, 1, 1);
  /** The brand colour as a fill, and what stays readable on it or on white. */
  const accent = rgb(ar, ag, ab);
  const onAccent = pale ? ink : white;
  const accentText = pale ? scale(0.5) : accent;
  const tint = isClassic ? rgb(0.95, 0.95, 0.96) : mix(0.07);
  const band = scale(0.36);
  const gst = t.supply !== "none";

  const embed = async (url?: string): Promise<PDFImage | null> => {
    if (!url?.startsWith("data:image/")) return null;
    try {
      const { type, bytes } = dataUrlBytes(url);
      return type === "image/png" ? await pdf.embedPng(bytes) : type === "image/jpeg" ? await pdf.embedJpg(bytes) : null;
    } catch {
      return null;
    }
  };
  const logo = await embed(branding.logo);
  const signature = await embed(branding.signature);

  /* ---- Drawing helpers */
  const wrap = (value: string, size: number, width: number, f: PDFFont = font) => {
    const out: string[] = [];
    for (const para of clean(value).split("\n")) {
      let current = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const next = current ? `${current} ${word}` : word;
        if (f.widthOfTextAtSize(next, size) <= width) {
          current = next;
          continue;
        }
        if (current) out.push(current);
        // Break words longer than the column.
        let rest = word;
        while (f.widthOfTextAtSize(rest, size) > width && rest.length > 1) {
          let cut = rest.length - 1;
          while (cut > 1 && f.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
          out.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        current = rest;
      }
      if (current || !out.length) out.push(current);
    }
    return out;
  };

  let page: PDFPage = pdf.addPage([W, H]);
  const pages: PDFPage[] = [page];
  let y = H - M;

  const text = (s: string, x: number, yy: number, size = 9, f: PDFFont = font, color: RGB = ink) => page.drawText(clean(s), { x, y: yy, size, font: f, color });
  const right = (s: string, x: number, yy: number, size = 9, f: PDFFont = font, color: RGB = ink) =>
    text(s, x - f.widthOfTextAtSize(clean(s), size), yy, size, f, color);
  const centre = (s: string, yy: number, size = 9, f: PDFFont = font, color: RGB = ink) => text(s, W / 2 - f.widthOfTextAtSize(clean(s), size) / 2, yy, size, f, color);
  const hr = (yy: number, x1 = M, x2 = W - M, color: RGB = line, thickness = 0.6) => page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness, color });
  const label = (s: string, x: number, yy: number) => text(s, x, yy, 7.5, bold, isClean || isBold ? accentText : muted);
  /** A rounded card; `top` is its upper edge. */
  const card = (x: number, top: number, width: number, height: number, fill?: RGB, border?: RGB, r = 7) => {
    const path = `M ${r} 0 H ${width - r} Q ${width} 0 ${width} ${r} V ${height - r} Q ${width} ${height} ${width - r} ${height} H ${r} Q 0 ${height} 0 ${height - r} V ${r} Q 0 0 ${r} 0 Z`;
    page.drawSvgPath(path, { x, y: top, color: fill, borderColor: border, borderWidth: border ? 0.7 : 0 });
  };

  const newPage = () => {
    page = pdf.addPage([W, H]);
    pages.push(page);
    y = H - M;
    text(`${title} ${doc.number}`, M, y - 8, 10, bold);
    right("Continued", W - M, y - 8, 8, font, muted);
    y -= 26;
  };
  /** Starts a new page when fewer than `h` points are left above the footer. */
  const ensure = (h: number) => {
    if (y - h < M + 22) newPage();
  };

  /* ---- Header */
  const due = doc.kind === "invoice" ? t.balance : t.total;
  const dueLabel = doc.kind === "invoice" ? "Amount due" : "Total";
  const facts: [string, string][] = [
    [doc.kind === "quotation" ? "Quotation no." : doc.kind === "proforma" ? "Proforma no." : "Invoice no.", doc.number],
    ["Issue date", displayDate(doc.date)],
    ...(doc.dueDate ? ([[doc.kind === "invoice" ? "Due date" : "Valid until", displayDate(doc.dueDate)]] as [string, string][]) : []),
  ];
  const original = doc.kind === "invoice" && gst ? "Original for recipient" : "";
  const drawLogo = (x: number, top: number, maxW: number, maxH: number) => {
    if (!logo) return 0;
    const s = Math.min(maxH / logo.height, maxW / logo.width);
    page.drawImage(logo, { x, y: top - logo.height * s, width: logo.width * s, height: logo.height * s });
    return logo.height * s;
  };
  /** Label above value, one column per fact, starting at x. */
  const factRow = (x: number, top: number, each: number, onDark = false) =>
    facts.forEach(([k, v], i) => {
      text(k, x + i * each, top - 18, 7.5, font, onDark ? white : muted);
      text(v, x + i * each, top - 32, 10, bold, onDark ? white : ink);
    });

  if (isBold) {
    // A full-width band in a deep shade of the brand colour, always dark enough for white text.
    const bandH = 112;
    page.drawRectangle({ x: 0, y: H - bandH, width: W, height: bandH, color: band });
    const top = H - 30;
    if (logo) {
      const s = Math.min(38 / logo.height, 120 / logo.width);
      card(M - 8, top + 7, logo.width * s + 16, logo.height * s + 14, white);
      drawLogo(M, top, 120, 38);
    } else {
      wrap(doc.seller.name, 17, CONTENT - 230, bold)
        .slice(0, 2)
        .forEach((l, i) => text(l, M, top - 18 - i * 21, 17, bold, white));
    }
    right(title, W - M, top - 26, 27, bold, white);
    if (original) right(original, W - M, top - 42, 7.5, font, white);
    y = H - bandH - 2;
    factRow(M, y, 112);
    const tagW = Math.max(150, bold.widthOfTextAtSize(pdfMoney(due), 14) + 28);
    card(W - M - tagW, y - 6, tagW, 42, accent, undefined, 6);
    right(dueLabel, W - M - 12, y - 19, 7.5, font, onAccent);
    right(pdfMoney(due), W - M - 12, y - 35, 14, bold, onAccent);
    y -= 66;
  } else if (isElegant) {
    const top = y;
    const logoH = drawLogo(W / 2 - 60, top, 120, 44);
    let cy = top - (logoH ? logoH + 2 : 0);
    if (!logo) {
      for (const l of wrap(doc.seller.name, 20, CONTENT - 60, display(doc.seller.name))) {
        centre(l, cy - 20, 20, display(doc.seller.name));
        cy -= 24;
      }
      cy -= 2;
    }
    y = cy - 10;
    hr(y, M, W - M, accentText, 1.1);
    hr(y - 3, M, W - M, accentText, 0.4);
    y -= 32;
    text(title, M, y, 21, display(title), accentText);
    if (original) text(original, M, y - 14, 7.5, font, muted);
    right(dueLabel, W - M, y + 11, 7.5, font, muted);
    right(pdfMoney(due), W - M, y - 7, 16, bold, accentText);
    y -= 24;
    factRow(M, y, CONTENT / 3);
    y -= 42;
    hr(y);
    y -= 16;
  } else if (isClassic) {
    const top = y;
    const brandH = drawLogo(M, top, 130, 42);
    if (!logo) wrap(doc.seller.name, 15, CONTENT - 210, bold).forEach((l, i) => text(l, M, top - 16 - i * 18, 15, bold));
    right(title.toUpperCase(), W - M, top - 17, 17, bold);
    if (original) right(original, W - M, top - 31, 7.5, font, muted);
    y = top - Math.max(brandH, 36) - 12;
    card(M, y, CONTENT, 46, undefined, ink, 0.01);
    factRow(M + 12, y, (CONTENT - 162) / 3);
    right(dueLabel, W - M - 12, y - 18, 7.5, font, muted);
    right(pdfMoney(due), W - M - 12, y - 33, 13, bold);
    y -= 62;
  } else {
    const top = y;
    let brandBottom = top - 22;
    if (logo) brandBottom = top - drawLogo(M, top, 140, 46);
    else {
      let ny = top - 19;
      for (const l of wrap(doc.seller.name, 17, CONTENT - 200, bold)) {
        text(l, M, ny, 17, bold);
        ny -= 21;
      }
      brandBottom = ny + 15;
    }
    right(title, W - M, top - 21, 24, bold, accentText);
    if (original) right(original, W - M, top - 35, 7.5, font, muted);
    y = Math.min(brandBottom, top - 40) - 12;
    card(M, y, CONTENT, 46, tint);
    factRow(M + 16, y, (CONTENT - 166) / 3);
    right(dueLabel, W - M - 16, y - 18, 7.5, font, muted);
    right(pdfMoney(due), W - M - 16, y - 33, 14, bold, accentText);
    y -= 62;
  }

  /* ---- Parties: From, Bill to, then Ship to and Place of supply */
  const shipTo = clean(doc.shipTo ?? "").trim();
  const gap = 20;
  const colCount = gst || shipTo ? 3 : 2;
  const colW = (CONTENT - gap * (colCount - 1)) / colCount;
  const partyTop = y;
  /** Phone and email share a line when they fit, so a separator is never left hanging. */
  const contact = (...parts: string[]) => {
    const present = parts.map((p) => clean(p).trim()).filter(Boolean);
    const joined = present.join(" · ");
    return font.widthOfTextAtSize(joined, 8.5) <= colW ? [joined] : present;
  };
  const party = (x: number, heading: string, name: string, lines: string[], from = partyTop) => {
    label(heading, x, from);
    let py = from - 15;
    for (const l of wrap(name, 10, colW, bold)) {
      text(l, x, py, 10, bold);
      py -= 13;
    }
    py -= 1;
    for (const l of lines.filter(Boolean)) {
      const strong = l.startsWith("GSTIN") || l.startsWith("PO no.");
      for (const part of wrap(l, 8.5, colW)) {
        text(part, x, py, 8.5, font, strong ? ink : muted);
        py -= 11;
      }
    }
    return py;
  };
  const sellerBottom = party(M, "From", doc.seller.name, [
    [doc.seller.address.trim(), doc.seller.state ? stateLabel(doc.seller.state) : ""].filter(Boolean).join(", "),
    doc.seller.gstRegistered && doc.seller.gstin ? `GSTIN ${doc.seller.gstin}` : "",
    doc.seller.pan ? `PAN ${doc.seller.pan.toUpperCase()}` : "",
    ...contact(doc.seller.phone, doc.seller.email),
  ]);
  const buyerBottom = party(M + colW + gap, doc.kind === "invoice" ? "Bill to" : "Prepared for", doc.buyer.name, [
    [doc.buyer.address.trim(), doc.buyer.state ? stateLabel(doc.buyer.state) : ""].filter(Boolean).join(", "),
    doc.buyer.gstin ? `GSTIN ${doc.buyer.gstin.toUpperCase()}` : "",
    ...contact(doc.buyer.phone, doc.buyer.email),
    doc.poNumber?.trim() ? `PO no. ${clean(doc.poNumber).trim()}` : "",
  ]);
  const thirdX = M + 2 * (colW + gap);
  let thirdBottom = partyTop;
  if (shipTo) {
    const [first, ...rest] = shipTo.split("\n");
    thirdBottom = party(thirdX, "Ship to", first, rest) - 5;
  }
  if (gst) {
    thirdBottom = party(thirdX, "Place of supply", stateLabel(doc.placeOfSupply), [
      t.supply === "inter" ? "Inter-state supply: IGST" : `Intra-state supply: CGST + ${t.stateTaxName}`,
      doc.kind === "invoice" ? "Tax payable on reverse charge: No" : "",
    ], thirdBottom);
  }
  y = Math.min(sellerBottom, buyerBottom, thirdBottom) - 8;

  /* ---- Items table, with HSN/SAC under the item name */
  const hasDisc = doc.items.some((i) => i.discount > 0);
  type Col = { key: string; label: string; width: number; align: "left" | "right" };
  /** Number columns grow to fit, so large amounts never run into their neighbours. */
  const fit = (min: number, values: string[], f: PDFFont) => Math.ceil(Math.max(min, ...values.map((v) => f.widthOfTextAtSize(v, 9) + 12)));
  const qtyCell = (i: InvoiceDoc["items"][number]) => `${qtyText(i.qty)} ${i.unit}`.trim();
  const cols: Col[] = [
    { key: "n", label: "#", width: 22, align: "left" },
    { key: "item", label: "Item", width: 0, align: "left" },
    { key: "qty", label: "Qty", width: fit(56, doc.items.map(qtyCell), font), align: "right" },
    { key: "rate", label: "Rate", width: fit(66, doc.items.map((i) => plain(i.rate)), font), align: "right" },
    ...(hasDisc ? [{ key: "disc", label: "Disc.", width: 40, align: "right" } as Col] : []),
    ...(gst ? [{ key: "gst", label: "GST", width: 40, align: "right" } as Col] : []),
    { key: "amount", label: gst ? "Taxable value" : "Amount", width: fit(78, t.lines.map((l) => plain(l.taxable)), bold), align: "right" },
  ];
  cols[1].width = CONTENT - cols.reduce((s, c) => s + c.width, 0);
  const xs: number[] = [];
  cols.reduce((x, c) => (xs.push(x), x + c.width), M);
  /** Filled and boxed tables need padding at their edges. */
  const inset = isBold || isClassic ? 7 : 0;
  const cellX = (i: number) => xs[i] + (i === 0 ? inset : isClassic ? 6 : 0);
  const cellRight = (i: number) => xs[i] + cols[i].width - (i === cols.length - 1 ? inset : isClassic ? 6 : 0);
  const gridLines = (top: number, bottom: number) => {
    if (!isClassic) return;
    for (const x of [...xs, W - M]) page.drawLine({ start: { x, y: top }, end: { x, y: bottom }, thickness: 0.5, color: ink });
  };

  const tableHeader = () => {
    const h = 21;
    const top = y;
    if (isBold) card(M, y, CONTENT, h, accent, undefined, 4);
    if (isClassic) page.drawRectangle({ x: M, y: y - h, width: CONTENT, height: h, color: tint });
    if (isElegant) hr(y);
    const color = isBold ? onAccent : isClassic ? ink : muted;
    cols.forEach((c, i) => {
      const name = isElegant ? c.label.toUpperCase() : c.label;
      if (c.align === "right") right(name, cellRight(i), y - 14, isElegant ? 7 : 7.5, bold, color);
      else text(name, cellX(i), y - 14, isElegant ? 7 : 7.5, bold, color);
    });
    y -= h;
    if (isClean) hr(y, M, W - M, accentText, 1);
    if (isElegant) hr(y, M, W - M, accentText, 0.7);
    if (isClassic) {
      hr(top, M, W - M, ink, 0.5);
      hr(y, M, W - M, ink, 0.5);
      gridLines(top, y);
    }
  };
  ensure(70);
  tableHeader();

  doc.items.forEach((item, idx) => {
    const lt = t.lines[idx];
    const nameLines = wrap(item.name, 9.5, cols[1].width - 12, bold);
    const hsn = item.hsn.trim();
    const rowH = nameLines.length * 12.5 + (hsn ? 10 : 0) + 9;
    if (y - rowH < M + 22) {
      newPage();
      tableHeader();
    }
    const cells: Record<string, string> = {
      n: String(idx + 1),
      qty: qtyCell(item),
      rate: plain(item.rate),
      disc: item.discount ? rateText(item.discount) : "–",
      gst: rateText(item.gstRate || 0),
      amount: plain(lt.taxable),
    };
    const base = y - 14;
    cols.forEach((c, i) => {
      if (c.key === "item") {
        nameLines.forEach((l, k) => text(l, cellX(i), base - k * 12.5, 9.5, bold));
        if (hsn) text(`HSN/SAC ${hsn}`, cellX(i), base - nameLines.length * 12.5 + 1.5, 7.5, font, muted);
        return;
      }
      const v = cells[c.key] ?? "";
      if (c.align === "right") right(v, cellRight(i), base, 9, c.key === "amount" ? bold : font);
      else text(v, cellX(i), base, 9, font, muted);
    });
    gridLines(y, y - rowH);
    y -= rowH;
    hr(y, M, W - M, isClassic ? ink : line, isClassic ? 0.5 : 0.6);
  });

  /* ---- Totals, with the words, notes and terms beside them */
  const totalRows: [string, string][] = [];
  if (t.discount > 0) {
    totalRows.push(["Subtotal", plain(t.gross)]);
    totalRows.push(["Discount", `- ${plain(t.discount)}`]);
  }
  totalRows.push([gst ? "Taxable value" : t.discount > 0 ? "After discount" : "Subtotal", plain(t.taxable)]);
  for (const r of t.byRate) {
    if (t.supply === "inter") totalRows.push([`IGST @ ${rateText(r.rate)}`, plain(r.igst)]);
    else {
      totalRows.push([`CGST @ ${rateText(r.rate / 2)}`, plain(r.cgst)]);
      totalRows.push([`${t.stateTaxName} @ ${rateText(r.rate / 2)}`, plain(r.sgst)]);
    }
  }
  if (t.roundOff) totalRows.push(["Round off", (t.roundOff > 0 ? "+ " : "- ") + plain(Math.abs(t.roundOff))]);
  // On a part-paid invoice what matters is what is still owed, so that takes the highlight.
  const showPaid = doc.kind === "invoice" && t.paid > 0;
  if (showPaid) {
    totalRows.push(["Total", plain(t.total)]);
    totalRows.push(["Received", `- ${plain(t.paid)}`]);
  }
  const finalLabel = showPaid ? "Balance due" : "Total";
  const finalAmount = showPaid ? t.balance : t.total;

  const totalsW = 216;
  const finalH = 34;
  const tx = W - M - totalsW;
  const leftW = tx - M - 24;
  const totalsH = totalRows.length * 13.5 + 3 + finalH;
  const wordLines = wrap(t.words, 9, leftW, bold);
  const blocks = (
    [
      ["Notes", doc.notes],
      ["Terms and conditions", doc.terms],
    ] as const
  )
    .filter(([, body]) => body.trim())
    .map(([heading, body]) => ({ heading, lines: wrap(body, 8.5, leftW) }));
  const wordsH = 14 + wordLines.length * 12.5 + 10;
  const blocksH = blocks.reduce((sum, b) => sum + 13 + b.lines.length * 11.5 + 8, 0);
  // Long notes and terms go full width below everything else.
  const notesBeside = wordsH + blocksH <= totalsH + 34;
  ensure(Math.max(totalsH, notesBeside ? wordsH + blocksH : wordsH) + 16);
  y -= 10;
  const totalsTop = y;
  for (const [k, v] of totalRows) {
    text(k, tx + 12, y - 9, 9, font, muted);
    right(v, W - M - 12, y - 9, 9);
    y -= 13.5;
  }
  y -= 3;
  if (isElegant) {
    hr(y, tx, W - M, accentText, 1);
    hr(y - 2.5, tx, W - M, accentText, 0.4);
    text(finalLabel, tx + 12, y - 23, 13, display(finalLabel), accentText);
    right(pdfMoney(finalAmount), W - M - 12, y - 23, 15, bold, accentText);
  } else if (isBold) {
    card(tx, y, totalsW, finalH, accent, undefined, 6);
    text(finalLabel, tx + 12, y - 21, 10.5, bold, onAccent);
    right(pdfMoney(finalAmount), W - M - 12, y - 23, 15, bold, onAccent);
  } else if (isClassic) {
    page.drawRectangle({ x: tx, y: y - finalH, width: totalsW, height: finalH, color: tint, borderColor: ink, borderWidth: 0.7 });
    text(finalLabel, tx + 12, y - 21, 10.5, bold);
    right(pdfMoney(finalAmount), W - M - 12, y - 22, 14, bold);
  } else {
    card(tx, y, totalsW, finalH, tint);
    text(finalLabel, tx + 12, y - 21, 10.5, bold);
    right(pdfMoney(finalAmount), W - M - 12, y - 23, 15, bold, accentText);
  }
  y -= finalH;
  let wy = totalsTop - 9;
  label("Amount in words", M, wy);
  wy -= 14;
  for (const l of wordLines) {
    text(l, M, wy, 9, bold);
    wy -= 12.5;
  }
  wy -= 8;
  if (notesBeside) {
    for (const b of blocks) {
      label(b.heading, M, wy);
      wy -= 13;
      for (const l of b.lines) {
        text(l, M, wy, 8.5, font, muted);
        wy -= 11.5;
      }
      wy -= 7;
    }
  }
  y = Math.min(y, wy) - 14;

  /* ---- HSN / tax summary */
  if (gst && t.byHsn.length && t.tax > 0) {
    const inter = t.supply === "inter";
    type Row = (typeof t.byHsn)[number];
    const pair = (rate: number, amount: number, total: boolean) => (total ? plain(amount) : `${rateText(rate)}  ${plain(amount)}`);
    const sc: { label: string; width: number; get: (r: Row, total: boolean) => string }[] = [
      { label: "HSN/SAC", width: 0, get: (r, total) => (total ? "Total" : r.hsn || "–") },
      { label: "Taxable value", width: 90, get: (r) => plain(r.taxable) },
      ...(inter
        ? [{ label: "IGST", width: 110, get: (r: Row, total: boolean) => pair(r.rate, r.igst, total) }]
        : [
            { label: "CGST", width: 100, get: (r: Row, total: boolean) => pair(r.rate / 2, r.cgst, total) },
            { label: t.stateTaxName, width: 100, get: (r: Row, total: boolean) => pair(r.rate / 2, r.sgst, total) },
          ]),
      { label: "Total tax", width: 80, get: (r) => plain(r.tax) },
    ];
    sc[0].width = CONTENT - sc.reduce((sum, c) => sum + c.width, 0);
    ensure(14 * (t.byHsn.length + 2) + 28);
    label("Tax summary", M, y);
    y -= 6;
    const sx: number[] = [];
    sc.reduce((x, c) => (sx.push(x), x + c.width), M);
    sc.forEach((c, i) => (i === 0 ? text(c.label, sx[i], y - 9, 7.5, font, muted) : right(c.label, sx[i] + c.width, y - 9, 7.5, font, muted)));
    y -= 13.5;
    hr(y);
    const rows: [Row, boolean][] = [
      ...t.byHsn.map((r): [Row, boolean] => [r, false]),
      [{ hsn: "", rate: 0, taxable: t.taxable, cgst: t.cgst, sgst: t.sgst, igst: t.igst, tax: t.tax }, true],
    ];
    for (const [r, total] of rows) {
      sc.forEach((c, i) => {
        const value = c.get(r, total);
        if (i === 0) text(value, sx[i], y - 10, 8, total ? bold : font);
        else right(value, sx[i] + c.width, y - 10, 8, total ? bold : font);
      });
      y -= 13.5;
      hr(y);
    }
    y -= 14;
  }

  /* ---- Payment card and signature */
  const s = doc.seller;
  const bank: [string, string][] = (
    [
      ["Bank", s.bankName],
      ["Account name", s.accountName],
      ["Account no.", s.accountNumber],
      ["IFSC", s.ifsc.toUpperCase()],
      ["UPI ID", s.upiId],
    ] as [string, string][]
  ).filter(([, v]) => v.trim());
  let qr: boolean[][] | null = null;
  if (s.upiId.trim() && doc.kind !== "quotation" && due > 0) {
    try {
      qr = encodeQr(upiPayload({ vpa: s.upiId, name: s.name.slice(0, 40), amount: due.toFixed(2), note: doc.number }), "M").modules;
    } catch {
      qr = null;
    }
  }
  const hasPayment = bank.length > 0 || !!qr;
  const payH = hasPayment ? Math.max(bank.length * 12.5 + 30, qr ? 90 : 0) : 0;
  const sigW = 136;
  const forLines = wrap(`For ${s.name}`, 8.5, sigW, bold);
  const sigDrop = (forLines.length - 1) * 11;
  const footH = Math.max(payH, 72 + sigDrop);
  ensure(footH + 12);
  const fy = y;
  if (hasPayment) {
    const payW = CONTENT - sigW - 24;
    card(M, fy, payW, payH, undefined, isClassic ? ink : line, isClassic ? 0.01 : 7);
    label("Payment details", M + 14, fy - 16);
    let yy = fy - 30;
    for (const [k, v] of bank) {
      text(k, M + 14, yy, 8.5, font, muted);
      text(v, M + 80, yy, 8.5, bold);
      yy -= 12.5;
    }
    if (qr) {
      const size = 62;
      const qx = M + payW - size - 14;
      const cell = size / qr.length;
      qr.forEach((row, r) =>
        row.forEach((on, c) => {
          if (on) page.drawRectangle({ x: qx + c * cell, y: fy - 9 - (r + 1) * cell, width: cell + 0.05, height: cell + 0.05, color: ink });
        }),
      );
      const scan = "Scan to pay";
      text(scan, qx + size / 2 - font.widthOfTextAtSize(scan, 7.5) / 2, fy - size - 18, 7.5, font, muted);
    }
  }
  const sigX = W - M;
  if (signature) {
    const sc2 = Math.min(38 / signature.height, sigW / signature.width);
    page.drawImage(signature, { x: sigX - signature.width * sc2, y: fy - 50 - sigDrop, width: signature.width * sc2, height: signature.height * sc2 });
  }
  forLines.forEach((l, k) => right(l, sigX, fy - 8 - k * 11, 8.5, bold));
  hr(fy - 56 - sigDrop, sigX - sigW, sigX, muted, 0.6);
  right("Authorised signatory", sigX, fy - 68 - sigDrop, 8, font, muted);
  y = fy - footH - 14;

  /* ---- Long notes and terms */
  if (!notesBeside) {
    for (const [heading, body] of [
      ["Notes", doc.notes],
      ["Terms and conditions", doc.terms],
    ] as const) {
      if (!body.trim()) continue;
      const lines = wrap(body, 8.5, CONTENT);
      ensure(Math.min(lines.length, 4) * 12 + 18);
      label(heading, M, y);
      y -= 13;
      for (const l of lines) {
        ensure(12);
        text(l, M, y, 8.5, font, muted);
        y -= 12;
      }
      y -= 8;
    }
  }

  /* ---- Footers */
  pages.forEach((p, i) => {
    const number = `${doc.number}  ·  Page ${i + 1} of ${pages.length}`;
    p.drawText(clean(s.name), { x: M, y: M - 8, size: 7.5, font, color: muted });
    p.drawText(number, { x: W - M - font.widthOfTextAtSize(number, 7.5), y: M - 8, size: 7.5, font, color: muted });
  });

  return pdf.save();
}
