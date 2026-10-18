import type { WidgetToolDefinition } from "../types";

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

export const bmiCalculator: WidgetToolDefinition = {
  workspace: "bmi-calculator",
  slug: "bmi-calculator",
  category: "calculators",
  name: "BMI Calculator",
  metaTitle: "BMI Calculator – Body Mass Index in kg/cm or lb/ft",
  description:
    "Calculate your body mass index from your weight and height in metric or US units, see your WHO weight category and the healthy weight range for your height.",
  overview: [
    "Body mass index (BMI) is your weight in kilograms divided by the square of your height in metres. Doctors and health services use it as a quick screening measure, because it is simple to calculate and correlates with body fat across large groups of people.",
    "This calculator accepts metric or US units and places the result in the World Health Organization’s adult categories: underweight below 18.5, healthy weight from 18.5 to 24.9, overweight from 25 to 29.9 and obesity from 30. It also shows the weight range that corresponds to a healthy BMI at your height. BMI does not measure body fat directly, so it can overestimate it in muscular people and underestimate it in older adults; it is a starting point for a conversation with a health professional, not a diagnosis.",
  ],
  howTo: [
    "Choose metric (kg and cm) or US units (lb, feet and inches).",
    "Enter your weight and height. The BMI and category update as you type.",
    "Compare your result with the category table and the healthy weight range for your height.",
  ],
  examples: [
    { title: "Metric", input: "70 kg, 175 cm", output: "BMI 22.9 · Healthy weight\nHealthy weight for this height: 56.7–76.3 kg" },
    { title: "US units", input: "200 lb, 5 ft 10 in", output: "BMI 28.7 · Overweight\nHealthy weight for this height: 128.9–173.5 lb" },
  ],
  limitations: [
    "For adults aged 18 and over. Children and teenagers are assessed with age- and sex-specific BMI percentiles instead.",
    "BMI does not distinguish muscle from fat or show where fat is carried. Waist measurement and other checks give a fuller picture.",
    "Some health services use lower thresholds for people of Asian, Black African or other backgrounds. Ask your doctor which ones apply to you.",
  ],
  faq: [
    {
      question: "How is BMI calculated?",
      answer:
        "Weight in kilograms divided by height in metres squared. For 70 kg and 1.75 m: 70 ÷ (1.75 × 1.75) = 22.9. US units are converted to metric first.",
    },
    {
      question: "What is a healthy BMI?",
      answer: "For most adults, the WHO considers 18.5 to 24.9 a healthy range. Your doctor may use different targets based on your age, ethnicity or health.",
    },
    {
      question: "Is BMI accurate for athletes?",
      answer:
        "Often not. Muscle is denser than fat, so very muscular people can have a high BMI while carrying little body fat.",
    },
    {
      question: "Are my measurements saved?",
      answer: "No. The calculation runs in your browser and nothing is stored or sent.",
    },
  ],
  related: ["age-calculator", "percentage-calculator", "loan-calculator"],
};

export const loanCalculator: WidgetToolDefinition = {
  workspace: "loan-calculator",
  slug: "loan-calculator",
  category: "calculators",
  name: "Loan & EMI Calculator",
  metaTitle: "Loan & EMI Calculator – Monthly Payment and Interest",
  description:
    "Work out the monthly payment (EMI) on a mortgage, car or personal loan, the total interest you will pay, and a year-by-year repayment schedule.",
  overview: [
    "Before taking out a mortgage, car loan or personal loan, it helps to know what it really costs: the fixed amount you will pay each month (often called the EMI, or equated monthly instalment) and how much of your money goes on interest over the whole term.",
    "This calculator uses the standard amortisation formula that banks use for fixed-rate loans: interest is charged each month on the remaining balance, and each payment covers that interest plus a growing share of the principal. The yearly schedule shows how the balance falls over time. Try different rates and terms to see the trade-off: a longer term lowers the monthly payment but usually adds a lot more interest in total.",
  ],
  howTo: [
    "Enter the amount you want to borrow, in any currency.",
    "Enter the yearly interest rate and the term in years or months.",
    "Read the monthly payment, total interest and total paid, and scroll the schedule to see the balance year by year.",
  ],
  examples: [
    { title: "A 30-year mortgage", input: "200,000 at 6% for 30 years", output: "Monthly payment: 1,199.10\nTotal interest: 231,676.38\nTotal paid: 431,676.38" },
    { title: "A 3-year car loan", input: "15,000 at 9.5% for 36 months", output: "Monthly payment: 480.49\nTotal interest: 2,297.79\nTotal paid: 17,297.79" },
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
