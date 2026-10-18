import { formatNumber } from "./percent";

export type BmiInput =
  | { system: "metric"; weightKg: number; heightCm: number }
  | { system: "imperial"; weightLb: number; heightFt: number; heightIn: number };

export type BmiCategory = "Underweight" | "Healthy weight" | "Overweight" | "Obesity";

export type BmiResult =
  | {
      ok: true;
      bmi: number;
      category: BmiCategory;
      /** Weight range for a BMI of 18.5–24.9 at this height, in the input's unit. */
      healthyRange: { min: number; max: number; unit: "kg" | "lb" };
    }
  | { ok: false; message: string };

const LB_PER_KG = 2.204_622_621_8;

/** WHO adult categories. */
export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy weight";
  if (bmi < 30) return "Overweight";
  return "Obesity";
}

export function calculateBmi(input: BmiInput): BmiResult {
  const metric = input.system === "metric";
  const kg = metric ? input.weightKg : input.weightLb / LB_PER_KG;
  const m = metric ? input.heightCm / 100 : (input.heightFt * 12 + input.heightIn) * 0.0254;
  if (!Number.isFinite(kg) || !Number.isFinite(m) || kg <= 0 || m <= 0)
    return { ok: false, message: "Enter your weight and height as positive numbers." };
  if (m < 0.5 || m > 2.75 || kg < 10 || kg > 500)
    return { ok: false, message: "Check the numbers: that height or weight is outside the range this calculator supports." };
  const bmi = Math.round((kg / (m * m)) * 10) / 10;
  const toUnit = (v: number) => Math.round((metric ? v : v * LB_PER_KG) * 10) / 10;
  return {
    ok: true,
    bmi,
    category: bmiCategory(bmi),
    healthyRange: { min: toUnit(18.5 * m * m), max: toUnit(24.9 * m * m), unit: metric ? "kg" : "lb" },
  };
}

export function describeBmi(input: BmiInput) {
  const r = calculateBmi(input);
  if (!r.ok) return r.message;
  const { min, max, unit } = r.healthyRange;
  return `BMI ${r.bmi.toFixed(1)} · ${r.category}\nHealthy weight for this height: ${formatNumber(min, 1)}–${formatNumber(max, 1)} ${unit}`;
}
