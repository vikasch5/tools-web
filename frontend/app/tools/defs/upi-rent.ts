import type { WidgetToolDefinition } from "../types";
import { qrCodeGenerator } from "./generators";

export const upiQrCode: WidgetToolDefinition = {
  ...qrCodeGenerator,
  preset: { mode: "upi" },
  slug: "upi-qr-code-generator",
  name: "UPI QR Code Generator",
  metaTitle: "UPI QR Code Generator – Free Payment QR for Shops",
  description:
    "Make a free UPI payment QR code for your shop or business from your UPI ID, with an optional fixed amount and note. Works with GPay, PhonePe, Paytm and BHIM.",
  overview: [
    "A UPI QR code lets customers pay you by scanning with any UPI app: Google Pay, PhonePe, Paytm, BHIM or their bank's app. Shops, tutors, delivery workers and small businesses print one for the counter, put it on invoices and menus, or share it on WhatsApp, and the money goes straight to their bank account with no fee.",
    "Enter your UPI ID (the address like yourname@okaxis or 98xxxxxxxx@ybl shown in your UPI app) and the name customers should see. Leave the amount empty for a code that works for any payment, or add an amount and a note for a single bill. The code follows NPCI's upi://pay format, and you can download it as a sharp PNG for printing or an SVG for designs. It is made on your device; your UPI ID is never sent anywhere.",
  ],
  howTo: [
    "Copy your UPI ID from your UPI app (Profile or Bank account section).",
    "Enter it, and the name customers should see when they scan.",
    "Optionally add an amount and a note, for example an order number, for a one-off bill.",
    "Scan the code with your own phone to check the name, then download it as PNG or SVG and print or share it.",
  ],
  examples: [
    {
      title: "UPI: a shop code for a fixed bill",
      input: "UPI: sharma.store@okaxis, Sharma Store, 1250, Order 42",
      output: "upi://pay?pa=sharma.store%40okaxis&pn=Sharma%20Store&am=1250.00&cu=INR&tn=Order%2042",
    },
    { title: "UPI: any amount", input: "UPI: 9876543210@ybl", output: "upi://pay?pa=9876543210%40ybl&cu=INR" },
  ],
  limitations: [
    "Payments made by scanning go to the UPI ID in the code; always scan your printed code once to confirm the name shown.",
    "Merchant features such as payment sound boxes and settlement reports come from your bank or payment app, not from the QR code.",
  ],
  faq: [
    {
      question: "Is it safe to share my UPI QR code?",
      answer:
        "Yes. A UPI QR code can only be used to send money to you; nobody can take money from your account with it. Never scan a QR code or enter your PIN to receive money: UPI only asks for a PIN when you pay.",
    },
    {
      question: "Does a UPI QR code have any charges?",
      answer: "No. Making the code is free, and UPI payments from a bank account to a person or small merchant carry no fee for the payer or the receiver.",
    },
    {
      question: "Should I add an amount?",
      answer: "For a counter or shop display, leave it empty so customers type the bill amount. Add an amount for a specific invoice so the payer cannot get it wrong.",
    },
    ...qrCodeGenerator.faq.slice(-1),
  ],
  related: ["qr-code-generator", "gst-calculator", "rent-receipt-generator"],
};

export const rentReceiptGenerator: WidgetToolDefinition = {
  workspace: "rent-receipt",
  slug: "rent-receipt-generator",
  category: "generators",
  name: "Rent Receipt Generator",
  metaTitle: "Rent Receipt Generator for HRA – Free PDF, Monthly Receipts",
  description:
    "Make monthly rent receipts for HRA claims as a printable PDF: tenant, landlord, PAN, address, rent in words, one receipt per month, two per A4 page.",
  overview: [
    "Salaried employees who claim HRA under the old tax regime have to give their employer proof of rent, usually monthly rent receipts signed by the landlord, often by January or February for the whole financial year. Writing twelve receipts by hand is tedious, and missing details such as the landlord's PAN for rent over ₹1 lakh a year is a common reason claims are held up.",
    "Fill in the tenant and landlord names, the landlord's PAN, the address, the monthly rent and the months to cover (the current financial year is filled in). The tool writes one receipt per month with the amount in figures and in words, the payment mode and a signature line, adds a revenue stamp box for cash rent over ₹5,000, and saves them as a PDF with two receipts per A4 page, ready to print, sign and submit.",
  ],
  howTo: [
    "Enter the tenant's and the landlord's names, and the landlord's PAN if the yearly rent is over ₹1 lakh.",
    "Enter the address of the rented home and the monthly rent.",
    "Choose the first and last month; the current April–March financial year is filled in.",
    "Pick how the rent was paid, then download the PDF.",
    "Print it, have the landlord sign each receipt (across a revenue stamp for cash over ₹5,000), and submit it to your employer.",
  ],
  examples: [
    {
      title: "A full financial year",
      input: "₹18,000 a month, 2026-04 to 2027-03",
      output: "12 receipts, April 2026 to March 2027\nTotal rent: Rs. 2,16,000\nEach: Rs. 18,000 (Rupees Eighteen Thousand Only)",
    },
  ],
  limitations: [
    "Names and addresses must be in English letters; the PDF font cannot show Hindi or other scripts.",
    "Receipts are only valid with the landlord's signature. Rent paid to a close relative is allowed, but must be genuinely paid and declared by them as income.",
  ],
  faq: [
    {
      question: "When is the landlord's PAN needed?",
      answer: "When the rent is more than ₹1 lakh in the financial year (over about ₹8,333 a month). Without it, the employer may not allow the HRA exemption.",
    },
    {
      question: "Do rent receipts need a revenue stamp?",
      answer:
        "A revenue stamp is needed on a receipt for a cash payment of more than ₹5,000. Rent paid by UPI, bank transfer or cheque does not need one, as the payment itself is the proof.",
    },
    {
      question: "Can I claim HRA in the new tax regime?",
      answer: "No. HRA exemption is only available under the old regime. Use the Income Tax Calculator to compare both regimes first.",
    },
    {
      question: "Is anything I enter saved?",
      answer: "No. The PDF is made on your device and nothing is stored or sent.",
    },
  ],
  related: ["hra-calculator", "income-tax-calculator", "upi-qr-code-generator"],
};
