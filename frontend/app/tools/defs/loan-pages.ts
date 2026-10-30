import type { WidgetToolDefinition } from "../types";
import { loanCalculator } from "./calculators";

type Page = {
  slug: string;
  name: string;
  metaTitle: string;
  description: string;
  amount: string;
  rate: string;
  years: number;
  intro: string;
  tip: string;
  example: { input: string; output: string };
  faq: { question: string; answer: string };
};

/** Landing pages: the EMI calculator with a typical Indian loan of each kind. */
const pages: Page[] = [
  {
    slug: "home-loan-emi-calculator",
    name: "Home Loan EMI Calculator",
    metaTitle: "Home Loan EMI Calculator with Prepayment – Free",
    description: "Work out your home loan EMI, total interest and how much a part-prepayment saves. Month-by-month schedule and CSV download, in rupees.",
    amount: "50,00,000",
    rate: "8.5",
    years: 20,
    intro: "A home loan is usually the largest and longest loan a family takes, often 15 to 30 years, so even a small difference in the rate or the tenure changes the total interest by lakhs of rupees. Banks quote the EMI, but the full cost and the effect of prepaying are harder to see.",
    tip: "The example starts at ₹50 lakh at 8.5% for 20 years; replace it with the amount, rate and tenure from your sanction letter. Prepaying even one EMI's worth a year can cut several years off a home loan.",
    example: { input: "5,000,000 at 8.5% for 20 years", output: "Monthly payment: 43,391.16\nTotal interest: 5,413,878.80\nTotal paid: 10,413,878.80" },
    faq: {
      question: "Is there a charge for prepaying a home loan?",
      answer: "For floating-rate home loans taken by individuals, RBI rules do not allow banks and housing finance companies to charge foreclosure or part-prepayment fees. Fixed-rate loans may carry a charge, so check your loan agreement.",
    },
  },
  {
    slug: "car-loan-emi-calculator",
    name: "Car Loan EMI Calculator",
    metaTitle: "Car Loan EMI Calculator – Monthly EMI and Total Interest",
    description: "Calculate the EMI on a new or used car loan, the total interest over the tenure, and the savings from paying extra. Free, in rupees.",
    amount: "8,00,000",
    rate: "9",
    years: 5,
    intro: "Car loans in India usually run 3 to 7 years and cover most of the on-road price. A longer tenure lowers the EMI, but you pay interest for longer, and the car loses value faster than the loan is repaid in the early years.",
    tip: "The example uses ₹8 lakh at 9% for 5 years; enter the loan amount after your down payment and the rate from the dealer or bank. Compare 5 and 7 years to see what the lower EMI really costs.",
    example: { input: "800,000 at 9% for 5 years", output: "Monthly payment: 16,606.68\nTotal interest: 196,401.05\nTotal paid: 996,401.05" },
    faq: {
      question: "Should I pick a longer tenure for a lower EMI?",
      answer: "Only if the EMI would otherwise strain your budget. A longer tenure adds interest for every extra year, and many car loans charge for early closure, so a shorter tenure is usually cheaper overall.",
    },
  },
  {
    slug: "personal-loan-emi-calculator",
    name: "Personal Loan EMI Calculator",
    metaTitle: "Personal Loan EMI Calculator – EMI, Interest, Schedule",
    description: "Find the EMI and total interest on a personal loan for any amount, rate and tenure, plus what a one-time prepayment would save. Free, in rupees.",
    amount: "5,00,000",
    rate: "12",
    years: 3,
    intro: "Personal loans are unsecured, so their rates are higher than home or car loans, and tenures are short, usually 1 to 5 years. Because of the high rate, interest adds up quickly, and the EMI is a large share of your monthly budget.",
    tip: "The example uses ₹5 lakh at 12% for 3 years; replace it with your lender's offer. Check the processing fee and foreclosure charges too, since they are not part of the EMI.",
    example: { input: "500,000 at 12% for 3 years", output: "Monthly payment: 16,607.15\nTotal interest: 97,857.58\nTotal paid: 597,857.58" },
    faq: {
      question: "Can I prepay a personal loan?",
      answer: "Most lenders allow it after a lock-in of 6 to 12 EMIs, sometimes with a foreclosure fee of a few percent. Use the one-time prepayment field to see whether the interest saved is more than the fee.",
    },
  },
];

export const loanPages: WidgetToolDefinition[] = pages.map((p) => ({
  ...loanCalculator,
  preset: { amount: p.amount, rate: p.rate, years: p.years, locale: "en-IN", currency: "₹" },
  slug: p.slug,
  name: p.name,
  metaTitle: p.metaTitle,
  description: p.description,
  overview: [p.intro, `${loanCalculator.overview[1]} ${p.tip}`],
  examples: [{ title: p.name, ...p.example }],
  faq: [p.faq, ...loanCalculator.faq],
  related: ["loan-calculator", "percentage-calculator", "age-calculator"],
}));
