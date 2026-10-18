import type { WidgetToolDefinition } from "../types";

export const percentageCalculator: WidgetToolDefinition = {
  workspace: "percentage-calculator",
  slug: "percentage-calculator",
  category: "calculators",
  name: "Percentage Calculator",
  metaTitle: "Percentage Calculator – Percent of, Change and Increase",
  description:
    "Work out X% of a number, what percent one number is of another, the percentage change between two values, and price increases or discounts.",
  howTo: [
    "Pick the question that matches yours: four calculators sit side by side.",
    "Type your two numbers. The answer, a plain-English sentence and the formula update as you type.",
    "For a decrease or discount, enter a negative percentage in “Increase or decrease”, for example −20.",
    "Press the copy button next to an answer to paste it elsewhere.",
  ],
  examples: [
    { title: "A tip or tax amount", input: "What is 15% of 80?", output: "12\n15% × 80 = 12" },
    { title: "A test score", input: "45 is what percent of 60?", output: "75%\n45 ÷ 60 × 100 = 75%" },
    { title: "Price change", input: "Percentage change from 50 to 65", output: "+30%\n(65 − 50) ÷ 50 × 100 = 30% (increase)" },
    { title: "A 20% discount", input: "Decrease 250 by 20%", output: "200\n250 × (1 − 20%) = 200" },
  ],
  limitations: [
    "Answers are rounded to 4 decimal places for display.",
    "Percentage change is measured against the starting value, so a change from 0 cannot be calculated.",
    "Commas are read as thousands separators (1,250 is one thousand two hundred and fifty).",
  ],
  faq: [
    {
      question: "How do I calculate a percentage of a number?",
      answer: "Divide the percentage by 100 and multiply by the number. 15% of 80 is 0.15 × 80 = 12.",
    },
    {
      question: "How is percentage change calculated?",
      answer:
        "Subtract the old value from the new one, divide by the old value and multiply by 100. From 50 to 65 is (65 − 50) ÷ 50 × 100 = 30%.",
    },
    {
      question: "Why doesn’t a 20% decrease undo a 20% increase?",
      answer:
        "Each percentage applies to a different base. 100 plus 20% is 120, but 20% of 120 is 24, so decreasing by 20% gives 96. To undo +20%, decrease by about 16.67%.",
    },
    {
      question: "Is anything I enter saved?",
      answer: "No. Calculations run on your device and nothing is stored or sent.",
    },
  ],
  related: ["word-counter", "uuid-generator", "compress-image"],
};
