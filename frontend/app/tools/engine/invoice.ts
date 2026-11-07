/**
 * GST invoices, quotations and proforma invoices: the data model, the
 * maths (line totals, CGST + SGST/UTGST or IGST, HSN summary, round-off,
 * amount in words), numbering, validation, and history helpers (CSV,
 * backup). Pure functions; the PDF is drawn by invoice-pdf.ts in the worker.
 *
 * Rules checked in November 2026: tax invoice contents under CGST Rule 46
 * (number up to 16 characters using letters, digits, "-" and "/", unique in
 * the financial year; GSTIN and state of both parties; place of supply;
 * HSN/SAC; taxable value and tax by rate); GST slabs after the 22 Sep 2025
 * reform (0, 5, 18, 40%, plus 3% and 0.25% for gold and diamonds); UTGST
 * instead of SGST in union territories without a legislature.
 */
import { rupeesInWords } from "./rent-receipt";

/* --------------------------------------------------------------- Types */

export type DocKind = "invoice" | "quotation" | "proforma";
export type Template = "clean" | "elegant" | "bold" | "classic";

export const invoiceTemplates: { id: Template; label: string; hint: string }[] = [
  { id: "clean", label: "Clean", hint: "White page, soft colour strip with the amount due" },
  { id: "elegant", label: "Elegant", hint: "Centred name with serif headings" },
  { id: "bold", label: "Bold", hint: "Full-width brand header and solid total" },
  { id: "classic", label: "Classic", hint: "Black and white with a ruled table, for plain printing" },
];

/** Reads saved templates, including the older "modern", which became Clean. */
export const normalTemplate = (t?: string): Template => (invoiceTemplates.some((x) => x.id === t) ? (t as Template) : "clean");

/** The seller's saved profile. Logo and signature are image data URLs. */
export type Business = {
  name: string;
  address: string;
  /** Two-digit GST state code, e.g. "07" for Delhi. */
  state: string;
  gstRegistered: boolean;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  logo?: string;
  signature?: string;
  terms: string;
  template: Template;
  accent: Accent;
  prefixes: Record<DocKind, string>;
};

export type Party = {
  id: string;
  name: string;
  address: string;
  state: string;
  gstin: string;
  phone: string;
  email: string;
  updatedAt: number;
};

export type Product = {
  id: string;
  name: string;
  hsn: string;
  unit: string;
  rate: number;
  gstRate: number;
  updatedAt: number;
};

export type LineItem = {
  id: string;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  /** Price per unit before GST. */
  rate: number;
  /** Discount in percent of the line amount. */
  discount: number;
  gstRate: number;
};

/** The seller details printed on a document (a copy, so later profile edits do not change old invoices). */
export type SellerSnapshot = Omit<Business, "logo" | "signature" | "terms" | "template" | "accent" | "prefixes">;
export type BuyerSnapshot = Omit<Party, "id" | "updatedAt">;

export type InvoiceDoc = {
  id: string;
  kind: DocKind;
  number: string;
  /** YYYY-MM-DD */
  date: string;
  dueDate: string;
  seller: SellerSnapshot;
  buyer: BuyerSnapshot;
  /** State code where the supply is made; decides CGST + SGST or IGST. */
  placeOfSupply: string;
  /** Delivery address when it differs from the billing address; the first line prints as the name. */
  shipTo?: string;
  poNumber?: string;
  /** This document's look; without these it uses the business defaults. */
  template?: Template;
  accent?: Accent;
  items: LineItem[];
  roundOff: boolean;
  notes: string;
  terms: string;
  /** Payment received so far (invoices only). */
  amountPaid: number;
  cancelled: boolean;
  /** For a quotation: the invoice made from it. For an invoice: the quotation it came from. */
  linkedId?: string;
  createdAt: number;
  updatedAt: number;
};

/* -------------------------------------------------------- Reference data */

/** GST state codes (first two digits of a GSTIN). `ut` marks UTs that charge UTGST. */
export const states: { code: string; name: string; ut?: boolean }[] = [
  { code: "35", name: "Andaman and Nicobar Islands", ut: true },
  { code: "37", name: "Andhra Pradesh" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" },
  { code: "10", name: "Bihar" },
  { code: "04", name: "Chandigarh", ut: true },
  { code: "22", name: "Chhattisgarh" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu", ut: true },
  { code: "07", name: "Delhi" },
  { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" },
  { code: "06", name: "Haryana" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "01", name: "Jammu and Kashmir" },
  { code: "20", name: "Jharkhand" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "38", name: "Ladakh", ut: true },
  { code: "31", name: "Lakshadweep", ut: true },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" },
  { code: "15", name: "Mizoram" },
  { code: "13", name: "Nagaland" },
  { code: "21", name: "Odisha" },
  { code: "34", name: "Puducherry" },
  { code: "03", name: "Punjab" },
  { code: "08", name: "Rajasthan" },
  { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "16", name: "Tripura" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" },
  { code: "19", name: "West Bengal" },
  { code: "97", name: "Other Territory" },
  { code: "96", name: "Outside India (export)" },
];

export const stateName = (code: string) => states.find((s) => s.code === code)?.name ?? "";
/** "Delhi (07)" */
export const stateLabel = (code: string) => (stateName(code) ? `${stateName(code)} (${code})` : "");

/** Current slabs, offered as suggestions; any rate from 0 to 100 is accepted. */
export const invoiceGstRates = [0, 0.25, 3, 5, 18, 40] as const;

export const units = ["Nos", "Pcs", "Kg", "g", "Ltr", "m", "Sq ft", "Box", "Set", "Pair", "Hrs", "Days", "Month", "Job"];

export const accents = {
  ink: { label: "Ink", rgb: [0.11, 0.11, 0.13] },
  blue: { label: "Blue", rgb: [0.15, 0.33, 0.75] },
  green: { label: "Green", rgb: [0.06, 0.47, 0.34] },
  orange: { label: "Orange", rgb: [0.85, 0.36, 0.1] },
  maroon: { label: "Maroon", rgb: [0.55, 0.12, 0.2] },
} as const;
export type AccentId = keyof typeof accents;
/** A named colour, or any #rrggbb the user picks. */
export type Accent = AccentId | `#${string}`;

export function accentRgb(accent: Accent | string | undefined): readonly [number, number, number] {
  if (accent && accent in accents) return accents[accent as AccentId].rgb;
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(accent ?? "");
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : accents.blue.rgb;
}

export const accentHex = (accent: Accent) =>
  "#" +
  accentRgb(accent)
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

export const kindTitle = (kind: DocKind, gstRegistered: boolean) =>
  kind === "quotation" ? "QUOTATION" : kind === "proforma" ? "PROFORMA INVOICE" : gstRegistered ? "TAX INVOICE" : "INVOICE";

export const kindLabel: Record<DocKind, string> = { invoice: "Invoice", quotation: "Quotation", proforma: "Proforma invoice" };

/* ---------------------------------------------------------------- GSTIN */

const base36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const gstinPattern = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** The 15th character of a GSTIN, from the first 14 (mod-36 check). */
export function gstinCheckChar(first14: string) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = base36.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return base36[(36 - (sum % 36)) % 36];
}

/** null when valid, otherwise what is wrong. */
export function checkGstin(raw: string): string | null {
  const g = raw.trim().toUpperCase();
  if (!gstinPattern.test(g)) return "A GSTIN has 15 characters, like 07ABCDE1234F1Z5.";
  if (!states.some((s) => s.code === g.slice(0, 2))) return "The first two digits of the GSTIN are not a state code.";
  if (gstinCheckChar(g) !== g[14]) return "This GSTIN has a typing mistake: its last character does not match.";
  return null;
}

/** The state code of a valid GSTIN, else "". */
export const gstinState = (gstin: string) => (checkGstin(gstin) ? "" : gstin.trim().slice(0, 2));

/* ----------------------------------------------------------------- Maths */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type LineTotals = { amount: number; discount: number; taxable: number; tax: number; total: number };

export function lineTotals(item: Pick<LineItem, "qty" | "rate" | "discount" | "gstRate">, withGst = true): LineTotals {
  const amount = round2((item.qty || 0) * (item.rate || 0));
  const discount = round2((amount * (item.discount || 0)) / 100);
  const taxable = round2(amount - discount);
  const tax = withGst ? round2((taxable * (item.gstRate || 0)) / 100) : 0;
  return { amount, discount, taxable, tax, total: round2(taxable + tax) };
}

export type TaxRow = { hsn: string; rate: number; taxable: number; cgst: number; sgst: number; igst: number; tax: number };

export type InvoiceTotals = {
  lines: LineTotals[];
  /** Sum of qty × rate before discounts. */
  gross: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  /** "intra": CGST + SGST/UTGST; "inter": IGST; "none": no GST. */
  supply: "intra" | "inter" | "none";
  /** "UTGST" in union territories without a legislature. */
  stateTaxName: "SGST" | "UTGST";
  /** Tax by rate, for the totals block. */
  byRate: TaxRow[];
  /** Tax by HSN/SAC and rate, for the summary table. */
  byHsn: TaxRow[];
  roundOff: number;
  total: number;
  paid: number;
  balance: number;
  words: string;
};

/** Whether GST is charged, and how it is split. */
export function supplyType(doc: Pick<InvoiceDoc, "seller" | "placeOfSupply">): InvoiceTotals["supply"] {
  if (!doc.seller.gstRegistered) return "none";
  return doc.placeOfSupply && doc.placeOfSupply !== doc.seller.state ? "inter" : "intra";
}

function splitTax(tax: number, supply: InvoiceTotals["supply"]) {
  if (supply === "inter") return { cgst: 0, sgst: 0, igst: tax };
  if (supply === "none") return { cgst: 0, sgst: 0, igst: 0 };
  const cgst = round2(tax / 2);
  return { cgst, sgst: round2(tax - cgst), igst: 0 };
}

function groupTax(rows: { key: string; hsn: string; rate: number; taxable: number; tax: number }[], supply: InvoiceTotals["supply"]) {
  const map = new Map<string, TaxRow>();
  for (const r of rows) {
    const row = map.get(r.key) ?? { hsn: r.hsn, rate: r.rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
    row.taxable = round2(row.taxable + r.taxable);
    row.tax = round2(row.tax + r.tax);
    map.set(r.key, row);
  }
  return [...map.values()].map((row) => ({ ...row, ...splitTax(row.tax, supply) }));
}

/** "Rupees One Thousand Two Hundred Fifty and Fifty Paise Only" */
export function amountInWords(amount: number) {
  const rupees = Math.floor(round2(amount));
  const paise = Math.round(round2(amount - rupees) * 100);
  return `Rupees ${rupeesInWords(rupees)}${paise ? ` and ${rupeesInWords(paise)} Paise` : ""} Only`;
}

export function invoiceTotals(doc: Pick<InvoiceDoc, "seller" | "placeOfSupply" | "items" | "roundOff" | "amountPaid">): InvoiceTotals {
  const supply = supplyType(doc);
  const withGst = supply !== "none";
  const lines = doc.items.map((item) => lineTotals(item, withGst));
  const sum = (pick: (l: LineTotals) => number) => round2(lines.reduce((s, l) => s + pick(l), 0));
  const tax = sum((l) => l.tax);
  const taxable = sum((l) => l.taxable);
  const parts = { cgst: 0, sgst: 0, igst: 0 };
  const rows = doc.items.map((item, i) => ({ hsn: item.hsn.trim(), rate: item.gstRate || 0, taxable: lines[i].taxable, tax: lines[i].tax }));
  const byRate = withGst
    ? groupTax(
        rows.map((r) => ({ ...r, key: String(r.rate), hsn: "" })),
        supply,
      ).sort((a, b) => a.rate - b.rate)
    : [];
  // Split each rate group separately, so CGST @ 9% + SGST @ 9% add up line by line.
  for (const r of byRate) {
    parts.cgst = round2(parts.cgst + r.cgst);
    parts.sgst = round2(parts.sgst + r.sgst);
    parts.igst = round2(parts.igst + r.igst);
  }
  const byHsn = withGst
    ? groupTax(
        rows.map((r) => ({ ...r, key: `${r.hsn}|${r.rate}` })),
        supply,
      )
    : [];
  const exact = round2(taxable + tax);
  const total = doc.roundOff ? Math.round(exact) : exact;
  const paid = round2(Math.max(0, doc.amountPaid || 0));
  return {
    lines,
    gross: sum((l) => l.amount),
    discount: sum((l) => l.discount),
    taxable,
    ...parts,
    tax,
    supply,
    stateTaxName: states.find((s) => s.code === doc.seller.state)?.ut ? "UTGST" : "SGST",
    byRate,
    byHsn,
    roundOff: round2(total - exact),
    total,
    paid,
    balance: round2(Math.max(0, total - paid)),
    words: amountInWords(total),
  };
}

/* ------------------------------------------------------------ Numbering */

/** "2026-27" for any date from 1 April 2026 to 31 March 2027. */
export function financialYear(date: string) {
  const [y, m] = date.split("-").map(Number);
  const start = m >= 4 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export const defaultPrefixes: Record<DocKind, string> = { invoice: "INV", quotation: "QT", proforma: "PI" };

/**
 * The next number in a series like INV/26-27/001: one more than the highest
 * number already used with the same prefix and financial year.
 */
export function nextNumber(prefix: string, date: string, used: string[]) {
  const fy = financialYear(date).slice(2);
  const base = `${prefix.trim() || "INV"}/${fy}/`;
  let max = 0;
  for (const n of used) {
    if (!n.startsWith(base)) continue;
    const seq = Number(n.slice(base.length));
    if (Number.isInteger(seq) && seq > max) max = seq;
  }
  return `${base}${String(max + 1).padStart(3, "0")}`;
}

/* ----------------------------------------------------------- Validation */

/** The characters in the embedded PDF font (engine/fonts). */
const latin = /^[\x20-\x7E -ÿ\n\r\t₹–—‘’“”•…]*$/;

export type Problem = { field: string; message: string };

/** Everything that stops the document from being saved, first problem first. */
export function validateInvoice(doc: InvoiceDoc): Problem[] {
  const out: Problem[] = [];
  const add = (field: string, message: string) => out.push({ field, message });
  const s = doc.seller;
  if (!s.name.trim()) add("seller", "Add your business name in Business profile.");
  if (s.gstRegistered) {
    if (!s.gstin.trim()) add("seller", "Add your GSTIN in Business profile, or mark the business as not registered for GST.");
    else if (checkGstin(s.gstin)) add("seller", `Your GSTIN: ${checkGstin(s.gstin)}`);
    if (!s.state) add("seller", "Choose your business's state in Business profile.");
  }
  if (!doc.buyer.name.trim()) add("buyer", "Enter the customer's name.");
  if (doc.buyer.gstin.trim() && checkGstin(doc.buyer.gstin)) add("buyer", `Customer's GSTIN: ${checkGstin(doc.buyer.gstin)}`);
  if (s.gstRegistered && !doc.placeOfSupply) add("buyer", "Choose the place of supply (the customer's state).");
  if (!doc.number.trim()) add("number", "Enter a document number.");
  else if (!/^[A-Za-z0-9/-]{1,16}$/.test(doc.number.trim())) add("number", "The number can have up to 16 letters, digits, - and /, with no spaces.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(doc.date)) add("date", "Choose the date.");
  if (doc.dueDate && doc.dueDate < doc.date) add("date", "The due date is before the document date.");
  if (doc.items.length === 0) add("items", "Add at least one item.");
  doc.items.forEach((item, i) => {
    const n = i + 1;
    if (!item.name.trim()) add("items", `Item ${n}: enter what you are selling.`);
    if (!(item.qty > 0)) add("items", `Item ${n}: the quantity should be more than 0.`);
    if (!(item.rate >= 0)) add("items", `Item ${n}: enter the price.`);
    if (!(item.discount >= 0 && item.discount <= 100)) add("items", `Item ${n}: the discount should be 0 to 100%.`);
    if (!(item.gstRate >= 0 && item.gstRate <= 100)) add("items", `Item ${n}: the GST rate should be 0 to 100%.`);
  });
  const texts = [s.name, s.address, doc.buyer.name, doc.buyer.address, doc.shipTo, doc.poNumber, doc.notes, doc.terms, ...doc.items.map((i) => i.name)];
  if (!texts.every((t) => latin.test(t ?? "")))
    add("text", "Write names, addresses and items in English letters; the PDF font cannot show Hindi or other scripts.");
  return out;
}

/**
 * Advice that does not stop a save: common GST gaps, worded as checks because
 * the right answer depends on the business's turnover.
 */
export function invoiceWarnings(doc: InvoiceDoc): string[] {
  if (!doc.seller.gstRegistered || doc.kind !== "invoice") return [];
  const out: string[] = [];
  const registeredBuyer = !!doc.buyer.gstin.trim();
  doc.items.forEach((item, i) => {
    const hsn = item.hsn.trim();
    if (!item.name.trim()) return;
    if (hsn && !/^\d{4,8}$/.test(hsn)) out.push(`Item ${i + 1}: HSN/SAC codes are normally 4 to 8 digits.`);
    else if (!hsn && registeredBuyer) out.push(`Item ${i + 1}: add an HSN/SAC code. It is needed on invoices to registered customers.`);
  });
  if (!registeredBuyer && invoiceTotals(doc).taxable >= 50000 && !doc.buyer.address.trim() && !doc.shipTo?.trim())
    out.push("For ₹50,000 or more to an unregistered customer, add their name and delivery address.");
  return out;
}

/* -------------------------------------------------------------- History */

export type DocStatus = "paid" | "partial" | "unpaid" | "overdue" | "cancelled" | "open" | "converted";

export function docStatus(doc: InvoiceDoc, today: string): DocStatus {
  if (doc.cancelled) return "cancelled";
  if (doc.kind !== "invoice") return doc.linkedId ? "converted" : "open";
  const { total, paid } = invoiceTotals(doc);
  if (paid >= total && total > 0) return "paid";
  if (doc.dueDate && doc.dueDate < today) return "overdue";
  return paid > 0 ? "partial" : "unpaid";
}

export type HistorySummary = { count: number; invoiced: number; received: number; outstanding: number; gst: number };

/** Totals of live invoices (not quotations or cancelled ones) dated in [from, to]. */
export function summarise(docs: InvoiceDoc[], from: string, to: string): HistorySummary {
  const s = { count: 0, invoiced: 0, received: 0, outstanding: 0, gst: 0 };
  for (const d of docs) {
    if (d.kind !== "invoice" || d.cancelled || d.date < from || d.date > to) continue;
    const t = invoiceTotals(d);
    s.count++;
    s.invoiced = round2(s.invoiced + t.total);
    s.received = round2(s.received + Math.min(t.paid, t.total));
    s.outstanding = round2(s.outstanding + t.balance);
    s.gst = round2(s.gst + t.tax);
  }
  return s;
}

export type MonthTotal = { month: string; label: string; invoiced: number };

/** Invoiced value for the last `count` calendar months, oldest first. Empty months are kept at 0. */
export function monthlyInvoiced(docs: InvoiceDoc[], today: string, count = 6): MonthTotal[] {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  const months: MonthTotal[] = [];
  for (let back = count - 1; back >= 0; back--) {
    const d = new Date(Date.UTC(year, month - back, 1));
    months.push({
      month: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }),
      invoiced: 0,
    });
  }
  for (const doc of docs) {
    if (doc.kind !== "invoice" || doc.cancelled) continue;
    const slot = months.find((m) => m.month === doc.date.slice(0, 7));
    if (slot) slot.invoiced = round2(slot.invoiced + invoiceTotals(doc).total);
  }
  return months;
}

/** Unpaid invoices that are overdue or due within `days`, the most urgent first. */
export function needingAttention(docs: InvoiceDoc[], today: string, days = 7) {
  const limit = addDays(today, days);
  return docs
    .filter((d) => {
      const status = docStatus(d, today);
      if (status === "overdue") return true;
      return (status === "unpaid" || status === "partial") && !!d.dueDate && d.dueDate <= limit;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per invoice, for the accountant or GSTR-1 preparation. */
export function invoicesCsv(docs: InvoiceDoc[], today: string) {
  const head = [
    "Type",
    "Number",
    "Date",
    "Customer",
    "Customer GSTIN",
    "Place of supply",
    "Taxable value",
    "CGST",
    "SGST/UTGST",
    "IGST",
    "Total",
    "Received",
    "Balance",
    "Status",
  ];
  const rows = [...docs]
    .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number))
    .map((d) => {
      const t = invoiceTotals(d);
      return [
        kindLabel[d.kind],
        d.number,
        d.date,
        d.buyer.name,
        d.buyer.gstin,
        stateLabel(d.placeOfSupply),
        t.taxable,
        t.cgst,
        t.sgst,
        t.igst,
        t.total,
        t.paid,
        t.balance,
        docStatus(d, today),
      ];
    });
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

/* --------------------------------------------------------------- Backup */

export type Backup = {
  app: "alltoolsdesk-invoices";
  version: 1;
  exportedAt: string;
  business: Business | null;
  parties: Party[];
  products: Product[];
  documents: InvoiceDoc[];
};

export function makeBackup(data: Omit<Backup, "app" | "version" | "exportedAt">, now = new Date()): Backup {
  return { app: "alltoolsdesk-invoices", version: 1, exportedAt: now.toISOString(), ...data };
}

/** Parses a backup file, or throws a message for the user. */
export function parseBackup(text: string): Backup {
  let data: Partial<Backup>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not an invoice backup (it is not valid JSON).");
  }
  if (data?.app !== "alltoolsdesk-invoices" || data.version !== 1) throw new Error("This file is not an AllToolsDesk invoice backup.");
  const list = <T extends { id: string; updatedAt: number }>(v: unknown): T[] =>
    Array.isArray(v) ? (v.filter((x) => x && typeof x.id === "string" && typeof x.updatedAt === "number") as T[]) : [];
  return {
    app: "alltoolsdesk-invoices",
    version: 1,
    exportedAt: String(data.exportedAt ?? ""),
    business: data.business && typeof data.business === "object" ? data.business : null,
    parties: list<Party>(data.parties),
    products: list<Product>(data.products),
    documents: list<InvoiceDoc>(data.documents).filter((d) => Array.isArray(d.items) && d.seller && d.buyer),
  };
}

/** Merges records by id; the copy edited last wins. Returns the records that changed. */
export function mergeRecords<T extends { id: string; updatedAt: number }>(current: T[], incoming: T[]) {
  const byId = new Map(current.map((r) => [r.id, r]));
  return incoming.filter((r) => !byId.has(r.id) || byId.get(r.id)!.updatedAt < r.updatedAt);
}

/* ------------------------------------------------------------ Builders */

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const emptyBusiness = (): Business => ({
  name: "",
  address: "",
  state: "",
  gstRegistered: true,
  gstin: "",
  pan: "",
  phone: "",
  email: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  terms: "Goods once sold will not be taken back.\nPayment due within 15 days.",
  template: "clean",
  accent: "blue",
  prefixes: { ...defaultPrefixes },
});

export const sellerSnapshot = (b: Business): SellerSnapshot => ({
  name: b.name,
  address: b.address,
  state: b.state,
  gstRegistered: b.gstRegistered,
  gstin: b.gstin.trim().toUpperCase(),
  pan: b.pan,
  phone: b.phone,
  email: b.email,
  bankName: b.bankName,
  accountName: b.accountName,
  accountNumber: b.accountNumber,
  ifsc: b.ifsc,
  upiId: b.upiId,
});

export const emptyItem = (): LineItem => ({ id: newId(), name: "", hsn: "", qty: 1, unit: "Nos", rate: 0, discount: 0, gstRate: 18 });

export const emptyBuyer = (): BuyerSnapshot => ({ name: "", address: "", state: "", gstin: "", phone: "", email: "" });

const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 2026-11-07 → 07 Nov 2026 */
export const displayDate = (iso: string) => {
  const [y, m, d] = (iso ?? "").split("-");
  return y && m && d ? `${d} ${monthShort[Number(m) - 1]} ${y}` : "";
};

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A copy of a quotation or proforma as a new invoice dated today. */
export function convertToInvoice(source: InvoiceDoc, number: string, today: string, now: number): InvoiceDoc {
  return {
    ...source,
    id: newId(),
    kind: "invoice",
    number,
    date: today,
    dueDate: addDays(today, 15),
    items: source.items.map((i) => ({ ...i, id: newId() })),
    amountPaid: 0,
    cancelled: false,
    linkedId: source.id,
    createdAt: now,
    updatedAt: now,
  };
}

/* ------------------------------------------------------- Page examples */

/** A one-line description of an invoice's totals, as shown in the page examples. */
export function describeInvoice(input: {
  items: { qty: number; rate: number; gstRate: number; discount?: number }[];
  sellerState: string;
  buyerState: string;
  roundOff?: boolean;
}) {
  const t = invoiceTotals({
    seller: { ...sellerSnapshot(emptyBusiness()), state: input.sellerState },
    placeOfSupply: input.buyerState,
    items: input.items.map((i) => ({ ...emptyItem(), discount: 0, ...i })),
    roundOff: input.roundOff ?? true,
    amountPaid: 0,
  });
  const rs = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const taxes = t.supply === "inter" ? `IGST ${rs(t.igst)}` : `CGST ${rs(t.cgst)} + ${t.stateTaxName} ${rs(t.sgst)}`;
  return [`Taxable value: ${rs(t.taxable)}`, taxes, t.roundOff ? `Round off: ${rs(t.roundOff)}` : "", `Total: ${rs(t.total)} (${t.words})`]
    .filter(Boolean)
    .join("\n");
}
