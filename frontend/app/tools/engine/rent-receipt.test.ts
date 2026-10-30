import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildRentReceipts, describeRentReceipts, monthsBetween, needsPan, rupeesInWords, validateRentReceipt, type RentReceiptInput } from "./rent-receipt";

const base: RentReceiptInput = {
  tenant: "Rohan Mehta",
  landlord: "Sunita Kapoor",
  landlordPan: "ABCDE1234F",
  address: "Flat 12, Shanti Apartments\nSector 15, Rohini, Delhi 110085",
  rent: 18_000,
  from: "2026-04",
  to: "2027-03",
  mode: "UPI",
};

describe("rent receipts", () => {
  it("writes amounts in Indian words", () => {
    expect(rupeesInWords(18_000)).toBe("Eighteen Thousand");
    expect(rupeesInWords(1_25_450)).toBe("One Lakh Twenty Five Thousand Four Hundred Fifty");
    expect(rupeesInWords(2_03_00_009)).toBe("Two Crore Three Lakh Nine");
  });

  it("lists the months of a financial year", () => {
    const m = monthsBetween("2026-04", "2027-03");
    expect(m).toHaveLength(12);
    expect(m[0]).toEqual({ year: 2026, month: 3 });
    expect(m[11]).toEqual({ year: 2027, month: 2 });
    expect(monthsBetween("2027-01", "2026-01")).toEqual([]);
  });

  it("checks the details", () => {
    expect(validateRentReceipt(base)).toBeNull();
    expect(validateRentReceipt({ ...base, landlordPan: "1234" })).toMatch(/PAN/);
    expect(validateRentReceipt({ ...base, tenant: "रोहन" })).toMatch(/English letters/);
    expect(needsPan({ rent: 8_000 })).toBe(false);
    expect(needsPan({ rent: 8_334 })).toBe(true);
  });

  it("builds two receipts per A4 page", async () => {
    const pdf = await PDFDocument.load(await buildRentReceipts(base));
    expect(pdf.getPageCount()).toBe(6);
    const cash = await PDFDocument.load(await buildRentReceipts({ ...base, from: "2026-04", to: "2026-04", mode: "Cash" }));
    expect(cash.getPageCount()).toBe(1);
  });

  it("summarises the receipts", () => {
    expect(describeRentReceipts(base)).toBe(
      "12 receipts, April 2026 to March 2027\nTotal rent: Rs. 2,16,000\nEach: Rs. 18,000 (Rupees Eighteen Thousand Only)",
    );
  });
});
