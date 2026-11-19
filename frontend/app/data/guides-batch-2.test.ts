import { describe, expect, it } from "vitest";
import { guidesBatch2 } from "./guides-batch-2";
import { bmiHeightChart, calculateBmi } from "~/tools/engine/bmi";
import { calculateLoan } from "~/tools/engine/loan";
import { calculateAge } from "~/tools/engine/age";
import { manualEmi } from "~/tools/defs/loan-pages";

const guide = (slug: string) => guidesBatch2.find((g) => g.slug === slug)!;
const text = (slug: string) => JSON.stringify(guide(slug));
const table = (slug: string) =>
  guide(slug).sections.flatMap((s) => s.blocks).find((b) => b.type === "table") as { rows: string[][] };

describe("guides batch 2 figures match the engines", () => {
  it("ideal weight chart", () => {
    const rows = table("ideal-weight-for-height-chart").rows;
    expect(rows.map((r) => r.join("|"))).toEqual(
      bmiHeightChart().map((r) => `${r.ft} ft ${r.in} in|${r.cm}|${r.who[0]} – ${r.who[1]}|${r.asian[0]} – ${r.asian[1]}`),
    );
    const example = calculateBmi({ system: "mixed", weightKg: 72, heightFt: 5, heightIn: 7, scale: "asian" });
    expect(example).toMatchObject({ bmi: 24.9, category: "Overweight", healthyRange: { max: 66.3 } });
    expect(calculateBmi({ system: "mixed", weightKg: 72, heightFt: 5, heightIn: 7 })).toMatchObject({ category: "Healthy weight" });
  });

  it("EMI guide", () => {
    const t = text("how-to-calculate-emi-manually-excel");
    for (const [amount, rate, years] of [["8,00,000", "9", 5], ["5,00,000", "12", 3], ["30,00,000", "8.5", 20]] as const) {
      const emi = manualEmi(amount, rate, years).emi;
      expect(t).toContain(`₹${emi.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
    }
    const car = calculateLoan({ principal: 800_000, annualRate: 9, months: 60 });
    const home = calculateLoan({ principal: 3_000_000, annualRate: 8.5, months: 240 });
    expect(car.ok && home.ok).toBe(true);
    if (car.ok && home.ok) {
      expect(car.totalInterest).toBe(196401.05);
      expect(home.totalInterest).toBe(3248327.28);
      expect(car.schedule[0].interest).toBe(66616.19);
    }
    expect(t).toContain("₹1,96,401.05");
    expect(t).toContain("₹32,48,327.28");
    expect(t).toContain("₹66,616.19");
  });

  it("cm to pixels table", () => {
    const px = (cm: number, dpi: number) => Math.round((cm / 2.54) * dpi);
    expect([px(2.5, 200), px(3.5, 200), px(2.5, 300), px(3.5, 300)]).toEqual([197, 276, 295, 413]);
    expect([px(4.5, 200), px(4.5, 300), px(5, 200), px(5, 300)]).toEqual([354, 531, 394, 591]);
  });

  it("age examples", () => {
    const age = (b: string) => {
      const r = calculateAge(b, "2026-08-01");
      return r.ok ? `${r.years} years, ${r.months} months, ${r.days} days` : r.message;
    };
    const rows = table("age-on-exam-cut-off-date").rows;
    const iso = ["1996-08-01", "1996-08-02", "2001-08-15", "1998-03-10"];
    rows.forEach((row, i) => expect(row[1]).toBe(age(iso[i])));
    expect(calculateAge("2004-02-29", "2026-02-28")).toMatchObject({ years: 22, months: 0, days: 0 });
  });
});
