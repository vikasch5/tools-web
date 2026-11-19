import type { WidgetToolDefinition } from "../types";
import { bmiHeightChart } from "../engine/bmi";

export const percentageCalculator: WidgetToolDefinition = {
  workspace: "percentage-calculator",
  slug: "percentage-calculator",
  category: "calculators",
  name: "Percentage Calculator",
  metaTitle: "Percentage Calculator – Percent of, Change and Increase",
  description:
    "Work out X% of a number, what percent one number is of another, the percentage change between two values, and price increases or discounts.",
  overview: [
    "Percentages come up constantly: discounts while shopping, tips and taxes, grade scores, salary rises, price changes, growth figures in reports and conversion rates in analytics. The formulas are simple, but it is easy to mix up which number to divide by.",
    "This page puts the four most common questions side by side: what is X% of a number, what percentage one number is of another, the percentage change between two values, and the result of increasing or decreasing a value by a percentage. Each answer comes with a plain-English sentence and the formula, so you can check the working.",
  ],
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

export const ageCalculator: WidgetToolDefinition = {
  workspace: "age-calculator",
  slug: "age-calculator",
  category: "calculators",
  name: "Age Calculator",
  metaTitle: "Age Calculator – Exact Age in Years, Months and Days",
  description:
    "Find your exact age in years, months and days on any date, with total months, weeks and days lived and a countdown to your next birthday.",
  overview: [
    "Application forms, insurance quotes, school admissions, sports categories and retirement plans often depend on an exact age on a particular date, not just the year you were born. Counting months and days by hand is easy to get wrong because months have different lengths and leap years add a day.",
    "This calculator works out your age in completed years, months and days on today’s date or any other date you choose. It also shows the total number of months, weeks and days you have lived and how long it is until your next birthday, including the day of the week it falls on. Dates are handled as calendar days, so the result does not shift with your time zone.",
  ],
  howTo: [
    "Enter your date of birth.",
    "Leave “Age on” as today, or pick another date, such as an exam or application deadline.",
    "Read your age in years, months and days, plus the totals and your next birthday.",
  ],
  examples: [
    { title: "Age on a given date", input: "Born 1990-05-15, on 2026-10-18", output: "36 years, 5 months, 3 days\n13,305 days in total\nNext birthday: Saturday 2027-05-15 (turning 37, in 209 days)" },
    { title: "A leap-day birthday", input: "Born 2000-02-29, on 2026-10-18", output: "26 years, 7 months, 19 days\n9,728 days in total\nNext birthday: Sunday 2027-02-28 (turning 27, in 133 days)" },
  ],
  limitations: [
    "People born on 29 February are treated as having their birthday on 28 February in common years, which is how many countries count legal age. Some use 1 March instead.",
    "Months are counted as calendar months from your birthday, so from 31 January to 28 February is one month.",
    "Total hours are approximate: they assume every day has 24 hours and ignore daylight saving changes.",
  ],
  faq: [
    {
      question: "How is age in years, months and days calculated?",
      answer:
        "First the completed years since your last birthday, then the completed calendar months since then, then the remaining days. This is the method most official forms use.",
    },
    {
      question: "Can I calculate the age on a past or future date?",
      answer: "Yes. Change “Age on” to any date after the date of birth, for example the cut-off date for a school year or a job application.",
    },
    {
      question: "Is my date of birth stored?",
      answer: "No. The calculation runs in your browser and nothing is saved or sent.",
    },
  ],
  related: ["percentage-calculator", "bmi-calculator", "timestamp-converter"],
};

const bmiChart = bmiHeightChart();
const chartRow = (ft: number, inches: number) => bmiChart.find((r) => r.ft === ft && r.in === inches)!;
const fiveSix = chartRow(5, 6);

export const bmiCalculator: WidgetToolDefinition = {
  workspace: "bmi-calculator",
  slug: "bmi-calculator",
  category: "calculators",
  name: "BMI Calculator",
  metaTitle: "BMI Calculator in kg and cm or Feet – WHO & Asian Ranges",
  description:
    "Calculate BMI in kg and cm, kg and feet, or pounds. See your WHO or Asian (India) weight category, the healthy weight for your height and a full chart.",
  overview: [
    "Body mass index (BMI) is your weight in kilograms divided by the square of your height in metres. Doctors use it as a quick screening measure because it is simple to work out and tracks body fat reasonably well across large groups of adults.",
    "Enter your weight in kilograms and your height in centimetres, or in feet and inches if that is how you know it: most people in India give their height in feet but weigh themselves in kilograms, so the calculator accepts that mix directly, with no conversion needed. Pounds work too.",
    "You can read the result against two sets of ranges. The WHO ranges are the international standard: healthy from 18.5 to 24.9, overweight from 25 and obesity from 30. The Asian ranges are the WHO Asia-Pacific cut-offs that India’s clinical guidelines also use: healthy from 18.5 to 22.9, overweight from 23 and obesity from 25. They are lower because people of South Asian and East Asian descent tend to develop diabetes and heart disease at a lower BMI.",
    "BMI does not measure body fat directly. It can overestimate it in muscular people and underestimate it in older adults, so treat it as a starting point for a conversation with a doctor, not a diagnosis.",
  ],
  howTo: [
    "Choose your units: kg and cm, kg and feet/inches, or pounds and feet/inches.",
    "Enter your weight and height. For 5 ft 6 in, type 5 in the feet box and 6 in the inches box.",
    "Pick WHO or Asian ranges. If you are of South Asian or East Asian descent, the Asian ranges are usually the better guide.",
    "Read your BMI, your category and the healthy weight range for your height. The chart below lists healthy weights for every height from 4 ft 10 in to 6 ft 4 in.",
  ],
  examples: [
    { title: "Kilograms and centimetres", input: "70 kg, 175 cm", output: "BMI 22.9 · Healthy weight\nHealthy weight for this height: 56.7–76.3 kg" },
    { title: "Kilograms and feet", input: "65 kg, 5 ft 6 in", output: "BMI 23.1 · Healthy weight\nHealthy weight for this height: 52–70 kg" },
    { title: "The same person on the Asian ranges", input: "65 kg, 5 ft 6 in, Asian ranges", output: "BMI 23.1 · Overweight (Asian cut-offs)\nHealthy weight for this height: 52–64.4 kg" },
    { title: "Pounds and feet", input: "200 lb, 5 ft 10 in", output: "BMI 28.7 · Overweight\nHealthy weight for this height: 128.9–173.5 lb" },
  ],
  reference: {
    title: "BMI chart: healthy weight in kg by height",
    intro:
      "The weight range that gives a healthy BMI at each height, in kilograms, worked out with the same formula as the calculator. Find your height in feet and inches or centimetres, then read across.",
    columns: ["Height (ft, in)", "Height (cm)", "Healthy weight, WHO (kg)", "Healthy weight, Asian (kg)"],
    rows: bmiChart.map((r) => [
      `${r.ft} ft ${r.in} in`,
      String(r.cm),
      `${r.who[0]} – ${r.who[1]}`,
      `${r.asian[0]} – ${r.asian[1]}`,
    ]),
    note: "WHO: BMI 18.5–24.9. Asian: BMI 18.5–22.9 (WHO Asia-Pacific cut-offs, used by India’s guidelines). For adults 18 and over.",
  },
  limitations: [
    "For adults aged 18 and over. Children and teenagers are assessed with age- and sex-specific BMI percentiles instead.",
    "BMI does not distinguish muscle from fat or show where fat is carried. A waist measurement adds useful information: for Indian adults, guidelines flag a waist above 90 cm for men and 80 cm for women.",
    "Height in feet uses 1 ft = 30.48 cm and 1 in = 2.54 cm. Decimal feet are read as decimals: 5.8 ft is 5 ft 9.6 in, not 5 ft 8 in.",
  ],
  faq: [
    {
      question: "How do I calculate BMI in kg and cm?",
      answer:
        "Convert your height to metres, square it, and divide your weight by the result. For 70 kg and 175 cm: 1.75 × 1.75 = 3.0625, and 70 ÷ 3.0625 = 22.9.",
    },
    {
      question: "How do I calculate BMI with weight in kg and height in feet?",
      answer:
        "Turn the height into inches (feet × 12 + inches), multiply by 2.54 to get centimetres, then use the kg and cm formula. For 65 kg and 5 ft 6 in: 66 in × 2.54 = 167.6 cm, 1.676 × 1.676 = 2.81, and 65 ÷ 2.81 = 23.1. Or choose “kg, ft/in” above and the calculator does it for you.",
    },
    {
      question: "What is the healthy weight for 5 ft 6 in?",
      answer: `For 5 ft 6 in (${fiveSix.cm} cm), a healthy weight is ${fiveSix.who[0]}–${fiveSix.who[1]} kg on the WHO ranges, or ${fiveSix.asian[0]}–${fiveSix.asian[1]} kg on the Asian ranges. The chart on this page covers every height from 4 ft 10 in to 6 ft 4 in.`,
    },
    {
      question: "Why are the Asian BMI ranges lower?",
      answer:
        "At the same BMI, people of South Asian and East Asian descent tend to carry more body fat and have a higher risk of type 2 diabetes and heart disease. The WHO Asia-Pacific guidance and India’s 2009 consensus guidelines therefore place overweight at 23 and obesity at 25, instead of 25 and 30.",
    },
    {
      question: "What is a healthy BMI?",
      answer: "For most adults, 18.5 to 24.9 on the WHO ranges, or 18.5 to 22.9 on the Asian ranges. Your doctor may use different targets based on your age, ethnicity or health.",
    },
    {
      question: "Is BMI accurate for athletes?",
      answer: "Often not. Muscle is denser than fat, so very muscular people can have a high BMI while carrying little body fat.",
    },
    {
      question: "Are my measurements saved?",
      answer: "No. The calculation runs in your browser and nothing is stored or sent.",
    },
  ],
  related: ["age-calculator", "percentage-calculator", "unit-converter"],
};

export const loanCalculator: WidgetToolDefinition = {
  workspace: "loan-calculator",
  slug: "loan-calculator",
  category: "calculators",
  name: "Loan & EMI Calculator",
  metaTitle: "Loan & EMI Calculator – Monthly Payment and Interest",
  description:
    "Work out the EMI on a home, car or personal loan, the total interest, and how much prepaying saves. Yearly or monthly schedule, with CSV download.",
  overview: [
    "Before taking out a mortgage, car loan or personal loan, it helps to know what it really costs: the fixed amount you will pay each month (often called the EMI, or equated monthly instalment) and how much of your money goes on interest over the whole term.",
    "This calculator uses the standard amortisation formula that banks use for fixed-rate loans: interest is charged each month on the remaining balance, and each payment covers that interest plus a growing share of the principal. The yearly schedule shows how the balance falls over time. Try different rates and terms to see the trade-off: a longer term lowers the monthly payment but usually adds a lot more interest in total.",
  ],
  howTo: [
    "Enter the amount you want to borrow, in any currency.",
    "Enter the yearly interest rate and the term in years or months.",
    "Read the monthly payment, total interest and total paid, and scroll the schedule to see the balance year by year.",
    "Planning to prepay? Add an extra monthly amount, a yearly lump sum or a one-time payment, and choose whether to finish sooner or lower the EMI. The interest saved appears at once.",
    "Switch the schedule to months for every EMI, or download it as a CSV file for Excel or Google Sheets.",
  ],
  examples: [
    { title: "A 30-year mortgage", input: "200,000 at 6% for 30 years", output: "Monthly payment: 1,199.10\nTotal interest: 231,676.38\nTotal paid: 431,676.38" },
    { title: "A 3-year car loan", input: "15,000 at 9.5% for 36 months", output: "Monthly payment: 480.49\nTotal interest: 2,297.79\nTotal paid: 17,297.79" },
    { title: "Home loan, prepaying once a year", input: "5,000,000 at 8.5% for 20 years, prepaying 100,000 every year, finish sooner", output: "EMI: 43,391.16\nPaid off in: 14 years\nInterest saved: 1,855,389.33" },
    { title: "One-time prepayment used to lower the EMI", input: "5,000,000 at 8.5% for 20 years, prepaying 500,000 in month 24, lower the EMI", output: "EMI: 43,391.16 → 38,863.87\nPaid off in: 20 years\nInterest saved: 477,894.05" },
  ],
  limitations: [
    "Assumes a fixed rate, monthly payments and interest charged monthly at the yearly rate ÷ 12. Variable rates, interest-only periods and balloon payments are not modelled.",
    "Fees, insurance, taxes and early repayment charges are not included, so the real cost of a loan may be higher. Lenders’ quoted APR includes some of these.",
    "Results are rounded to two decimal places; the final payment absorbs any rounding difference.",
  ],
  faq: [
    {
      question: "What is an EMI?",
      answer:
        "An equated monthly instalment: the same payment every month for the whole term. Early payments are mostly interest; later ones are mostly principal.",
    },
    {
      question: "How is the monthly payment calculated?",
      answer:
        "Payment = P × r ÷ (1 − (1 + r)^−n), where P is the amount borrowed, r the monthly rate (yearly rate ÷ 12 ÷ 100) and n the number of months.",
    },
    {
      question: "Should I use a prepayment to cut the tenure or the EMI?",
      answer:
        "Cutting the tenure saves more interest, because the balance falls faster while you keep paying the same EMI. Lowering the EMI frees up money each month but saves less. Try both in the calculator to see the difference for your loan.",
    },
    {
      question: "Does a shorter term save money?",
      answer:
        "Usually, yes. The monthly payment is higher, but you pay interest for fewer months, so the total interest is lower.",
    },
    {
      question: "Is anything I enter saved?",
      answer: "No. Calculations run on your device and nothing is stored or sent.",
    },
  ],
  related: ["percentage-calculator", "age-calculator", "bmi-calculator"],
};
