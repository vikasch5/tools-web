import { formatNumber } from "./percent";

/**
 * Units:
 * - metric: kg and cm
 * - mixed: kg and feet + inches (common in India, where height is usually
 *   given in feet but weight in kilograms)
 * - imperial: lb and feet + inches
 */
export type BmiSystem = "metric" | "mixed" | "imperial";

/**
 * Cut-offs:
 * - who: WHO adult categories (healthy 18.5–24.9, overweight 25, obesity 30).
 * - asian: WHO Asia-Pacific (2000) cut-offs, also used by India's 2009
 *   consensus guidelines (healthy 18.5–22.9, overweight 23, obesity 25).
 */
export type BmiScale = "who" | "asian";

export type BmiInput = (
  | { system: "metric"; weightKg: number; heightCm: number }
  | { system: "mixed"; weightKg: number; heightFt: number; heightIn: number }
  | { system: "imperial"; weightLb: number; heightFt: number; heightIn: number }
) & { scale?: BmiScale };

export type BmiCategory = "Underweight" | "Healthy weight" | "Overweight" | "Obesity";

export type BmiResult =
  | {
      ok: true;
      bmi: number;
      category: BmiCategory;
      scale: BmiScale;
      /** Weight range for a healthy BMI at this height, in the input's weight unit. */
      healthyRange: { min: number; max: number; unit: "kg" | "lb" };
      /** Height in both systems, for display. */
      height: { cm: number; ft: number; in: number };
    }
  | { ok: false; message: string };

const LB_PER_KG = 2.204_622_621_8;
const CM_PER_IN = 2.54;

/** BMI bands per scale; `healthyMax` is the top of the healthy range. */
export const bmiScales: Record<
  BmiScale,
  { label: string; overweight: number; obesity: number; healthyMax: number; bands: { category: BmiCategory; range: string }[] }
> = {
  who: {
    label: "WHO",
    overweight: 25,
    obesity: 30,
    healthyMax: 24.9,
    bands: [
      { category: "Underweight", range: "Below 18.5" },
      { category: "Healthy weight", range: "18.5 – 24.9" },
      { category: "Overweight", range: "25 – 29.9" },
      { category: "Obesity", range: "30 and above" },
    ],
  },
  asian: {
    label: "Asian",
    overweight: 23,
    obesity: 25,
    healthyMax: 22.9,
    bands: [
      { category: "Underweight", range: "Below 18.5" },
      { category: "Healthy weight", range: "18.5 – 22.9" },
      { category: "Overweight", range: "23 – 24.9" },
      { category: "Obesity", range: "25 and above" },
    ],
  },
};

export function bmiCategory(bmi: number, scale: BmiScale = "who"): BmiCategory {
  const s = bmiScales[scale];
  if (bmi < 18.5) return "Underweight";
  if (bmi < s.overweight) return "Healthy weight";
  if (bmi < s.obesity) return "Overweight";
  return "Obesity";
}

/** Feet + inches to whole feet and inches (5.8 ft → 5 ft 9.6 in). */
export function splitFeet(totalInches: number) {
  const rounded = Math.round(totalInches * 10) / 10;
  const ft = Math.floor(rounded / 12);
  return { ft, in: Math.round((rounded - ft * 12) * 10) / 10 };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

export function calculateBmi(input: BmiInput): BmiResult {
  const scale = input.scale ?? "who";
  const kg = input.system === "imperial" ? input.weightLb / LB_PER_KG : input.weightKg;
  const totalInches = input.system === "metric" ? input.heightCm / CM_PER_IN : input.heightFt * 12 + input.heightIn;
  const m = (totalInches * CM_PER_IN) / 100;
  if (!Number.isFinite(kg) || !Number.isFinite(m) || kg <= 0 || m <= 0)
    return { ok: false, message: "Enter your weight and height as positive numbers." };
  if (m < 0.5 || m > 2.75 || kg < 10 || kg > 500)
    return { ok: false, message: "Check the numbers: that height or weight is outside the range this calculator supports." };
  const bmi = round1(kg / (m * m));
  const pounds = input.system === "imperial";
  const toUnit = (v: number) => round1(pounds ? v * LB_PER_KG : v);
  return {
    ok: true,
    bmi,
    scale,
    category: bmiCategory(bmi, scale),
    healthyRange: { min: toUnit(18.5 * m * m), max: toUnit(bmiScales[scale].healthyMax * m * m), unit: pounds ? "lb" : "kg" },
    height: { cm: round1(m * 100), ...splitFeet(totalInches) },
  };
}

export function describeBmi(input: BmiInput) {
  const r = calculateBmi(input);
  if (!r.ok) return r.message;
  const { min, max, unit } = r.healthyRange;
  const scale = r.scale === "asian" ? " (Asian cut-offs)" : "";
  return `BMI ${r.bmi.toFixed(1)} · ${r.category}${scale}\nHealthy weight for this height: ${formatNumber(min, 1)}–${formatNumber(max, 1)} ${unit}`;
}

/**
 * Healthy weight in kg for each height from 4 ft 10 in to 6 ft 4 in, under
 * both scales. Used for the reference chart on the page.
 */
export function bmiHeightChart() {
  const rows: { ft: number; in: number; cm: number; who: [number, number]; asian: [number, number] }[] = [];
  for (let inches = 58; inches <= 76; inches++) {
    const m = (inches * CM_PER_IN) / 100;
    const range = (max: number): [number, number] => [round1(18.5 * m * m), round1(max * m * m)];
    rows.push({
      ...splitFeet(inches),
      cm: round1(m * 100),
      who: range(bmiScales.who.healthyMax),
      asian: range(bmiScales.asian.healthyMax),
    });
  }
  return rows;
}
