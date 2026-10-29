import type { WidgetToolDefinition } from "../types";
import { wordCounter } from "./text";

const privateFaq = {
  question: "Is anything I enter saved?",
  answer: "No. Everything runs on your device and nothing is stored or sent.",
};

export const dateCalculator: WidgetToolDefinition = {
  workspace: "date-calculator",
  slug: "date-calculator",
  category: "calculators",
  name: "Date Calculator",
  metaTitle: "Date Calculator – Days Between Dates, Add or Subtract Days",
  description:
    "Count the days, weeks and months between two dates, with working days, or find the date a number of days, weeks or months before or after a date.",
  overview: [
    "Dates come up all the time: how many days until an exam or a wedding, how long a notice period or a loan runs, how many working days a leave application covers, or what the date will be 90 days after a bill. Counting on a calendar is slow and easy to get wrong across months of different lengths and leap years.",
    "Choose Days between dates to get the gap in years, months and days, the total in days and weeks, and the working days from Monday to Friday or excluding only Sundays. Turn on Count the end date for leave and bookings, where both the first and last day count. Or choose Add or subtract to move a date forward or back by days, weeks, months or years; adding a month to 31 January gives the last day of February, as most contracts expect.",
  ],
  howTo: [
    "Choose Days between dates or Add or subtract.",
    "Pick the start date (today is filled in) and the end date, or the amount and unit to add or subtract.",
    "Turn on Count the end date too if both the first and the last day should count, as for leave.",
    "Read the result: total days, years, months and days, weeks and working days.",
  ],
  examples: [
    { title: "Days left in 2026 from 1 January", input: "2026-01-01 to 2026-10-30", output: "9 months, 29 days\n302 days in total\n216 working days (Mon–Fri)" },
    { title: "One week of leave, both ends counted", input: "2026-11-02 to 2026-11-08, counting the end date", output: "7 days\n7 days in total\n5 working days (Mon–Fri)" },
    { title: "90 days after a date", input: "2026-10-30 + 90 days", output: "Thu, 28 Jan 2027" },
  ],
  limitations: [
    "Working days do not exclude public holidays, which differ by state and employer.",
    "Dates are calendar dates; times of day and time zones are not considered.",
  ],
  faq: [
    {
      question: "Does the count include the end date?",
      answer:
        "Not by default: from 1 March to 3 March is 2 days. Turn on Count the end date too to get 3, as for leave or a hotel booking counted by days.",
    },
    {
      question: "What counts as a working day?",
      answer: "Monday to Friday. The result also shows the count excluding only Sundays, for six-day weeks common in India.",
    },
    {
      question: "What is 1 month after 31 January?",
      answer: "28 February (29 in a leap year). When the day does not exist in the target month, the last day of that month is used.",
    },
    privateFaq,
  ],
  related: ["age-calculator", "loan-calculator", "percentage-calculator"],
};

export const discountCalculator: WidgetToolDefinition = {
  workspace: "discount-calculator",
  slug: "discount-calculator",
  category: "calculators",
  name: "Discount Calculator",
  metaTitle: "Discount Calculator – Sale Price, Savings and Discount %",
  description:
    "Find the price after a discount, including stacked offers like 20% + 10% bank discount, or work out the real discount % from MRP and sale price.",
  overview: [
    "Sales, festive offers and online deals often combine discounts: a flat 40% off, then an extra 10% with a bank card or a coupon. The two do not simply add up, because the second discount applies to the already reduced price, so 40% + 10% is 46% off, not 50%. It also helps to check how much a \"special price\" really saves against the MRP.",
    "Enter the marked price and the discount to see what you pay and how much you save. Add an extra discount to see the combined effect of two offers. Or switch to Discount % and enter the MRP and the price you are asked to pay to find the real discount, which is handy when a shop shows only the final price.",
  ],
  howTo: [
    "Choose Price after discount, or Discount % to work backwards from a sale price.",
    "Enter the marked price (MRP).",
    "Enter the discount, and an extra discount if there is a second offer, or the price you pay.",
    "Read the final price, the amount saved and the total discount.",
  ],
  examples: [
    { title: "Festive sale plus a bank offer", input: "1,000 with 20% + 10% off", output: "You pay: ₹720\nYou save: ₹280 (28% off)" },
    { title: "A flat 35% off", input: "2,499 with 35% off", output: "You pay: ₹1,624.35\nYou save: ₹874.65 (35% off)" },
  ],
  limitations: [
    "GST is assumed to be included in the marked price, as on an MRP. Cashback paid later is not a discount on the price.",
    "Bank offers often have a maximum discount amount; check the cap in the offer terms.",
  ],
  faq: [
    {
      question: "Is 20% + 10% the same as 30% off?",
      answer: "No. The 10% applies to the price after 20% off, so the total is 28%. On ₹1,000 you pay ₹720, not ₹700.",
    },
    {
      question: "How do I calculate the discount percentage?",
      answer: "Discount % = (MRP − price you pay) ÷ MRP × 100. For ₹1,999 marked and ₹1,299 paid: 700 ÷ 1,999 × 100 = 35%.",
    },
    {
      question: "How do I calculate a discount quickly?",
      answer: "For 10%, move the decimal point one place: 10% of ₹2,499 is ₹249.90. 20% is twice that, 5% half of it.",
    },
    privateFaq,
  ],
  related: ["percentage-calculator", "gst-calculator", "gold-price-calculator"],
};

export const goldPriceCalculator: WidgetToolDefinition = {
  workspace: "gold-calculator",
  slug: "gold-price-calculator",
  category: "calculators",
  name: "Gold Price Calculator",
  metaTitle: "Gold Price Calculator – 22K & 24K Jewellery with Making & GST",
  description:
    "Work out the price of gold jewellery from today's rate: 24K, 22K, 18K or 14K purity, weight, making charges as % or per gram, and 3% GST.",
  overview: [
    "The price of gold jewellery is more than the day's gold rate. It depends on the purity (22K is 91.6% gold, 18K is 75%), the weight, the jeweller's making charges and 3% GST on the total. Knowing how these add up lets you compare quotes from different shops, check a bill, or plan a purchase for a wedding, Dhanteras or Akshaya Tritiya.",
    "Enter today's 24K rate per 10 grams or per gram (from your jeweller or a news site; this tool does not fetch live prices), then the purity, the weight and the making charges, either as a percentage of the gold value or a fixed amount per gram. The calculator shows the rate for that purity, the gold value, the making charges, the GST and the final price.",
  ],
  howTo: [
    "Enter today's 24K (999) gold rate and whether it is per 10 grams or per gram.",
    "Choose the purity: 22K for most jewellery, 18K for diamond jewellery, 24K for coins and bars.",
    "Enter the weight in grams and the making charges as % or ₹ per gram.",
    "Read the gold value, making charges, GST and total.",
  ],
  examples: [
    { title: "10 g of 22K jewellery with 12% making", input: "24K at 10,000 a gram, 22K, 10 g, making 12%", output: "Gold value: ₹91,691.70\nMaking charges: ₹11,003.00\nGST (3%): ₹3,080.84\nTotal: ₹1,05,775.54" },
    { title: "A 5 g 24K coin, ₹500 a gram making", input: "24K at 10,000 a gram, 24K, 5 g, making ₹500 a gram", output: "Gold value: ₹50,000.00\nMaking charges: ₹2,500.00\nGST (3%): ₹1,575.00\nTotal: ₹54,075.00" },
  ],
  limitations: [
    "Today's gold rate is not fetched automatically; enter the rate your jeweller quotes.",
    "Stones, wastage charges and hallmarking fees are not included; deduct stone weight before entering the weight.",
  ],
  faq: [
    {
      question: "How is the 22K gold price calculated?",
      answer: "From the 24K rate by purity: 22K is 916 fineness, so its price per gram is about 24K rate × 916 ÷ 999. At ₹10,000 a gram for 24K, 22K is about ₹9,169.",
    },
    {
      question: "How much GST is charged on gold jewellery?",
      answer: "3% on the gold value plus making charges. The September 2025 GST reform left the rate on gold unchanged.",
    },
    {
      question: "What are normal making charges?",
      answer: "They vary by design and shop, often 8–25% of the gold value for jewellery, or a fixed amount per gram. Machine-made chains cost less to make than handcrafted pieces.",
    },
    privateFaq,
  ],
  related: ["gst-calculator", "discount-calculator", "unit-converter"],
};

export const unitConverter: WidgetToolDefinition = {
  workspace: "unit-converter",
  slug: "unit-converter",
  category: "converters",
  name: "Unit Converter",
  metaTitle: "Unit Converter – Length, Weight, Area, Temperature and More",
  description:
    "Convert cm to feet, kg to pounds, square feet to square metres, acres, gaj and guntha, °C to °F, litres, speed and data sizes, with every unit at once.",
  overview: [
    "Everyday measurements mix systems: height in feet and inches, weight in kilograms, land in square feet, gaj, guntha or acres, petrol in litres, recipes in cups, and storage in GB. Converting by hand means remembering factors such as 2.54 cm to an inch or 43,560 square feet to an acre.",
    "Pick a quantity, type a value and choose the units to convert from and to. The result appears straight away, along with the value in every other unit of that quantity, so you can read off several conversions at once. Length results also show feet and inches, useful for heights. Indian land units included here are those with a fixed size everywhere: square yard (gaj), cent and guntha; bigha and biswa differ from state to state, so they are left out.",
  ],
  howTo: [
    "Choose a quantity: length, weight, area, volume, speed, data or temperature.",
    "Type the value, and pick the units to convert from and to; the swap button flips them.",
    "Read the result, or the list below it for every other unit.",
  ],
  examples: [
    { title: "Height in feet to centimetres", input: "5.8 ft to cm", output: "5.8 Foot = 176.784 Centimetre" },
    { title: "Land: 1 acre in square feet", input: "1 acre to sqft", output: "1 Acre = 43,560 Square foot" },
    { title: "Body temperature", input: "98.6 F to C", output: "98.6 Fahrenheit = 37 Celsius" },
  ],
  limitations: [
    "Bigha, biswa and other land units whose size varies by state are not included.",
    "US and UK gallons differ; both are listed.",
  ],
  faq: [
    {
      question: "How many square feet are in a gaj?",
      answer: "A gaj is a square yard: exactly 9 square feet, or about 0.836 square metres. 100 gaj is 900 square feet.",
    },
    {
      question: "How do I convert cm to feet and inches?",
      answer: "Divide by 2.54 to get inches, then by 12 for feet: 170 cm ÷ 2.54 = 66.9 in = 5 ft 6.9 in. Choose Length, from cm to ft, to see it directly.",
    },
    {
      question: "Why is a GB sometimes 1,024 MB?",
      answer: "Storage makers use 1 GB = 1,000 MB, while some operating systems count in binary units, where 1 GiB = 1,024 MiB. Both kinds are listed.",
    },
    privateFaq,
  ],
  related: ["percentage-calculator", "bmi-calculator", "color-converter"],
};

export const typingTest: WidgetToolDefinition = {
  workspace: "typing-test",
  slug: "typing-test",
  category: "text-tools",
  name: "Typing Speed Test",
  metaTitle: "Typing Speed Test – Check Your WPM and Accuracy Free",
  description:
    "Test your English typing speed in words per minute with a 1, 3 or 5-minute test. See net and raw WPM, accuracy and mistakes as you type.",
  overview: [
    "Typing speed matters for office work, data entry and many government exams: SSC and other recruitment tests often ask for 35 words per minute in English, and stenographer and clerk posts set their own targets. Knowing your speed and accuracy shows how much practice you need before the exam or interview.",
    "Pick a test length and start typing the passage; the timer begins with your first key. Each character turns dark when correct and red when wrong, and the score updates as you type. Speed is counted the standard way, as 5 characters per word: net WPM counts only correct characters, raw WPM counts everything you typed, and accuracy is the share typed correctly. Pasting is turned off so the result is honest.",
  ],
  howTo: [
    "Choose 1, 3 or 5 minutes.",
    "Click in the box and start typing the passage exactly as shown, with capitals and punctuation.",
    "Keep going until the time runs out; mistakes are marked in red.",
    "Read your WPM and accuracy, then try again or switch to a new passage.",
  ],
  examples: [
    { title: "A perfect line in 12 seconds", input: "the quick brown fox  in 12 s", output: "20 WPM, 100% accuracy" },
  ],
  limitations: [
    "The test is in English. Hindi typing tests use specific keyboard layouts (Inscript, Krutidev) that need their own practice tool.",
    "Mistakes cannot be corrected without counting against accuracy once typed, as in most exam software.",
  ],
  faq: [
    {
      question: "What is a good typing speed?",
      answer: "Around 40 WPM is average for regular computer users. 35 WPM in English is a common exam requirement; 60 WPM or more is fast.",
    },
    {
      question: "How is WPM calculated?",
      answer: "Characters typed correctly ÷ 5 ÷ minutes. A word is counted as 5 characters, including spaces, so long and short words even out.",
    },
    {
      question: "How can I type faster?",
      answer: "Learn to touch type without looking at the keys, focus on accuracy first and practise 10–15 minutes every day. Speed follows accuracy.",
    },
    privateFaq,
  ],
  related: ["word-counter", "character-counter", "case-converter"],
};

export const characterCounter: WidgetToolDefinition = {
  ...wordCounter,
  preset: { mode: "characters" },
  slug: "character-counter",
  name: "Character Counter",
  metaTitle: "Character Counter – Instagram, X, YouTube and SMS Limits",
  description:
    "Count characters as you type and see how much room is left for an Instagram caption, X post, YouTube title, meta description or SMS.",
  overview: [
    "Social posts, ads and web pages all have character limits: 280 for an X post, 2,200 for an Instagram caption, 100 for a YouTube title, about 160 for a Google meta description, and 160 per SMS (only 70 if the message contains Hindi or emoji). Going over means your text is cut off or rejected.",
    "Type or paste your text to see the character count and how many characters are left for each common limit, with anything over the limit marked. Characters are counted the way people see them, so an emoji or a Hindi letter with its matra counts once. The SMS line shows how many parts a message will be sent in. Word count, reading time and the other counts are shown alongside.",
  ],
  howTo: [
    "Type or paste your text.",
    "Read the character count and the room left for each platform; red means over the limit.",
    "Check the SMS line for how many parts a text message will use.",
  ],
  examples: [
    { title: "Limits: a short post", input: "Diwali sale starts today! 🎉", output: "27 characters\nX post: 253 left\nSMS: 1 part (Unicode)" },
  ],
  faq: [
    {
      question: "Do spaces count as characters?",
      answer: "Yes, on every platform. The counts also show characters without spaces if you need them for a form.",
    },
    {
      question: "Why does my SMS count drop to 70 characters?",
      answer: "Text with characters outside the basic SMS alphabet, such as Hindi letters or emoji, is sent as Unicode, which fits 70 characters per message (67 per part when split).",
    },
    ...wordCounter.faq.slice(-1),
  ],
  related: ["word-counter", "case-converter", "typing-test"],
};

export const everydayTools = [dateCalculator, discountCalculator, goldPriceCalculator, unitConverter, typingTest, characterCounter];
