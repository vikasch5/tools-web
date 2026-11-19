import type { WidgetToolDefinition } from "../types";
import { cmToFeet, feetToCm, heightChart } from "../engine/height";

const chart = heightChart();
const cm = (ft: number, inches: number) => {
  const r = feetToCm(ft, inches);
  return r.ok ? r.cm : NaN;
};
const cm170 = cmToFeet(170);

export const heightConverter: WidgetToolDefinition = {
  workspace: "height-converter",
  slug: "feet-to-cm",
  category: "converters",
  name: "Feet to CM Height Converter",
  metaTitle: "Feet to CM – Height Converter with Feet and Inches Chart",
  description:
    "Convert height in feet and inches to centimetres, or cm to feet and inches. Shows both readings of shorthand like 5.8 ft, plus a full height chart.",
  overview: [
    "Height is given in feet and inches on most Indian forms and in everyday talk, but in centimetres on passports, medical reports, exam applications and BMI charts. This converter goes both ways, and shows the result in metres and total inches too.",
    `It also clears up the most common mix-up. People often write 5 ft 8 in as “5.8 feet”, but to a calculator 5.8 feet is a decimal: 5 ft 9.6 in, or ${cm(5, 9.6)} cm, about 4 cm taller than 5 ft 8 in (${cm(5, 8)} cm). Type a decimal like 5.8 with the inches box empty and you see both readings side by side, so you can pick the one you meant.`,
    "The conversion uses the exact international definition, 1 inch = 2.54 cm, so 1 foot = 30.48 cm. Results are rounded to one decimal place, which is finer than any height measurement needs.",
  ],
  howTo: [
    "Choose Feet → cm or cm → feet.",
    "For feet to cm, type the feet in the first box and the inches in the second: 5 and 8 for 5 ft 8 in.",
    "For cm to feet, type the centimetres. The answer appears as feet and inches.",
    "Not sure of your height in cm? Find it in the chart below, which lists every inch from 4 ft 6 in to 7 ft.",
  ],
  examples: [
    { title: "5 ft 8 in in centimetres", input: "5 ft 8 in", output: "172.7 cm (1.73 m)" },
    { title: "170 cm in feet and inches", input: "170 cm", output: "5 ft 6.9 in (66.9 inches)" },
    { title: "“5.8 feet”: both readings", input: "5.8 ft", output: "5.8 ft (decimal) = 5 ft 9.6 in = 176.8 cm\n5 ft 8 in = 172.7 cm" },
  ],
  reference: {
    title: "Height chart: feet and inches to cm",
    intro: "Every height from 4 ft 6 in to 7 ft, in centimetres, metres and decimal feet. Find your height in the first column and read across.",
    columns: ["Feet and inches", "Centimetres", "Metres", "Decimal feet"],
    rows: chart.map((r) => [`${r.ft} ft ${r.in} in`, `${r.cm} cm`, `${r.m} m`, `${r.decimalFeet} ft`]),
    note: "Rounded to 0.1 cm. Decimal feet are inches ÷ 12: 5 ft 6 in is 5.5 ft, not 5.6 ft.",
  },
  limitations: [
    "Rounded to one decimal place in cm and inches. Forms that ask for whole centimetres usually expect normal rounding: 172.7 cm becomes 173 cm.",
    "Heights above 10 feet are refused, to catch typing slips like 58 instead of 5.8.",
  ],
  faq: [
    {
      question: "How do I convert feet and inches to cm?",
      answer: `Multiply the feet by 12, add the inches, then multiply by 2.54. For 5 ft 8 in: 5 × 12 + 8 = 68 inches, and 68 × 2.54 = ${cm(5, 8)} cm.`,
    },
    {
      question: "Is 5.8 feet the same as 5 feet 8 inches?",
      answer: `No. A foot has 12 inches, not 10, so 5.8 feet is 5 feet and 0.8 × 12 = 9.6 inches, which is ${cm(5, 9.6)} cm. 5 feet 8 inches is ${cm(5, 8)} cm. In everyday speech “5.8” usually means 5 ft 8 in; on a calculator it means 5 ft 9.6 in.`,
    },
    {
      question: "How do I convert cm to feet and inches?",
      answer: `Divide by 2.54 to get inches, then divide by 12: the whole number is feet and the remainder is inches. 170 cm ÷ 2.54 = ${cm170.ok ? cm170.totalInches : ""} inches = ${cm170.ok ? `${cm170.feet.ft} ft ${cm170.feet.in} in` : ""}.`,
    },
    {
      question: "What is 6 feet in cm?",
      answer: `6 feet is 72 inches, or ${cm(6, 0)} cm. 5 feet is ${cm(5, 0)} cm, and 5 ft 6 in is ${cm(5, 6)} cm.`,
    },
    {
      question: "Is anything I enter saved?",
      answer: "No. The conversion runs in your browser and nothing is stored or sent.",
    },
  ],
  related: ["bmi-calculator", "unit-converter", "age-calculator"],
};
