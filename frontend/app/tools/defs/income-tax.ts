import type { WidgetToolDefinition } from "../types";

export const incomeTaxCalculator: WidgetToolDefinition = {
  workspace: "income-tax-calculator",
  slug: "income-tax-calculator",
  category: "calculators",
  name: "Income Tax Calculator",
  metaTitle: "Income Tax Calculator FY 2026-27 – New vs Old Regime",
  description:
    "Compare your tax under the new and old regimes for FY 2026-27 (AY 2027-28): slabs, ₹75,000 standard deduction, 87A rebate up to ₹12 lakh, surcharge and cess.",
  overview: [
    "Every salaried person in India has to choose between two tax regimes. The new regime, the default, has lower rates and makes income up to ₹12 lakh tax-free after the rebate, but allows almost no deductions. The old regime has higher rates but lets you subtract 80C investments, health insurance, HRA, home loan interest and more. Which one is cheaper depends on how much you can claim.",
    "Enter your salary and any other income, and the deductions you have under the old regime. The calculator works out both regimes side by side using the FY 2026-27 rules, which Budget 2026 kept unchanged: the standard deduction, the slabs, the Section 87A rebate (with marginal relief just above ₹12 lakh), surcharge with its marginal relief, and 4% health and education cess. It then tells you which regime saves more and by how much.",
  ],
  howTo: [
    "Choose your age group; seniors get higher exemption limits under the old regime.",
    "Enter your gross salary or pension for the year, and any other income such as interest or rent.",
    "Fill in the old regime deductions you can claim: 80C, 80D, NPS, exempt HRA, home loan interest and others.",
    "Compare the total tax in both regimes and the breakdown under them; the lower one is marked.",
  ],
  examples: [
    { title: "₹15 lakh salary, no deductions", input: "Salary 15,00,000", output: "New regime: ₹97,500\nOld regime: ₹2,57,400\nNew regime saves ₹1,59,900" },
    { title: "₹12.75 lakh salary (tax-free in the new regime)", input: "Salary 12,75,000", output: "New regime: ₹0\nOld regime: ₹1,87,200\nNew regime saves ₹1,87,200" },
    {
      title: "₹25 lakh salary with large deductions (old regime wins)",
      input: "Salary 25,00,000, 80C 1,50,000, 80D 50,000, NPS 50,000, HRA 4,00,000, home loan 2,00,000",
      output: "New regime: ₹3,19,800\nOld regime: ₹3,04,200\nOld regime saves ₹15,600",
    },
  ],
  limitations: [
    "Capital gains, lottery winnings and other special-rate income are not included.",
    "Exemptions such as LTA, gratuity and leave encashment are not modelled; subtract them from salary yourself.",
    "This is an estimate for planning, not tax advice. Confirm the final figure in your ITR or with a professional.",
  ],
  faq: [
    {
      question: "What are the new regime tax slabs for FY 2026-27?",
      answer:
        "Up to ₹4 lakh: nil; ₹4–8 lakh: 5%; ₹8–12 lakh: 10%; ₹12–16 lakh: 15%; ₹16–20 lakh: 20%; ₹20–24 lakh: 25%; above ₹24 lakh: 30%. Budget 2026 kept these unchanged.",
    },
    {
      question: "Is income up to ₹12 lakh really tax-free?",
      answer:
        "Yes, in the new regime: the 87A rebate cancels tax up to ₹60,000 when taxable income is ₹12 lakh or less. Salaried people also get the ₹75,000 standard deduction, so a salary of up to ₹12.75 lakh pays no tax.",
    },
    {
      question: "Which regime should I choose?",
      answer:
        "If your deductions are small, the new regime is almost always cheaper. The old regime wins only with large claims such as full 80C, HRA on high rent and home loan interest. Enter your numbers to see the difference for you.",
    },
    {
      question: "Is anything I enter saved?",
      answer: "No. The calculation runs on your device and nothing is stored or sent.",
    },
  ],
  related: ["hra-calculator", "ppf-calculator", "gst-calculator"],
};
