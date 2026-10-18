import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { calculateAge } from "./age";
import { calculateBmi } from "./bmi";
import { calculateLoan } from "./loan";
import { convertTimestamp, guessUnit } from "./timestamp";
import { digest, hashAll, matchChecksum, md5, utf8 } from "./hash";
import { contrastRatio, formatColor, parseAnyColor } from "./color";
import { imagesToPdf, jpegOrientation, pageLayout } from "./images-pdf";

describe("age", () => {
  it("counts years, months and days across month ends and leap days", () => {
    expect(calculateAge("1990-05-15", "2026-10-18")).toMatchObject({ years: 36, months: 5, days: 3 });
    expect(calculateAge("2000-01-31", "2000-03-01")).toMatchObject({ years: 0, months: 1, days: 1 });
    expect(calculateAge("2000-02-29", "2023-02-28")).toMatchObject({ years: 23, months: 0, days: 0 });
    expect(calculateAge("2000-02-29", "2023-02-27")).toMatchObject({ years: 22, months: 11 });
  });

  it("finds the next birthday and totals", () => {
    const r = calculateAge("1990-10-18", "2026-10-18");
    expect(r).toMatchObject({ years: 36, months: 0, days: 0, nextBirthday: { daysUntil: 0, turning: 36 } });
    const s = calculateAge("2026-01-01", "2026-01-15");
    expect(s).toMatchObject({ totalDays: 14, totalWeeks: 2, nextBirthday: { date: "2027-01-01", turning: 1 } });
  });

  it("rejects impossible input", () => {
    expect(calculateAge("2026-02-30", "2026-03-01").ok).toBe(false);
    expect(calculateAge("2027-01-01", "2026-01-01").ok).toBe(false);
  });
});

describe("bmi", () => {
  it("matches metric and imperial and uses WHO categories", () => {
    expect(calculateBmi({ system: "metric", weightKg: 70, heightCm: 175 })).toMatchObject({ bmi: 22.9, category: "Healthy weight" });
    const imperial = calculateBmi({ system: "imperial", weightLb: 154.32, heightFt: 5, heightIn: 9 });
    expect(imperial).toMatchObject({ bmi: 22.8, category: "Healthy weight", healthyRange: { unit: "lb" } });
    expect(calculateBmi({ system: "metric", weightKg: 95, heightCm: 175 })).toMatchObject({ category: "Obesity" });
    expect(calculateBmi({ system: "metric", weightKg: 0, heightCm: 175 }).ok).toBe(false);
  });
});

describe("loan", () => {
  it("computes the standard amortised payment", () => {
    // 200,000 at 6% over 30 years: the textbook 1,199.10 a month.
    const r = calculateLoan({ principal: 200_000, annualRate: 6, months: 360 });
    expect(r).toMatchObject({ payment: 1199.1, totalInterest: 231676.38 });
    if (r.ok) {
      expect(r.schedule).toHaveLength(30);
      expect(r.schedule.at(-1)!.balance).toBe(0);
      expect(r.schedule.reduce((n, y) => n + y.principal, 0)).toBeCloseTo(200_000, 1);
    }
  });

  it("handles a 0% loan and rejects bad terms", () => {
    expect(calculateLoan({ principal: 1200, annualRate: 0, months: 12 })).toMatchObject({ payment: 100, totalInterest: 0 });
    expect(calculateLoan({ principal: 1200, annualRate: 5, months: 0 }).ok).toBe(false);
  });
});

describe("timestamp", () => {
  it("guesses the unit from the size of the number", () => {
    expect(guessUnit(1_700_000_000)).toBe("seconds");
    expect(guessUnit(1_700_000_000_000)).toBe("milliseconds");
    expect(guessUnit(1_700_000_000_000_000)).toBe("microseconds");
    expect(guessUnit(1.7e18)).toBe("nanoseconds");
  });

  it("converts timestamps and date text both ways", () => {
    const r = convertTimestamp("1700000000", { now: 1_700_000_000_000, timeZone: "UTC" });
    expect(r).toMatchObject({ iso: "2023-11-14T22:13:20.000Z", ms: 1_700_000_000_000, relative: "just now" });
    expect(convertTimestamp("2023-11-14T22:13:20Z", { now: 1_700_086_400_000 })).toMatchObject({ seconds: 1_700_000_000, relative: "yesterday" });
    expect(convertTimestamp("next tuesday").ok).toBe(false);
  });
});

describe("hash", () => {
  it("matches the RFC and NIST test vectors", async () => {
    expect(md5(utf8(""))).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(md5(utf8("The quick brown fox jumps over the lazy dog"))).toBe("9e107d9d372bb6826bd81d3542a419d6");
    expect(md5(utf8("a".repeat(1000)))).toBe("cabe45dcc9ae5b66ba86600cca6b8ba8");
    expect(await digest("SHA-1", utf8("abc"))).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(await digest("SHA-256", utf8("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("identifies which algorithm an expected checksum belongs to", async () => {
    const all = await hashAll(utf8("abc"));
    expect(matchChecksum("BA7816BF 8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD", all)).toBe("SHA-256");
    expect(matchChecksum("deadbeef", all)).toBe(false);
    expect(matchChecksum("  ", all)).toBeNull();
  });
});

describe("colour", () => {
  it("parses common syntaxes to the same colour", () => {
    const expected = { r: 244, g: 81, b: 30, alpha: 1 };
    for (const input of ["#f4511e", "F4511E", "rgb(244, 81, 30)", "rgb(244 81 30)", "hsl(14 91% 54%)"]) {
      const c = parseAnyColor(input)!;
      expect(Math.abs(c.r - expected.r) + Math.abs(c.g - expected.g) + Math.abs(c.b - expected.b), input).toBeLessThanOrEqual(3);
    }
    expect(parseAnyColor("#0f08")).toEqual({ r: 0, g: 255, b: 0, alpha: 0.533 });
    expect(parseAnyColor("rgba(0,0,0,.5)")?.alpha).toBe(0.5);
    expect(parseAnyColor("not a colour")).toBeNull();
  });

  it("formats every model and measures WCAG contrast", () => {
    expect(formatColor({ r: 255, g: 0, b: 0, alpha: 1 })).toEqual({
      hex: "#ff0000",
      rgb: "rgb(255 0 0)",
      hsl: "hsl(0 100% 50%)",
      hsv: "hsv(0, 100%, 100%)",
      cmyk: "cmyk(0%, 100%, 100%, 0%)",
    });
    expect(contrastRatio({ r: 0, g: 0, b: 0, alpha: 1 }, { r: 255, g: 255, b: 255, alpha: 1 })).toBe(21);
  });
});

// 1×1 PNG and a minimal JPEG with an EXIF orientation of 6.
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
const exifJpegHead = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, 0x00, 0x01,
  0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xd9,
]);

describe("images to PDF", () => {
  it("fits images onto A4 and Letter pages, turning wide ones to landscape", () => {
    const opts = { pageSize: "a4", orientation: "auto", margin: "small" } as const;
    const wide = pageLayout({ width: 4000, height: 3000 }, opts);
    expect(wide.page).toEqual({ width: 841.89, height: 595.28 });
    expect(wide.image.height).toBeCloseTo(595.28 - 36, 1);
    const small = pageLayout({ width: 200, height: 100 }, opts);
    expect(small.image).toMatchObject({ width: 150, height: 75 });
    expect(pageLayout({ width: 960, height: 480 }, { pageSize: "fit", orientation: "auto", margin: "none" }).page).toEqual({ width: 720, height: 360 });
  });

  it("builds one page per image and reads EXIF orientation", async () => {
    const r = await imagesToPdf(
      [
        { name: "a.png", data: PNG, type: "image/png", width: 1, height: 1 },
        { name: "b.png", data: PNG, type: "image/png", width: 1, height: 1 },
      ],
      { pageSize: "letter", orientation: "portrait", margin: "none" },
    );
    expect(r.pageCount).toBe(2);
    expect((await PDFDocument.load(r.data)).getPage(0).getSize()).toEqual({ width: 612, height: 792 });
    expect(jpegOrientation(exifJpegHead)).toBe(6);
    expect(jpegOrientation(PNG)).toBe(1);
  });
});
