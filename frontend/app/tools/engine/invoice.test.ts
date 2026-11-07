import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  accentHex,
  accentRgb,
  accents,
  amountInWords,
  checkGstin,
  convertToInvoice,
  docStatus,
  emptyBusiness,
  financialYear,
  gstinCheckChar,
  gstinState,
  invoiceTotals,
  invoiceWarnings,
  monthlyInvoiced,
  needingAttention,
  normalTemplate,
  invoicesCsv,
  lineTotals,
  makeBackup,
  mergeRecords,
  nextNumber,
  parseBackup,
  sellerSnapshot,
  summarise,
  validateInvoice,
  type InvoiceDoc,
} from "./invoice";
import { buildInvoicePdf, displayDate } from "./invoice-pdf";

const seller = {
  ...sellerSnapshot(emptyBusiness()),
  name: "Sharma Traders",
  address: "12 Main Road, Karol Bagh, New Delhi 110005",
  state: "07",
  gstin: "07AAPFU0939F1ZX",
};

function doc(overrides: Partial<InvoiceDoc> = {}): InvoiceDoc {
  return {
    id: "a",
    kind: "invoice",
    number: "INV/26-27/001",
    date: "2026-11-07",
    dueDate: "2026-11-22",
    seller,
    buyer: { name: "Mehta Electronics", address: "Sector 18, Noida", state: "09", gstin: "", phone: "", email: "" },
    placeOfSupply: "07",
    items: [
      { id: "1", name: "LED panel 18 W", hsn: "9405", qty: 10, unit: "Nos", rate: 450, discount: 0, gstRate: 18 },
      { id: "2", name: "Installation", hsn: "9954", qty: 1, unit: "Job", rate: 1500, discount: 10, gstRate: 18 },
      { id: "3", name: "Copper wire 1.5 mm", hsn: "8544", qty: 2.5, unit: "Kg", rate: 899.99, discount: 0, gstRate: 5 },
    ],
    roundOff: true,
    notes: "",
    terms: "",
    amountPaid: 0,
    cancelled: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("GSTIN", () => {
  it("computes the check character", () => {
    // Published sample GSTIN.
    expect(gstinCheckChar("27AAPFU0939F1Z")).toBe("V");
    expect(checkGstin("27AAPFU0939F1ZV")).toBeNull();
    expect(checkGstin(" 27aapfu0939f1zv ")).toBeNull();
    expect(checkGstin(seller.gstin)).toBeNull();
  });

  it("explains what is wrong", () => {
    expect(checkGstin("27AAPFU0939F1ZW")).toMatch(/typing mistake/);
    expect(checkGstin("27AAPFU0939F1")).toMatch(/15 characters/);
    expect(checkGstin("99AAPFU0939F1ZV")).toMatch(/state code/);
    expect(gstinState("27AAPFU0939F1ZV")).toBe("27");
    expect(gstinState("27AAPFU0939F1ZW")).toBe("");
  });
});

describe("invoice maths", () => {
  it("applies the discount before GST", () => {
    expect(lineTotals({ qty: 1, rate: 1500, discount: 10, gstRate: 18 })).toEqual({ amount: 1500, discount: 150, taxable: 1350, tax: 243, total: 1593 });
    expect(lineTotals({ qty: 2.5, rate: 899.99, discount: 0, gstRate: 5 })).toMatchObject({ taxable: 2249.98, tax: 112.5 });
  });

  it("splits CGST and SGST within a state, by rate", () => {
    const t = invoiceTotals(doc());
    expect(t.supply).toBe("intra");
    expect(t.taxable).toBe(8099.98);
    expect(t.tax).toBe(1165.5);
    expect(t.byRate.map((r) => [r.rate, r.cgst, r.sgst])).toEqual([
      [5, 56.25, 56.25],
      [18, 526.5, 526.5],
    ]);
    expect(t.cgst + t.sgst).toBeCloseTo(t.tax, 2);
    expect(t.roundOff).toBe(-0.48);
    expect(t.total).toBe(9265);
    expect(t.words).toBe("Rupees Nine Thousand Two Hundred Sixty Five Only");
    expect(t.byHsn).toHaveLength(3);
  });

  it("charges IGST across states and UTGST in union territories", () => {
    const inter = invoiceTotals(doc({ placeOfSupply: "09" }));
    expect(inter.supply).toBe("inter");
    expect(inter.igst).toBe(1165.5);
    expect(inter.cgst).toBe(0);
    const ut = invoiceTotals(doc({ seller: { ...seller, state: "04" }, placeOfSupply: "04" }));
    expect(ut.stateTaxName).toBe("UTGST");
    // Exports: place of supply outside India is inter-state.
    expect(invoiceTotals(doc({ placeOfSupply: "96" })).supply).toBe("inter");
  });

  it("charges no GST for unregistered sellers", () => {
    const t = invoiceTotals(doc({ seller: { ...seller, gstRegistered: false, gstin: "" } }));
    expect(t.supply).toBe("none");
    expect(t.tax).toBe(0);
    expect(t.total).toBe(8100);
  });

  it("keeps paise without round-off and tracks payments", () => {
    const t = invoiceTotals(doc({ roundOff: false, amountPaid: 5000 }));
    expect(t.total).toBe(9265.48);
    expect(t.balance).toBe(4265.48);
    expect(t.words).toBe("Rupees Nine Thousand Two Hundred Sixty Five and Forty Eight Paise Only");
    expect(amountInWords(0.5)).toBe("Rupees Zero and Fifty Paise Only");
    expect(amountInWords(1_00_000)).toBe("Rupees One Lakh Only");
  });
});

describe("numbering", () => {
  it("knows the financial year", () => {
    expect(financialYear("2026-03-31")).toBe("2025-26");
    expect(financialYear("2026-04-01")).toBe("2026-27");
    expect(financialYear("2099-12-01")).toBe("2099-00");
  });

  it("continues the series for the prefix and year", () => {
    expect(nextNumber("INV", "2026-11-07", [])).toBe("INV/26-27/001");
    expect(nextNumber("INV", "2026-11-07", ["INV/26-27/001", "INV/26-27/009", "INV/25-26/120", "QT/26-27/050"])).toBe("INV/26-27/010");
    expect(nextNumber("INV", "2027-04-01", ["INV/26-27/009"])).toBe("INV/27-28/001");
    expect(nextNumber("INV", "2026-11-07", ["INV/26-27/999"])).toBe("INV/26-27/1000");
  });
});

describe("validation", () => {
  it("accepts a complete invoice", () => {
    expect(validateInvoice(doc())).toEqual([]);
  });

  it("lists what is missing", () => {
    const problems = validateInvoice(
      doc({
        number: "INV 1 with spaces",
        buyer: { name: "", address: "", state: "", gstin: "29ABCDE1234F1Z0", phone: "", email: "" },
        items: [{ id: "1", name: "", hsn: "", qty: 0, unit: "", rate: 10, discount: 0, gstRate: 18 }],
      }),
    ).map((p) => p.message);
    expect(problems).toContain("Enter the customer's name.");
    expect(problems.some((p) => p.startsWith("Customer's GSTIN"))).toBe(true);
    expect(problems.some((p) => p.includes("16 letters"))).toBe(true);
    expect(problems).toContain("Item 1: enter what you are selling.");
    expect(problems).toContain("Item 1: the quantity should be more than 0.");
  });

  it("needs a GSTIN only when registered, and English letters for the PDF", () => {
    expect(validateInvoice(doc({ seller: { ...seller, gstin: "" } }))[0].message).toMatch(/GSTIN/);
    expect(validateInvoice(doc({ seller: { ...seller, gstRegistered: false, gstin: "" }, placeOfSupply: "" }))).toEqual([]);
    expect(validateInvoice(doc({ buyer: { ...doc().buyer, name: "मेहता" } }))[0].message).toMatch(/English letters/);
    expect(validateInvoice(doc({ notes: "Paid ₹500 advance – thanks" }))).toEqual([]);
  });
});

describe("history", () => {
  it("works out the status", () => {
    expect(docStatus(doc(), "2026-11-10")).toBe("unpaid");
    expect(docStatus(doc(), "2026-12-01")).toBe("overdue");
    expect(docStatus(doc({ amountPaid: 100 }), "2026-11-10")).toBe("partial");
    expect(docStatus(doc({ amountPaid: 9265 }), "2026-12-01")).toBe("paid");
    expect(docStatus(doc({ cancelled: true }), "2026-11-10")).toBe("cancelled");
    expect(docStatus(doc({ kind: "quotation" }), "2026-11-10")).toBe("open");
    expect(docStatus(doc({ kind: "quotation", linkedId: "b" }), "2026-11-10")).toBe("converted");
  });

  it("summarises invoices in a period, leaving out quotations and cancelled ones", () => {
    const docs = [doc({ amountPaid: 5000 }), doc({ id: "b", kind: "quotation" }), doc({ id: "c", cancelled: true }), doc({ id: "d", date: "2026-03-01" })];
    expect(summarise(docs, "2026-04-01", "2027-03-31")).toEqual({ count: 1, invoiced: 9265, received: 5000, outstanding: 4265, gst: 1165.5 });
  });

  it("exports a CSV for the accountant", () => {
    const csv = invoicesCsv([doc({ buyer: { ...doc().buyer, name: 'Mehta "Electronics", Noida' } })], "2026-11-10").split("\n");
    expect(csv[0]).toBe("Type,Number,Date,Customer,Customer GSTIN,Place of supply,Taxable value,CGST,SGST/UTGST,IGST,Total,Received,Balance,Status");
    expect(csv[1]).toBe('Invoice,INV/26-27/001,2026-11-07,"Mehta ""Electronics"", Noida",,Delhi (07),8099.98,582.75,582.75,0,9265,0,9265,unpaid');
  });

  it("turns a quotation into an invoice", () => {
    const q = doc({ id: "q", kind: "quotation", number: "QT/26-27/004", amountPaid: 0 });
    const inv = convertToInvoice(q, "INV/26-27/002", "2026-11-20", 5);
    expect(inv).toMatchObject({ kind: "invoice", number: "INV/26-27/002", date: "2026-11-20", dueDate: "2026-12-05", linkedId: "q", createdAt: 5 });
    expect(inv.id).not.toBe("q");
    expect(invoiceTotals(inv).total).toBe(invoiceTotals(q).total);
  });
});

describe("backup", () => {
  it("round-trips and merges by last edit", () => {
    const backup = makeBackup({ business: emptyBusiness(), parties: [], products: [], documents: [doc()] }, new Date("2026-11-07T10:00:00Z"));
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.documents).toHaveLength(1);
    expect(parsed.exportedAt).toBe("2026-11-07T10:00:00.000Z");
    expect(() => parseBackup("{")).toThrow(/not valid JSON/);
    expect(() => parseBackup('{"app":"other"}')).toThrow(/not an AllToolsDesk/);
    const current = [
      { id: "a", updatedAt: 5 },
      { id: "b", updatedAt: 5 },
    ];
    expect(
      mergeRecords(current, [
        { id: "a", updatedAt: 4 },
        { id: "b", updatedAt: 6 },
        { id: "c", updatedAt: 1 },
      ]).map((r) => r.id),
    ).toEqual(["b", "c"]);
  });
});

describe("invoice PDF", () => {
  it("draws an A4 invoice with a UPI QR", async () => {
    const data = await buildInvoicePdf({
      doc: doc({ seller: { ...seller, upiId: "sharma@okaxis", bankName: "HDFC Bank", ifsc: "hdfc0001234" } }),
      branding: { template: "modern", accent: "blue" },
    });
    const pdf = await PDFDocument.load(data);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
    expect(pdf.getTitle()).toBe("Tax Invoice INV/26-27/001 – Mehta Electronics");
  });

  it("stops a preview on other scripts, which the embedded font would print as empty boxes", async () => {
    await expect(
      buildInvoicePdf({ doc: doc({ buyer: { ...doc().buyer, name: "मेहता" } }), branding: { template: "modern", accent: "blue" }, draft: true }),
    ).rejects.toThrow(/English letters/);
  });

  it("prints an unfinished draft for the preview", async () => {
    const data = await buildInvoicePdf({ doc: doc({ buyer: { ...doc().buyer, name: "" } }), branding: { template: "modern", accent: "blue" }, draft: true });
    expect((await PDFDocument.load(data)).getPageCount()).toBe(1);
  });

  it("fits very large amounts and long names on one page", async () => {
    const data = await buildInvoicePdf({
      doc: doc({ seller: { ...seller, name: "Maharashtra Precision Engineering and Allied Industries Private Limited" }, items: [{ ...doc().items[0], qty: 12, rate: 10250000 }] }),
      branding: { template: "modern", accent: "blue" },
    });
    expect((await PDFDocument.load(data)).getPageCount()).toBe(1);
  });

  it.each(["clean", "elegant", "bold", "classic", "modern"] as const)("draws the %s template on one page with the full tax details", async (template) => {
    const data = await buildInvoicePdf({
      doc: doc({ shipTo: "Mehta Warehouse\nBhiwandi, Maharashtra", poNumber: "PO-4471", notes: "Thank you", terms: "Net 15" }),
      branding: { template, accent: "#f5d90a" },
    });
    expect((await PDFDocument.load(data)).getPageCount()).toBe(1);
  });

  it("reads named and custom colours, and falls back on anything else", () => {
    expect(accentRgb("green")).toEqual(accents.green.rgb);
    expect(accentRgb("#ff0000")).toEqual([1, 0, 0]);
    expect(accentRgb("nonsense")).toEqual(accents.blue.rgb);
    expect(accentHex("#ff0000")).toBe("#ff0000");
  });

  it("treats the older modern template as Clean", () => {
    expect(normalTemplate("modern")).toBe("clean");
    expect(normalTemplate("bold")).toBe("bold");
    expect(normalTemplate(undefined)).toBe("clean");
  });

  it("warns about HSN gaps and large sales to unregistered customers, without blocking", () => {
    const item = doc().items[0];
    expect(invoiceWarnings(doc({ items: [{ ...item, hsn: "94" }] }))[0]).toMatch(/4 to 8 digits/);
    expect(invoiceWarnings(doc({ items: [{ ...item, hsn: "" }], buyer: { ...doc().buyer, gstin: "27AAPFU0939F1ZV" } }))[0]).toMatch(/registered customers/);
    const large = doc({ items: [{ ...item, hsn: "9405", qty: 1, rate: 60000 }], buyer: { ...doc().buyer, gstin: "", address: "" }, shipTo: "" });
    expect(invoiceWarnings(large).join()).toMatch(/50,000/);
    expect(invoiceWarnings({ ...large, shipTo: "Depot, Pune" })).toEqual([]);
    expect(validateInvoice(large).some((p) => p.field === "items")).toBe(false);
  });

  it("continues long item lists on more pages", async () => {
    const items = Array.from({ length: 60 }, (_, i) => ({
      id: String(i),
      name: `Item number ${i + 1} with a fairly long description that wraps onto a second line in the table`,
      hsn: "9405",
      qty: 1,
      unit: "Nos",
      rate: 100,
      discount: 0,
      gstRate: 18,
    }));
    const pdf = await PDFDocument.load(
      await buildInvoicePdf({ doc: doc({ items, notes: "Thank you", terms: "Net 15" }), branding: { template: "classic", accent: "ink" } }),
    );
    expect(pdf.getPageCount()).toBeGreaterThan(2);
  });

  it("refuses an invalid invoice", async () => {
    await expect(buildInvoicePdf({ doc: doc({ buyer: { ...doc().buyer, name: "" } }), branding: { template: "modern", accent: "blue" } })).rejects.toThrow(
      /customer's name/,
    );
  });

  it("totals the last six months, leaving out quotations and cancelled invoices", () => {
    const months = monthlyInvoiced(
      [
        doc({ date: "2026-11-02" }),
        doc({ date: "2026-11-03", cancelled: true }),
        doc({ date: "2026-11-04", kind: "quotation" }),
        doc({ date: "2026-05-31" }),
        doc({ date: "2026-06-01" }),
      ],
      "2026-11-07",
    );
    const one = invoiceTotals(doc()).total;
    expect(months.map((m) => m.month)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(months[0].invoiced).toBe(one);
    expect(months[1].invoiced).toBe(0);
    expect(months[5].invoiced).toBe(one);
  });

  it("crosses the year boundary when listing months", () => {
    expect(monthlyInvoiced([], "2027-02-15", 3).map((m) => m.month)).toEqual(["2026-12", "2027-01", "2027-02"]);
  });

  it("lists overdue and soon-due invoices, most urgent first", () => {
    const total = invoiceTotals(doc()).total;
    const late = doc({ dueDate: "2026-11-01", number: "LATE" });
    const soon = doc({ dueDate: "2026-11-10", number: "SOON" });
    const far = doc({ dueDate: "2026-12-20", number: "FAR" });
    const paid = doc({ dueDate: "2026-11-01", number: "PAID", amountPaid: total });
    const cancelled = doc({ dueDate: "2026-11-01", number: "CANCELLED", cancelled: true });
    const quote = doc({ dueDate: "2026-11-01", number: "QUOTE", kind: "quotation" });
    expect(needingAttention([far, soon, paid, cancelled, quote, late], "2026-11-07").map((d) => d.number)).toEqual(["LATE", "SOON"]);
  });

  it("formats dates", () => {
    expect(displayDate("2026-11-07")).toBe("07 Nov 2026");
  });
});
