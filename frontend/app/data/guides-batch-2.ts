import type { Guide, GuideBlock } from "./guides";

/**
 * Guides added 19 Nov 2026 from Search Console demand (BMI in kg and feet,
 * manual EMI, resizing to pixels, percentages, age on a cut-off date).
 * Figures are checked against the engines in guides-batch-2.test.ts.
 */
const p = (text: string): GuideBlock => ({ type: "p", text });
const list = (items: string[], ordered = false): GuideBlock => ({ type: "list", items, ordered });
const note = (text: string): GuideBlock => ({ type: "note", text });

export const guidesBatch2: Guide[] = [
  {
    slug: "ideal-weight-for-height-chart",
    title: "Ideal Weight for Height: Chart in kg for Feet and cm (WHO and Asian BMI)",
    metaTitle: "Ideal Weight for Height Chart in kg (Feet and cm)",
    description:
      "Healthy weight in kg for every height from 4 ft 10 in to 6 ft 4 in, on the WHO and the Asian BMI ranges used in India, and how to work it out yourself.",
    topic: "Health and everyday",
    updated: "2026-11-19",
    intro: [
      "There is no single ideal weight for a height. Doctors use a healthy range instead, based on body mass index (BMI): the range of weights that keeps your BMI between 18.5 and 24.9 on the international WHO scale, or between 18.5 and 22.9 on the Asian scale that Indian clinical guidelines use.",
      "This guide gives that range in kilograms for every height in feet and inches, explains why the Asian range is lower, and shows how to work it out for any height with a phone calculator.",
    ],
    sections: [
      {
        id: "chart",
        heading: "Healthy weight chart by height",
        blocks: [
          {
            type: "table",
            caption: "Healthy weight in kg at each height (BMI 18.5–24.9 WHO, 18.5–22.9 Asian), from our BMI Calculator",
            head: ["Height", "cm", "WHO range (kg)", "Asian range (kg)"],
            rows: [
              ["4 ft 10 in", "147.3", "40.2 – 54", "40.2 – 49.7"],
              ["4 ft 11 in", "149.9", "41.5 – 55.9", "41.5 – 51.4"],
              ["5 ft 0 in", "152.4", "43 – 57.8", "43 – 53.2"],
              ["5 ft 1 in", "154.9", "44.4 – 59.8", "44.4 – 55"],
              ["5 ft 2 in", "157.5", "45.9 – 61.8", "45.9 – 56.8"],
              ["5 ft 3 in", "160", "47.4 – 63.8", "47.4 – 58.6"],
              ["5 ft 4 in", "162.6", "48.9 – 65.8", "48.9 – 60.5"],
              ["5 ft 5 in", "165.1", "50.4 – 67.9", "50.4 – 62.4"],
              ["5 ft 6 in", "167.6", "52 – 70", "52 – 64.4"],
              ["5 ft 7 in", "170.2", "53.6 – 72.1", "53.6 – 66.3"],
              ["5 ft 8 in", "172.7", "55.2 – 74.3", "55.2 – 68.3"],
              ["5 ft 9 in", "175.3", "56.8 – 76.5", "56.8 – 70.3"],
              ["5 ft 10 in", "177.8", "58.5 – 78.7", "58.5 – 72.4"],
              ["5 ft 11 in", "180.3", "60.2 – 81", "60.2 – 74.5"],
              ["6 ft 0 in", "182.9", "61.9 – 83.3", "61.9 – 76.6"],
              ["6 ft 1 in", "185.4", "63.6 – 85.6", "63.6 – 78.7"],
              ["6 ft 2 in", "188", "65.4 – 88", "65.4 – 80.9"],
              ["6 ft 3 in", "190.5", "67.1 – 90.4", "67.1 – 83.1"],
              ["6 ft 4 in", "193", "68.9 – 92.8", "68.9 – 85.3"],
            ],
          },
          p("The same ranges apply to men and women. BMI does not change with sex for adults, although women on average carry more body fat at the same BMI. For children and teenagers, doctors use age- and sex-specific BMI charts instead."),
        ],
      },
      {
        id: "asian-range",
        heading: "Why the Asian range is lower",
        blocks: [
          p("Large studies across Asia found that people of South Asian and East Asian descent develop type 2 diabetes, high blood pressure and heart disease at a lower BMI than people of European descent, because they tend to carry more body fat, especially around the waist, at the same weight. The WHO Asia-Pacific guidance therefore puts overweight at a BMI of 23 and obesity at 25, and India's 2009 consensus guidelines adopted the same cut-offs."),
          p("The difference matters. Take a person 5 ft 7 in tall who weighs 72 kg. Their BMI is 24.9: “healthy weight” on the WHO scale, at the very top of the range, but “overweight” on the Asian scale, where the healthy range for that height ends at 66.3 kg."),
          note("A waist measurement adds what BMI misses. For Indian adults, guidelines flag a waist above 90 cm for men and 80 cm for women as a risk sign, whatever the BMI."),
        ],
      },
      {
        id: "work-it-out",
        heading: "How to work out your own range",
        blocks: [
          list(
            [
              "Convert your height to metres. From feet and inches: (feet × 12 + inches) × 2.54 ÷ 100. For 5 ft 6 in: 66 × 2.54 = 167.6 cm = 1.676 m.",
              "Square it: 1.676 × 1.676 = 2.81.",
              "Multiply by 18.5 for the bottom of the range: 2.81 × 18.5 = 52 kg.",
              "Multiply by 24.9 (WHO) or 22.9 (Asian) for the top: 70 kg or 64.4 kg.",
            ],
            true,
          ),
          p("To check where you are now, divide your weight by the squared height: 65 kg ÷ 2.81 = 23.1. The BMI Calculator does all of this in one step, in kg and cm, kg and feet, or pounds, and shows both scales."),
        ],
      },
      {
        id: "limits",
        heading: "What BMI cannot tell you",
        blocks: [
          list([
            "It cannot tell muscle from fat, so athletes and people who lift weights can show as overweight while being lean.",
            "It underestimates body fat in older adults, who lose muscle with age.",
            "It says nothing about where fat sits; fat around the waist carries more risk than fat on the hips.",
            "It is not a diagnosis. A doctor looks at BMI together with waist size, blood pressure, blood sugar, family history and lifestyle.",
          ]),
        ],
      },
    ],
    tools: ["bmi-calculator", "feet-to-cm"],
  },
  {
    slug: "how-to-calculate-emi-manually-excel",
    title: "How to Calculate EMI Manually and in Excel, with Worked Examples",
    metaTitle: "How to Calculate EMI Manually and in Excel (Examples)",
    description:
      "The EMI formula explained step by step with car, personal and home loan examples, how each EMI splits into interest and principal, and Excel's PMT formula.",
    topic: "Money and tax",
    updated: "2026-11-19",
    intro: [
      "An EMI (equated monthly instalment) is the fixed amount you pay every month until a loan is repaid. Banks work it out with one formula, and you can too, with a phone calculator or a spreadsheet. Checking it yourself is the best way to compare offers and to catch a quote that does not add up.",
      "This guide walks through the formula with three typical Indian loans, shows how each EMI is split between interest and principal, and gives the Excel and Google Sheets formulas that do it in one cell.",
    ],
    sections: [
      {
        id: "formula",
        heading: "The EMI formula",
        blocks: [
          p("EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)"),
          list([
            "P is the loan amount (the principal).",
            "r is the monthly interest rate: the yearly rate ÷ 12 ÷ 100. For 9% a year, r = 0.0075.",
            "n is the number of monthly instalments: years × 12.",
          ]),
          p("The only awkward part is (1 + r)^n, a number raised to the power of the number of months. On a phone calculator, turn it sideways for the scientific keys and use the x^y button."),
        ],
      },
      {
        id: "examples",
        heading: "Worked examples",
        blocks: [
          {
            type: "table",
            caption: "Each step for three loans, matching our Loan & EMI Calculator",
            head: ["Step", "Car loan", "Personal loan", "Home loan"],
            rows: [
              ["Loan amount P", "₹8,00,000", "₹5,00,000", "₹30,00,000"],
              ["Yearly rate", "9%", "12%", "8.5%"],
              ["Tenure", "5 years", "3 years", "20 years"],
              ["Monthly rate r", "0.0075", "0.01", "0.007083"],
              ["Instalments n", "60", "36", "240"],
              ["(1 + r)^n", "1.565681", "1.430769", "5.441243"],
              ["EMI", "₹16,606.68", "₹16,607.15", "₹26,034.70"],
            ],
          },
          p("For the car loan: 8,00,000 × 0.0075 = 6,000. Multiply by 1.565681 to get 9,394.09, then divide by 0.565681 (that is, 1.565681 − 1): the EMI is ₹16,606.68. Keep at least six decimal places in (1 + r)^n, or the result can be off by a few rupees."),
          p("Over the full term, the car loan costs ₹1,96,401.05 in interest on top of the ₹8 lakh borrowed, and the home loan ₹32,48,327.28 in interest on ₹30 lakh: more than the loan itself, because the term is long."),
        ],
      },
      {
        id: "split",
        heading: "How each EMI splits into interest and principal",
        blocks: [
          p("Every month the bank first charges interest on the balance still owed: balance × r. The rest of the EMI repays principal. In month 1 of the car loan, interest is 8,00,000 × 0.0075 = ₹6,000, so ₹10,606.68 goes to principal and the balance falls to ₹7,89,393.32. In month 2, interest is charged on that lower balance, so a little more goes to principal, and so on."),
          p("That is why early EMIs are mostly interest. In the first year of the car loan, ₹66,616.19 of the ₹1,99,280.16 paid is interest; by the last year almost all of each EMI is principal. It is also why prepaying early saves the most: every rupee prepaid stops attracting interest for all the remaining months."),
        ],
      },
      {
        id: "excel",
        heading: "EMI in Excel or Google Sheets",
        blocks: [
          list([
            "EMI: =PMT(9%/12, 60, -800000) gives 16,606.68. The minus sign makes the answer positive.",
            "Interest in month k: =IPMT(9%/12, k, 60, -800000). For k = 1 it gives 6,000.",
            "Principal in month k: =PPMT(9%/12, k, 60, -800000).",
            "Total interest: =PMT(9%/12, 60, -800000) * 60 - 800000.",
          ]),
          note("Bank figures can differ by a few rupees from the formula, because some lenders count interest daily or round each EMI up to the next rupee. The formula is still the right way to compare two offers."),
        ],
      },
    ],
    tools: ["car-loan-emi-calculator", "personal-loan-emi-calculator", "home-loan-emi-calculator", "loan-calculator"],
  },
  {
    slug: "resize-image-to-exact-pixels",
    title: "How to Resize a Photo to Exact Pixels for Online Forms (Without Stretching It)",
    metaTitle: "Resize a Photo to Exact Pixels for Online Forms",
    description:
      "How pixels, cm and DPI relate, how to turn a size in cm into pixels, and how to get a photo to exact dimensions like 200 × 230 px without stretching your face.",
    topic: "Forms and uploads",
    updated: "2026-11-19",
    intro: [
      "Online forms ask for photos in exact pixel sizes, such as 200 × 230 px, or in centimetres, such as 3.5 × 2.5 cm. A phone photo is about 3000 × 4000 px and a different shape, so it needs two changes: a crop to the right shape and a resize to the right number of pixels. Doing only the resize stretches or squashes the photo, which is one of the most common reasons for rejection.",
      "This guide explains the units, shows how to convert centimetres to pixels, and gives a reliable order of steps.",
    ],
    sections: [
      {
        id: "units",
        heading: "Pixels, centimetres and DPI",
        blocks: [
          p("A digital image has only pixels. Centimetres appear when it is printed, and DPI (dots per inch) links the two: at 200 DPI, every inch of print holds 200 pixels. So a size in centimetres means nothing for an upload until the form also gives a DPI, or a pixel size."),
          p("To convert: pixels = cm ÷ 2.54 × DPI. For the PAN card photo, 2.5 × 3.5 cm at 200 DPI: 2.5 ÷ 2.54 × 200 = 196.9 and 3.5 ÷ 2.54 × 200 = 275.6, so 197 × 276 px. A 35 × 45 mm passport photo at 300 DPI is 413 × 531 px."),
          {
            type: "table",
            caption: "Centimetres to pixels at common DPI values (width × height)",
            head: ["Size", "At 200 DPI", "At 300 DPI"],
            rows: [
              ["2.5 × 3.5 cm", "197 × 276 px", "295 × 413 px"],
              ["3.5 × 4.5 cm", "276 × 354 px", "413 × 531 px"],
              ["5 × 5 cm (2 × 2 in)", "394 × 394 px", "591 × 591 px"],
            ],
          },
        ],
      },
      {
        id: "shape",
        heading: "Crop to the shape first",
        blocks: [
          p("Shape is the ratio of width to height. 200 × 230 px is slightly taller than wide (0.87); a phone photo at 3000 × 4000 px is taller still (0.75). Squeezing 3000 × 4000 straight into 200 × 230 would make a face look wider than it is."),
          p("Instead, crop the photo to the target shape and then shrink it. For 200 × 230 from 3000 × 4000, keep the full width of 3000 px and a height of 3000 × 230 ÷ 200 = 3,450 px, cutting 550 px from the top and bottom together. Now the shapes match and the resize to 200 × 230 is clean."),
        ],
      },
      {
        id: "steps",
        heading: "Steps that work on a phone",
        blocks: [
          list(
            [
              "Take the photo in good light, against a plain light wall, with the camera at eye level and your face filling about two thirds of the height.",
              "Open the Exam Photo Resizer if your form is listed there, since it has the sizes built in; otherwise crop to the shape with Crop Image.",
              "Resize to the exact width and height in pixels with Resize Image. After cropping to the right shape, keeping the aspect ratio gives the exact size.",
              "Download as JPG and check the file size. If the form also has a KB limit, run the result through Compress Image to reach it.",
            ],
            true,
          ),
          note("Upload limits in KB are separate from pixel sizes. Two photos of exactly 200 × 230 px can differ several times in file size, depending on the background and detail."),
        ],
      },
      {
        id: "mistakes",
        heading: "Common mistakes",
        blocks: [
          list([
            "Resizing a screenshot of the photo instead of the photo itself, which adds borders and lowers quality.",
            "Enlarging a small photo to a bigger size: it gets the right pixel count but looks blurred.",
            "Saving as PNG when the form wants JPG; PNG files of photos are also much larger.",
            "Width and height swapped: forms list width first, so 200 × 230 is 200 px wide.",
          ]),
        ],
      },
    ],
    tools: ["resize-image", "exam-photo-resizer", "crop-image", "compress-image"],
  },
  {
    slug: "calculate-percentage-of-marks",
    title: "How to Calculate Percentage of Marks, and CGPA to Percentage",
    metaTitle: "How to Calculate Percentage of Marks (and CGPA)",
    description:
      "Work out your percentage from marks obtained and total marks, best-of-five, CBSE's CGPA to percentage formula, and the difference between percentage and percentile.",
    topic: "Health and everyday",
    updated: "2026-11-19",
    intro: [
      "Admission and job forms ask for your percentage in a precise way: out of which subjects, rounded how, and sometimes converted from a CGPA. Getting it wrong can mean a rejected form or a mismatch at document verification.",
      "This guide covers the basic formula, the common variations, and how to convert grades into a percentage.",
    ],
    sections: [
      {
        id: "basic",
        heading: "The basic formula",
        blocks: [
          p("Percentage = marks obtained ÷ total marks × 100."),
          p("If you scored 437 out of 500: 437 ÷ 500 = 0.874, × 100 = 87.4%. Out of 600 marks with 512 scored: 512 ÷ 600 × 100 = 85.33%. Most forms want two decimal places; do not round up unless the form says so."),
        ],
      },
      {
        id: "variations",
        heading: "Common variations",
        blocks: [
          list([
            "Best of five: add the marks of your five highest subjects as the rules define them (usually including one language) and divide by 500.",
            "Aggregate across years: add the marks obtained in every year or semester, and divide by the total of the maximum marks, not by the number of years. Averaging yearly percentages gives a slightly different, incorrect answer when the years have different totals.",
            "Subjects with practicals: include theory and practical marks together, out of the combined maximum, unless the form asks for theory only.",
          ]),
          p("An example of the aggregate rule: 540 out of 600 in year one (90%) and 560 out of 700 in year two (80%). The correct aggregate is (540 + 560) ÷ (600 + 700) × 100 = 84.62%, not the 85% you get by averaging 90 and 80."),
        ],
      },
      {
        id: "cgpa",
        heading: "CGPA to percentage",
        blocks: [
          p("For its old grading scheme, CBSE published an indicative conversion: percentage = CGPA × 9.5. A CGPA of 8.6 becomes 8.6 × 9.5 = 81.7%."),
          p("Universities set their own formulas, and many differ from CBSE's. Use the formula printed on your marksheet or published by your university; if it gives none, ask the exam branch for a conversion certificate, which forms accept."),
        ],
      },
      {
        id: "forms",
        heading: "Entering it on a form",
        blocks: [
          list([
            "If your marksheet already states a percentage, enter that exact figure: it is what the verification officer will compare against.",
            "Follow the form's rounding rule. Where it asks for two decimals, 85.333 becomes 85.33. Where it asks for a whole number and says nothing else, do not round 59.6 up to 60 to cross an eligibility line; many notifications say explicitly that such rounding is not allowed.",
            "Include grace marks only if they appear in the marks obtained on your marksheet.",
            "Keep a note of how you arrived at the figure, in case you are asked at document verification.",
          ]),
        ],
      },
      {
        id: "percentile",
        heading: "Percentage vs percentile",
        blocks: [
          p("A percentage describes your own marks. A percentile describes your position among everyone who took the test: a 90 percentile means you scored more than 90% of candidates, whatever your marks were. Entrance exams such as JEE Main report percentiles, so a 90 percentile score can come from much less than 90% of the marks."),
          note("To check the arithmetic, or work out a percentage change between two scores, use the Percentage Calculator."),
        ],
      },
    ],
    tools: ["percentage-calculator"],
  },
  {
    slug: "age-on-exam-cut-off-date",
    title: "How to Calculate Your Age on an Exam's Cut-off Date",
    metaTitle: "How to Calculate Your Age on the Exam Cut-off Date",
    description:
      "Work out your exact age in years, months and days on a recruitment cut-off date, read age limits correctly, and handle 29 February birthdays and relaxations.",
    topic: "Forms and uploads",
    updated: "2026-11-19",
    intro: [
      "Every recruitment notification sets an age limit “as on” a cut-off date, often the first day of a month that has already passed or is still months away. Your age on that date decides whether you can apply, not your age today. A difference of a single day can make a candidate ineligible.",
      "This guide shows how to calculate age on a date by hand, how notifications phrase their limits, and the cases that most often cause mistakes.",
    ],
    sections: [
      {
        id: "by-hand",
        heading: "Calculating age on a date by hand",
        blocks: [
          p("Subtract the date of birth from the cut-off date, starting from the days, borrowing from the months and years when needed."),
          list(
            [
              "Born 15 August 2001, cut-off 1 August 2026.",
              "Days: 1 − 15 is negative, so borrow a month: the month before August is July, with 31 days, giving 32 − 15 = 17 days.",
              "Months: after borrowing, the cut-off month is July (7); 7 − 8 is negative, so borrow a year: 19 − 8 = 11 months.",
              "Years: 2025 − 2001 = 24 years.",
              "Age on 1 August 2026: 24 years, 11 months and 17 days. The candidate turns 25 a fortnight after the cut-off.",
            ],
            true,
          ),
          p("The Age Calculator gives the same result instantly when you enter both dates, along with the total in months and days."),
        ],
      },
      {
        id: "read-limits",
        heading: "How notifications state age limits",
        blocks: [
          p("Notifications usually state the limit in two ways at once: an age range, such as 20 to 30 years as on 1 August 2026, and a birth-date window, such as born not earlier than one date and not later than another, both dates inclusive. When both are given, the birth-date window is the rule. Compare your date of birth with it directly; it removes any doubt about whether “up to 30” includes the day you turn 30 or the day before you turn 31."),
          {
            type: "table",
            caption: "Age on 1 August 2026 for nearby birth dates, from our Age Calculator",
            head: ["Date of birth", "Age on 1 August 2026"],
            rows: [
              ["1 August 1996", "30 years, 0 months, 0 days"],
              ["2 August 1996", "29 years, 11 months, 30 days"],
              ["15 August 2001", "24 years, 11 months, 17 days"],
              ["10 March 1998", "28 years, 4 months, 22 days"],
            ],
          },
        ],
      },
      {
        id: "tricky",
        heading: "Tricky cases",
        blocks: [
          list([
            "Birthday on the cut-off date: you complete that year of age on that day. Someone born 1 August 1996 is exactly 30 on 1 August 2026.",
            "Born on 29 February: in non-leap years, our calculator counts the birthday on 28 February, so a person born 29 February 2004 is 22 years old on 28 February 2026. Some rules treat 1 March as the birthday instead; if you are one day from a limit, check the notification or ask the recruiting body.",
            "Age relaxation: reserved categories, ex-servicemen and persons with disabilities often get extra years on the upper limit. Add the relaxation to the upper age, not to your own age, and keep the certificate ready: it is checked at document verification.",
            "Date format: Indian forms use DD/MM/YYYY. Entering 01/08 as 8 January instead of 1 August is a common slip on forms built with US-style date pickers.",
          ]),
        ],
      },
    ],
    tools: ["age-calculator", "date-calculator"],
  },
];
