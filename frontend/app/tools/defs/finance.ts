import type { WidgetToolDefinition } from "../types";

const privateFaq = {
  question: "Is anything I enter saved?",
  answer: "No. The calculation runs on your device and nothing is stored or sent anywhere.",
};

export const gstCalculator: WidgetToolDefinition = {
  workspace: "gst-calculator",
  slug: "gst-calculator",
  category: "calculators",
  name: "GST Calculator",
  metaTitle: "GST Calculator – Add or Remove GST, CGST and SGST Split",
  description:
    "Add GST to a price or take it out of an inclusive one, at 5%, 18%, 40% or any rate, with the CGST, SGST or IGST split. Updated for the 2025 GST slabs.",
  overview: [
    "Shop owners, freelancers and buyers all need GST figures: what to charge on an invoice, how much tax is inside an MRP, or how a bill splits between the Centre and the State. Since 22 September 2025, most goods and services fall under two slabs, 5% and 18%, with 40% for luxury and sin goods; gold stays at 3% and cut diamonds at 0.25%.",
    "Enter an amount and choose whether it is before or after GST. The calculator works out the tax and the total, or pulls the base price out of an inclusive amount. For a sale within one state the tax is shown as equal CGST and SGST; for a sale to another state it is all IGST. Figures are rounded to the paisa, as on an invoice.",
  ],
  howTo: [
    "Choose whether your amount is before GST (to add tax) or already includes GST (to take it out).",
    "Enter the amount and pick the rate: 5%, 18%, 40%, 3% for gold, 0.25% for diamonds, or another rate.",
    "Choose Within state for CGST + SGST, or Other state for IGST.",
    "Read the price before GST, the GST amount and the total.",
  ],
  examples: [
    { title: "Add 18% GST", input: "10,000 + 18% GST", output: "Before GST: ₹10,000.00\nGST: ₹1,800.00 (CGST ₹900.00 + SGST ₹900.00)\nTotal: ₹11,800.00" },
    { title: "Take 18% GST out of a price", input: "1,180 including 18% GST", output: "Before GST: ₹1,000.00\nGST: ₹180.00 (CGST ₹90.00 + SGST ₹90.00)\nTotal: ₹1,180.00" },
  ],
  limitations: [
    "The calculator does not know which rate applies to a product; check the HSN or SAC code in the GST rate notifications.",
    "Cess, reverse charge and composition-scheme rates are not covered.",
  ],
  faq: [
    {
      question: "What are the GST rates now?",
      answer:
        "Since 22 September 2025 the main slabs are 5% and 18%, with a 40% rate for luxury and sin goods such as tobacco and large cars. Many essentials are exempt (0%). Gold is taxed at 3% and cut and polished diamonds at 0.25%.",
    },
    {
      question: "How do I remove GST from a price?",
      answer: "Divide the price by 1 + rate ÷ 100. For 18% GST on ₹1,180: 1,180 ÷ 1.18 = ₹1,000 before tax, so the GST is ₹180.",
    },
    {
      question: "When is it CGST + SGST and when IGST?",
      answer:
        "A sale within one state is taxed as CGST and SGST, each half of the rate. A sale from one state to another (or an import) is taxed as IGST at the full rate.",
    },
    privateFaq,
  ],
  related: ["percentage-calculator", "loan-calculator", "sip-calculator"],
};

export const sipCalculator: WidgetToolDefinition = {
  workspace: "sip-calculator",
  slug: "sip-calculator",
  category: "calculators",
  name: "SIP Calculator",
  metaTitle: "SIP Calculator – Monthly SIP, Step-up SIP and Lump Sum",
  description:
    "Estimate what a monthly SIP or a one-time investment in mutual funds could grow to, with an optional yearly step-up and a year-by-year table.",
  overview: [
    "A systematic investment plan (SIP) puts a fixed amount into a mutual fund every month. Over many years, compounding means the returns can end up larger than the money you put in, which is why even small SIPs are a popular way to save for a home, a child's education or retirement.",
    "Enter the monthly amount, the yearly return you expect and the number of years. The calculator assumes each instalment goes in at the start of the month and grows at the yearly rate ÷ 12 per month, as most fund houses' calculators do. Add a yearly step-up to raise the SIP as your income grows, or switch to Lump sum for a one-time investment compounded yearly. Real returns go up and down, so treat the result as an estimate, not a promise.",
  ],
  howTo: [
    "Choose Monthly (SIP) or One time (lump sum).",
    "Enter the amount, the expected yearly return (for example 12% for an equity fund over the long term) and the period in years.",
    "Optionally add a yearly step-up, such as 10%, if you plan to raise the SIP every year.",
    "Read the amount invested, the estimated returns and the total value, and scroll the year-by-year table.",
  ],
  examples: [
    { title: "₹10,000 a month for 10 years", input: "10,000 a month at 12% for 10 years", output: "Invested: ₹12,00,000\nEstimated returns: ₹11,23,391\nTotal value: ₹23,23,391" },
    { title: "Step-up SIP", input: "5,000 a month at 12% for 20 years, stepping up 10% a year", output: "Invested: ₹34,36,500\nEstimated returns: ₹65,07,858\nTotal value: ₹99,44,358" },
  ],
  limitations: [
    "Mutual fund returns are not fixed. Past returns do not predict future ones, and the value can fall.",
    "Expense ratios, exit loads and tax on gains are not deducted.",
  ],
  faq: [
    {
      question: "What return should I assume?",
      answer:
        "That depends on the fund. Many people use 10–12% a year for diversified equity funds over 10 years or more, and 6–8% for debt funds. Try a few rates to see a cautious and an optimistic case.",
    },
    {
      question: "What is a step-up SIP?",
      answer:
        "A SIP that grows by a set percentage every year, for example ₹5,000 a month this year and ₹5,500 next year with a 10% step-up. It matches rising income and builds a much larger corpus.",
    },
    {
      question: "How is the SIP value calculated?",
      answer:
        "Future value = P × [((1 + r)^n − 1) ÷ r] × (1 + r), where P is the monthly amount, r the monthly return (yearly rate ÷ 12 ÷ 100) and n the number of months.",
    },
    privateFaq,
  ],
  related: ["ppf-calculator", "fd-calculator", "compound-interest-calculator"],
};

export const fdCalculator: WidgetToolDefinition = {
  workspace: "fd-calculator",
  slug: "fd-calculator",
  category: "calculators",
  name: "FD Calculator",
  metaTitle: "FD Calculator – Fixed Deposit Maturity and Interest",
  description:
    "Find the maturity amount and interest on a bank or post office fixed deposit, compounded quarterly like most banks, for any amount, rate and term.",
  overview: [
    "A fixed deposit locks your money for a set term at a fixed interest rate, which makes it one of the most common ways to save safely in India. Banks usually add the interest every quarter, so a cumulative FD earns interest on its interest and pays out more than the headline rate suggests.",
    "Enter the deposit, the rate offered and the term. The calculator compounds the interest quarterly by default (you can choose monthly, half-yearly or yearly), shows the maturity amount, the interest earned, the effective yearly rate and a year-by-year table. It also shows what you would receive every quarter if you chose a quarterly payout instead of reinvesting.",
  ],
  howTo: [
    "Enter the deposit amount and the interest rate your bank offers.",
    "Enter the term in years or months.",
    "Keep Quarterly for most bank FDs, or pick the compounding your bank states.",
    "Read the maturity amount and interest earned, and the quarterly payout alternative.",
  ],
  examples: [
    { title: "₹1 lakh for 5 years", input: "1,00,000 at 7% for 5 years", output: "Interest earned: ₹41,477.82\nMaturity amount: ₹1,41,477.82\nEffective yearly rate: 7.19%" },
    { title: "₹5 lakh for 3 years", input: "5,00,000 at 7.25% for 3 years", output: "Interest earned: ₹1,20,273.50\nMaturity amount: ₹6,20,273.50\nEffective yearly rate: 7.45%" },
  ],
  limitations: [
    "TDS and income tax on FD interest are not deducted.",
    "Banks may calculate the last part-quarter slightly differently; the difference is usually a few rupees.",
    "Senior citizen and special-tenure rates vary by bank; enter the rate you are offered.",
  ],
  faq: [
    {
      question: "How is FD interest calculated?",
      answer:
        "For quarterly compounding: maturity = P × (1 + r ÷ 4)^(4 × t), where r is the yearly rate ÷ 100 and t the term in years. Each quarter's interest is added to the deposit and earns interest after that.",
    },
    {
      question: "Is FD interest taxable?",
      answer:
        "Yes. It is added to your income and taxed at your slab rate, and banks deduct TDS once the interest crosses the yearly limit. Tax-saver FDs (5 years) qualify for a deduction under the old regime.",
    },
    {
      question: "Cumulative or payout FD?",
      answer:
        "A cumulative FD reinvests the interest and pays everything at maturity, which earns more. A payout FD sends the interest to you every month or quarter, which suits regular income needs.",
    },
    privateFaq,
  ],
  related: ["compound-interest-calculator", "ppf-calculator", "sip-calculator"],
};

export const compoundInterestCalculator: WidgetToolDefinition = {
  ...fdCalculator,
  preset: { kind: "compound" },
  slug: "compound-interest-calculator",
  name: "Compound Interest Calculator",
  metaTitle: "Compound Interest Calculator – With Monthly Deposits",
  description:
    "See how money grows with compound interest, compounded monthly, quarterly or yearly, with optional monthly additions and a year-by-year table.",
  overview: [
    "Compound interest is interest earned on earlier interest: each period the interest is added to the balance, so the next period's interest is a little larger. Over long periods this snowball effect is what turns regular saving into a large sum.",
    "Enter a starting amount, an optional amount added every month, the yearly rate, the term and how often interest is added. The calculator shows the final value, how much of it is your money and how much is interest, and the balance at the end of every year. Compare monthly and yearly compounding, or a higher rate against a longer term, to see what matters most.",
  ],
  howTo: [
    "Enter the starting amount and, if you save every month, the monthly addition.",
    "Enter the yearly interest rate and the term in years or months.",
    "Choose how often interest is added: monthly, quarterly, half-yearly or yearly.",
    "Read the final value and the interest earned, and scroll the yearly table.",
  ],
  examples: [
    { title: "₹1 lakh for 10 years at 8%", input: "1,00,000 at 8% for 10 years, compounded yearly", output: "Invested: ₹1,00,000.00\nInterest earned: ₹1,15,892.50\nFinal value: ₹2,15,892.50" },
    { title: "₹5,000 a month for 10 years", input: "5,000 a month at 8% for 10 years, compounded monthly", output: "Invested: ₹6,00,000.00\nInterest earned: ₹3,20,828.38\nFinal value: ₹9,20,828.38" },
  ],
  limitations: [
    "Assumes a fixed rate for the whole term. Monthly additions are made at the start of each month.",
    "Tax and inflation are not taken into account.",
  ],
  faq: [
    {
      question: "What is the compound interest formula?",
      answer:
        "A = P × (1 + r ÷ n)^(n × t), where P is the starting amount, r the yearly rate ÷ 100, n the number of times interest is added each year and t the number of years.",
    },
    {
      question: "Does more frequent compounding make a big difference?",
      answer:
        "A little. At 8% a year, monthly compounding gives an effective 8.30% against 8% for yearly. The rate and the number of years matter far more.",
    },
    {
      question: "What is the rule of 72?",
      answer: "A quick estimate: divide 72 by the yearly rate to get the years needed to double your money. At 8%, about 9 years.",
    },
    privateFaq,
  ],
  related: ["fd-calculator", "sip-calculator", "ppf-calculator"],
};

export const ppfCalculator: WidgetToolDefinition = {
  workspace: "ppf-calculator",
  slug: "ppf-calculator",
  category: "calculators",
  name: "PPF Calculator",
  metaTitle: "PPF Calculator – Maturity Value at 7.1% (Oct–Dec 2026)",
  description:
    "Work out the maturity value of a Public Provident Fund account for any yearly deposit from ₹500 to ₹1.5 lakh, over 15 years or with 5-year extensions.",
  overview: [
    "The Public Provident Fund is a government-backed savings scheme with a 15-year term. Deposits of up to ₹1.5 lakh a year qualify for a deduction under Section 80C in the old tax regime, and both the interest and the maturity amount are tax-free, which makes PPF one of the safest long-term savings options for Indian families.",
    "Enter how much you plan to deposit each year. The calculator uses the current rate of 7.1% (October–December 2026), credits interest once a year as the scheme does, and assumes each deposit is made before 5 April so it earns interest for the full year. Choose to keep the account for 15 years or extend it in blocks of 5 years to see how much more the extra years add.",
  ],
  howTo: [
    "Enter your yearly deposit, between ₹500 and ₹1,50,000.",
    "Keep the current rate of 7.1%, or try another rate, since the government reviews it every quarter.",
    "Choose 15 years or an extension of 20, 25 or 30 years.",
    "Read the maturity value, the total deposited and the interest earned, and scroll the yearly table.",
  ],
  examples: [
    { title: "Maximum deposit for 15 years", input: "1,50,000 a year for 15 years at 7.1%", output: "Invested: ₹22,50,000\nInterest earned: ₹18,18,209\nMaturity value: ₹40,68,209" },
    { title: "₹5,000 a month, extended once", input: "60,000 a year for 20 years at 7.1%", output: "Invested: ₹12,00,000\nInterest earned: ₹14,63,315\nMaturity value: ₹26,63,315" },
  ],
  limitations: [
    "The rate can change every quarter; the calculator applies one rate to the whole term.",
    "Deposits after 5 April earn less interest in their first year than shown here.",
    "Loans and partial withdrawals allowed from the account are not modelled.",
  ],
  faq: [
    {
      question: "What is the PPF interest rate now?",
      answer: "7.1% a year for October–December 2026, unchanged for several quarters. The government sets it every quarter.",
    },
    {
      question: "Is PPF tax-free?",
      answer:
        "PPF has EEE status: deposits up to ₹1.5 lakh qualify for Section 80C under the old regime, and the interest and maturity amount are tax-free under both regimes.",
    },
    {
      question: "Can I extend my PPF account after 15 years?",
      answer: "Yes, in blocks of 5 years, with or without new deposits, any number of times. Apply within a year of maturity.",
    },
    privateFaq,
  ],
  related: ["sip-calculator", "fd-calculator", "compound-interest-calculator"],
};

export const gratuityCalculator: WidgetToolDefinition = {
  workspace: "gratuity-calculator",
  slug: "gratuity-calculator",
  category: "calculators",
  name: "Gratuity Calculator",
  metaTitle: "Gratuity Calculator – 15/26 Formula, New Labour Code Rules",
  description:
    "Calculate the gratuity due when you leave a job: the 15/26 formula, 6-month rounding, 1-year rule for fixed-term staff and the ₹20 lakh tax limit.",
  overview: [
    "Gratuity is a lump sum an employer pays when you leave after long service, as thanks for the years you worked. Under the Payment of Gratuity Act, now part of the Code on Social Security that took effect in November 2025, employers with 10 or more staff must pay it after 5 years of continuous service, and fixed-term employees qualify after just 1 year.",
    "Enter your last monthly basic pay plus dearness allowance and your years and months of service. For covered employers the calculator pays 15 days' wages for each year, counting a month as 26 working days, and rounds a final part-year of 6 months or more up to a full year. For employers not covered by the Act it uses the common half-month (15/30) rule for completed years. It also shows how much is tax-free under the ₹20 lakh limit.",
  ],
  howTo: [
    "Enter your last drawn monthly basic pay plus DA.",
    "Enter your total service in years and months.",
    "Choose whether your employer is covered by the Act (10 or more employees) and whether you are a fixed-term employee.",
    "Read the gratuity payable and the tax-free and taxable parts.",
  ],
  examples: [
    { title: "9 years 7 months, covered by the Act", input: "50,000 basic + DA, 9 years 7 months, covered", output: "Gratuity: ₹2,88,461.54 for 10 years\nTax-free: ₹2,88,461.54" },
    { title: "Employer not covered by the Act", input: "30,000 basic + DA, 6 years 8 months, not covered", output: "Gratuity: ₹90,000.00 for 6 years\nTax-free: ₹90,000.00" },
  ],
  limitations: [
    "Your employer's policy may pay more than the legal minimum shown here.",
    "Gratuity on death or disablement is due regardless of service length; this calculator follows the normal service rules.",
    "Under the new labour codes, wages for gratuity must be at least 50% of total pay; adjust the input if your basic + DA is lower.",
  ],
  faq: [
    {
      question: "What is the gratuity formula?",
      answer:
        "Gratuity = last monthly basic + DA × 15 ÷ 26 × years of service. For example, ₹50,000 × 15 ÷ 26 × 10 years = ₹2,88,462.",
    },
    {
      question: "Do I need 5 years for gratuity?",
      answer:
        "For permanent employees, yes (some courts have accepted 4 years and 240 days of work). Fixed-term employees qualify after 1 year under the Code on Social Security. On death or disablement gratuity is paid whatever the service.",
    },
    {
      question: "Is gratuity taxable?",
      answer:
        "Gratuity for government employees is fully exempt. For others, up to ₹20 lakh in a lifetime is tax-free; anything above that is taxed as salary.",
    },
    privateFaq,
  ],
  related: ["hra-calculator", "ppf-calculator", "loan-calculator"],
};

export const hraCalculator: WidgetToolDefinition = {
  workspace: "hra-calculator",
  slug: "hra-calculator",
  category: "calculators",
  name: "HRA Exemption Calculator",
  metaTitle: "HRA Calculator 2026 – Exemption for 8 Metro Cities",
  description:
    "Work out how much of your house rent allowance is tax-free under the old regime, with the 50% rate for Delhi, Mumbai, Bengaluru, Pune and 4 more cities.",
  overview: [
    "House rent allowance (HRA) is part of many salaries, and under the old tax regime part of it is tax-free if you pay rent. From 1 April 2026, the higher 50% limit applies in eight cities: Delhi, Mumbai, Kolkata and Chennai, plus Bengaluru, Hyderabad, Pune and Ahmedabad, which were added by the new income tax rules. Everywhere else the limit is 40%.",
    "Enter your basic pay plus DA, the HRA you receive and the rent you pay, monthly or yearly. The tax-free part is the smallest of three amounts: the HRA received, rent minus 10% of salary, and 50% or 40% of salary. The calculator shows all three so you can see which one limits your exemption. HRA cannot be claimed under the new tax regime, which is now the default.",
  ],
  howTo: [
    "Choose whether you are entering monthly or yearly amounts.",
    "Enter your basic pay plus DA, the HRA in your salary and the rent you pay.",
    "Choose whether you live in one of the 8 cities with the 50% limit.",
    "Read the tax-free and taxable HRA, and which of the three limits applies.",
  ],
  examples: [
    { title: "Big city, rent above HRA", input: "Basic + DA 6,00,000, HRA 2,40,000, rent 3,00,000 a year, big city", output: "Exempt HRA: ₹2,40,000 a year\nTaxable HRA: ₹0 a year" },
    { title: "Smaller city, lower rent", input: "Basic + DA 6,00,000, HRA 2,40,000, rent 1,80,000 a year, other city", output: "Exempt HRA: ₹1,20,000 a year\nTaxable HRA: ₹1,20,000 a year" },
  ],
  limitations: [
    "Applies to the old tax regime only.",
    "If you change cities or rent during the year, work out each part of the year separately.",
    "Rent receipts, and the landlord's PAN for rent over ₹1 lakh a year, are needed to claim it.",
  ],
  faq: [
    {
      question: "Which cities get 50% HRA exemption?",
      answer:
        "From 1 April 2026: Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune and Ahmedabad. All other places use 40% of salary.",
    },
    {
      question: "Can I claim HRA in the new tax regime?",
      answer: "No. The HRA exemption is only available under the old regime. Compare both regimes before choosing.",
    },
    {
      question: "What counts as salary for HRA?",
      answer: "Basic pay plus dearness allowance (if it counts for retirement benefits) plus any commission fixed as a percentage of turnover.",
    },
    privateFaq,
  ],
  related: ["gratuity-calculator", "loan-calculator", "percentage-calculator"],
};

export const financeCalculators = [
  gstCalculator,
  sipCalculator,
  fdCalculator,
  compoundInterestCalculator,
  ppfCalculator,
  gratuityCalculator,
  hraCalculator,
];
