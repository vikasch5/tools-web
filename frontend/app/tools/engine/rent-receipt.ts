/**
 * Rent receipts for claiming HRA: one receipt per month, two per A4 page,
 * as a PDF built with pdf-lib in the worker.
 */

export type RentReceiptInput = {
  tenant: string;
  landlord: string;
  /** Landlord's PAN; needed when rent is over ₹1 lakh a year. */
  landlordPan?: string;
  address: string;
  rent: number;
  /** First and last month, YYYY-MM. */
  from: string;
  to: string;
  mode: "Cash" | "UPI" | "Bank transfer" | "Cheque";
};

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number) {
  return n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
}
function belowThousand(n: number) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ones[h]} Hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

/** 1,25,450 → "One Lakh Twenty Five Thousand Four Hundred Fifty", the Indian way. */
export function rupeesInWords(amount: number) {
  let n = Math.round(amount);
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000);
  n %= 1_00_00_000;
  const lakh = Math.floor(n / 1_00_000);
  n %= 1_00_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${rupeesInWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));
  return parts.join(" ");
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Every month from `from` to `to` (YYYY-MM), inclusive, at most 24. */
export function monthsBetween(from: string, to: string) {
  const parse = (s: string) => {
    const m = s.match(/^(\d{4})-(\d{2})$/);
    return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : NaN;
  };
  const a = parse(from);
  const b = parse(to);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return [];
  return Array.from({ length: Math.min(b - a + 1, 24) }, (_, i) => {
    const k = a + i;
    return { year: Math.floor(k / 12), month: k % 12 };
  });
}

export const monthLabel = (m: { year: number; month: number }) => `${monthNames[m.month]} ${m.year}`;

const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
/** Helvetica in pdf-lib covers Latin text only. */
const latin = /^[\x20-\x7E -ÿ\n]*$/;

export function validateRentReceipt(input: RentReceiptInput): string | null {
  if (!input.tenant.trim()) return "Enter the tenant's name.";
  if (!input.landlord.trim()) return "Enter the landlord's name.";
  if (!input.address.trim()) return "Enter the address of the rented home.";
  if (!Number.isFinite(input.rent) || input.rent <= 0) return "Enter the monthly rent.";
  if (monthsBetween(input.from, input.to).length === 0) return "Choose a start month on or before the end month.";
  const pan = (input.landlordPan ?? "").trim().toUpperCase();
  if (pan && !panPattern.test(pan)) return "The landlord's PAN should look like ABCDE1234F.";
  if (![input.tenant, input.landlord, input.address].every((t) => latin.test(t)))
    return "Write names and the address in English letters; the PDF font cannot show other scripts.";
  return null;
}

/** Yearly rent over ₹1 lakh needs the landlord's PAN to claim HRA. */
export const needsPan = (input: Pick<RentReceiptInput, "rent">) => input.rent * 12 > 100_000;

const money = (n: number) => `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** "paid by UPI", "paid by bank transfer". */
export const paidBy = (mode: RentReceiptInput["mode"]) => (mode === "UPI" ? mode : mode.toLowerCase());

export function describeRentReceipts(input: RentReceiptInput) {
  const error = validateRentReceipt(input);
  if (error) return error;
  const months = monthsBetween(input.from, input.to);
  return `${months.length} receipts, ${monthLabel(months[0])} to ${monthLabel(months.at(-1)!)}\nTotal rent: ${money(input.rent * months.length)}\nEach: ${money(input.rent)} (Rupees ${rupeesInWords(input.rent)} Only)`;
}

export async function buildRentReceipts(input: RentReceiptInput) {
  const error = validateRentReceipt(input);
  if (error) throw new Error(error);
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`Rent receipts – ${input.tenant}`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const months = monthsBetween(input.from, input.to);
  const pan = (input.landlordPan ?? "").trim().toUpperCase();
  const ink = rgb(0.1, 0.1, 0.12);
  const grey = rgb(0.45, 0.45, 0.5);
  const [W, H] = [595.28, 841.89];

  /** Wraps text to a width, returning lines. */
  const wrap = (text: string, size: number, width: number, f = font) => {
    const lines: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(next, size) > width && line) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      lines.push(line);
    }
    return lines;
  };

  months.forEach((m, i) => {
    const page = i % 2 === 0 ? doc.addPage([W, H]) : doc.getPage(doc.getPageCount() - 1);
    const top = i % 2 === 0 ? H - 40 : H / 2 - 20;
    const left = 50;
    const width = W - 100;
    // Card outline, and a dashed cut line between the two receipts.
    page.drawRectangle({ x: left - 14, y: top - 360, width: width + 28, height: 360, borderColor: grey, borderWidth: 0.75 });
    if (i % 2 === 0)
      page.drawLine({ start: { x: 20, y: H / 2 }, end: { x: W - 20, y: H / 2 }, thickness: 0.5, color: grey, dashArray: [4, 4] });

    let y = top - 34;
    page.drawText("RENT RECEIPT", { x: left, y, size: 16, font: bold, color: ink });
    page.drawText(monthLabel(m), { x: left + width - bold.widthOfTextAtSize(monthLabel(m), 12), y: y + 2, size: 12, font: bold, color: ink });
    y -= 18;
    page.drawText(`Receipt no. ${i + 1}`, { x: left, y, size: 9, font, color: grey });

    y -= 34;
    const sentence = `Received a sum of ${money(input.rent)} (Rupees ${rupeesInWords(input.rent)} Only) from ${input.tenant.trim()} towards the rent of the property at ${input.address.trim().replace(/\s*\n\s*/g, ", ")} for the month of ${monthLabel(m)}, paid by ${paidBy(input.mode)}.`;
    for (const line of wrap(sentence, 11.5, width)) {
      page.drawText(line, { x: left, y, size: 11.5, font, color: ink, lineHeight: 16 });
      y -= 17;
    }

    y -= 14;
    const rows: [string, string][] = [
      ["Landlord", input.landlord.trim()],
      ["Landlord's PAN", pan || "Not provided"],
      ["Tenant", input.tenant.trim()],
      ["Amount", money(input.rent)],
    ];
    for (const [label, value] of rows) {
      page.drawText(label, { x: left, y, size: 10, font, color: grey });
      page.drawText(value, { x: left + 120, y, size: 10.5, font: bold, color: ink });
      y -= 16;
    }

    // Signature line, and a revenue stamp box for cash over Rs. 5,000.
    const signY = top - 330;
    page.drawLine({ start: { x: left + width - 170, y: signY }, end: { x: left + width, y: signY }, thickness: 0.75, color: ink });
    page.drawText("Landlord's signature", { x: left + width - 170, y: signY - 13, size: 9, font, color: grey });
    if (input.mode === "Cash" && input.rent > 5000) {
      page.drawRectangle({ x: left + width - 240, y: signY - 6, width: 52, height: 58, borderColor: grey, borderWidth: 0.75, borderDashArray: [3, 3] });
      page.drawText("Revenue", { x: left + width - 232, y: signY + 30, size: 7.5, font, color: grey });
      page.drawText("stamp", { x: left + width - 228, y: signY + 20, size: 7.5, font, color: grey });
    }
  });
  return doc.save();
}
