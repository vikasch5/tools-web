import type { WidgetToolDefinition } from "../types";

const sameState = {
  title: "Same state: CGST + SGST",
  input: "10 × 450 at 18% + 1 × 1500 at 18%, Delhi to Delhi",
  output: "Taxable value: Rs. 6,000.00\nCGST Rs. 540.00 + SGST Rs. 540.00\nTotal: Rs. 7,080.00 (Rupees Seven Thousand Eighty Only)",
};
const otherState = {
  title: "Another state: IGST, rounded off",
  input: "3 × 2499 at 5%, Maharashtra to Karnataka",
  output: "Taxable value: Rs. 7,497.00\nIGST Rs. 374.85\nRound off: Rs. 0.15\nTotal: Rs. 7,872.00 (Rupees Seven Thousand Eight Hundred Seventy Two Only)",
};
const unionTerritory = {
  title: "Union territory: CGST + UTGST",
  input: "1 × 25000 at 18%, Chandigarh to Chandigarh",
  output: "Taxable value: Rs. 25,000.00\nCGST Rs. 2,250.00 + UTGST Rs. 2,250.00\nTotal: Rs. 29,500.00 (Rupees Twenty Nine Thousand Five Hundred Only)",
};

const savedFaq = {
  question: "Where are my invoices saved? Do I need an account?",
  answer:
    "No account is needed. Your business profile, customers, items and every document you save are stored in this browser on your device, and nothing is uploaded. Use Business settings → Download backup regularly; the backup file restores everything on another phone or computer.",
};

export const invoiceGenerator: WidgetToolDefinition = {
  workspace: "invoice-generator",
  slug: "invoice-generator",
  category: "generators",
  name: "Invoice Generator",
  metaTitle: "Free GST Invoice Generator – Bills, Quotations, PDF",
  description:
    "Make professional GST invoices, bills and quotations online: CGST/SGST or IGST worked out, HSN summary, amount in words, UPI QR, PDF download and saved history.",
  overview: [
    "Every GST-registered business has to issue a tax invoice with specific details: a unique number for the financial year, both parties' GSTINs and states, the place of supply, HSN or SAC codes, the taxable value and the tax at each rate. Getting the split right is where most hand-made bills go wrong: a sale within your state is charged CGST plus SGST (UTGST in union territories such as Chandigarh), while a sale to another state is charged IGST.",
    "This generator does that for you. Set up your business once with your logo, GSTIN, bank details and UPI ID, then each invoice takes a minute: pick a saved customer, add items from your list, and download a clean A4 PDF with the tax split, an HSN-wise summary, the total in words, a UPI QR code for the amount due and your signature. Quotations and proforma invoices turn into invoices in one click, and the dashboard shows what has been paid, what is overdue and how much GST you charged this year. Everything is saved in your browser on your device; nothing is uploaded.",
  ],
  howTo: [
    "Open the invoice panel and go to Business settings. Enter your business name, address, GSTIN (the state fills in from it), bank details and UPI ID. Add your logo and signature if you like.",
    "Press New invoice and choose Invoice, Quotation or Proforma; the next number in your series is filled in.",
    "Enter the customer or pick a saved one. Their GSTIN fills in their state and the place of supply, which decides CGST + SGST or IGST.",
    "Add items with HSN/SAC, quantity, rate, discount and GST rate. Saved items fill in their details as you type.",
    "Press Save and download PDF, or Share to send it on WhatsApp. Find it again under Invoices, mark it paid, or download a CSV for your accountant.",
  ],
  examples: [sameState, otherState, unionTerritory],
  limitations: [
    "This makes regular invoices. It does not generate an e-invoice IRN or e-way bill; businesses whose turnover requires e-invoicing must report B2B invoices on the government's invoice registration portal.",
    "Names, addresses and items must be in English letters; the PDF font cannot show Hindi or other scripts.",
    "Saved data stays in this browser on this device. Clearing browser data deletes it, so download a backup regularly.",
  ],
  faq: [
    {
      question: "When is IGST charged instead of CGST and SGST?",
      answer:
        "When the place of supply (usually where the goods are delivered or the customer is registered) is in a different state from your business, the supply is inter-state and IGST is charged at the full rate. Within the same state, the rate is split equally into CGST and SGST, or CGST and UTGST in union territories without a legislature.",
    },
    {
      question: "What must a GST tax invoice show?",
      answer:
        "Your name, address and GSTIN; a serial number of up to 16 characters, unique for the financial year; the date; the customer's name, address and GSTIN if registered; the place of supply; HSN or SAC codes; quantity, value and discount; the taxable value, the tax rate and amount for each tax; and your signature. This tool includes all of them.",
    },
    {
      question: "How are invoice numbers created?",
      answer:
        "Numbers follow PREFIX/YY-YY/001, for example INV/26-27/001, and restart at 001 each April. You can change the prefix in Business settings or type any number; the tool warns you if a number is already used.",
    },
    {
      question: "I am not registered for GST. Can I use it?",
      answer: "Yes. Turn off “Registered for GST” in Business settings. Your documents are then titled Invoice and show no GST, only the amounts.",
    },
    savedFaq,
  ],
  related: ["gst-calculator", "upi-qr-code-generator", "rent-receipt-generator"],
};

type Page = Pick<WidgetToolDefinition, "slug" | "name" | "metaTitle" | "description" | "overview" | "faq" | "preset"> & { howToFirst: string };

const page = (p: Page): WidgetToolDefinition => ({
  ...invoiceGenerator,
  ...p,
  howTo: [p.howToFirst, ...invoiceGenerator.howTo.slice(1)],
  related: ["invoice-generator", "gst-calculator", "upi-qr-code-generator"],
});

/** Landing pages: the same tool opened on a document type. */
export const invoicePages: WidgetToolDefinition[] = [
  page({
    slug: "gst-invoice-generator",
    name: "GST Invoice Generator",
    metaTitle: "GST Invoice Generator – Free Tax Invoice Format, PDF",
    description:
      "Create a GST tax invoice in the correct format: GSTIN, place of supply, HSN/SAC, CGST + SGST or IGST, HSN summary and amount in words. Free PDF, saved history.",
    preset: { kind: "invoice" },
    howToFirst: "Open Business settings in the invoice panel and enter your GSTIN; your state and PAN fill in from it. Add your address, bank details, UPI ID and logo.",
    overview: [
      "A GST tax invoice is the document your customer uses to claim input tax credit, so its format matters: under the CGST rules it has to carry your GSTIN, a serial number unique in the financial year, the customer's GSTIN for B2B sales, the place of supply, HSN or SAC codes, and the taxable value with the rate and amount of each tax. A missing GSTIN or a wrong tax type can cost your customer their credit.",
      "This generator builds the invoice in that format. It checks each GSTIN with its built-in check digit, reads the state from it, and charges CGST + SGST within your state or IGST to another state, splitting the tax rate by rate. The PDF adds an HSN-wise tax summary for GSTR-1, the amount in words, “Original for recipient”, your bank details and a UPI QR code. Saved invoices stay in your browser with payment status and a CSV export.",
    ],
    faq: [invoiceGenerator.faq[1], invoiceGenerator.faq[0], invoiceGenerator.faq[2], savedFaq],
  }),
  page({
    slug: "bill-generator",
    name: "Bill Generator",
    metaTitle: "Bill Generator – Make a Bill Online Free, With or Without GST",
    description:
      "Make a professional bill for your shop or service in a minute, with or without GST: items, discount, total in words and UPI QR. Free PDF and saved bill history.",
    preset: { kind: "invoice", gst: "off" },
    howToFirst: "Open Business settings in the invoice panel and enter your shop or business name and address. Leave “Registered for GST” off if you do not have a GSTIN.",
    overview: [
      "Shops, freelancers, tutors, repair services and small traders need a proper bill for every customer, whether or not they are registered for GST. A neat printed or PDF bill with your name, a bill number, the items and the total looks professional, avoids disputes about what was charged, and gives you a record of every sale.",
      "This bill maker works with or without GST. If you are not registered, turn GST off and the bill shows just the items, discounts and total; if you are, it adds GST with the right CGST, SGST or IGST split. Each bill gets the next number in your series, the total in words and a UPI QR code so the customer can pay by scanning. Customers and items you use are remembered for next time, and every bill is kept in your invoice list on your device.",
    ],
    faq: [
      invoiceGenerator.faq[3],
      {
        question: "What is the difference between a bill and an invoice?",
        answer:
          "In everyday use they mean the same thing: a document listing what was sold and what is owed. Under GST, a registered business must issue a “tax invoice”; an unregistered business issues a simple bill or invoice without GST.",
      },
      invoiceGenerator.faq[2],
      savedFaq,
    ],
  }),
  page({
    slug: "quotation-maker",
    name: "Quotation Maker",
    metaTitle: "Quotation Maker – Free Quotation Format with GST, PDF",
    description:
      "Make a professional quotation or estimate with GST, validity date and terms, then turn it into an invoice in one click when the customer agrees. Free PDF.",
    preset: { kind: "quotation" },
    howToFirst: "Open Business settings in the invoice panel and enter your business details once; they appear on every quotation.",
    overview: [
      "A quotation (or estimate) tells a customer what a job or an order will cost before they commit: the items, quantities, rates, GST and total, how long the price is valid, and your terms. A clear, professional quotation wins more work than a price sent in a chat message, and it avoids arguments later about what was promised.",
      "This maker numbers each quotation in its own series (QT/26-27/001), shows GST the same way the final invoice will, and prints a “Valid until” date and your terms. When the customer agrees, open Quotations in the invoice panel and turn it into an invoice: a tax invoice is created with the same customer and items and the next invoice number, and the quotation is marked as invoiced. Everything is saved in your browser; nothing is uploaded.",
    ],
    faq: [
      {
        question: "Is GST charged on a quotation?",
        answer:
          "No tax is due on a quotation itself; it only shows the GST that will be charged so the customer knows the full price. GST becomes payable when you issue the tax invoice for the supply.",
      },
      {
        question: "How do I convert a quotation into an invoice?",
        answer: "Open Quotations, find the quotation and press the turn-into-invoice button on its row. Check the new invoice, change anything that was agreed differently, and download it.",
      },
      invoiceGenerator.faq[0],
      savedFaq,
    ],
  }),
  page({
    slug: "proforma-invoice-generator",
    name: "Proforma Invoice Generator",
    metaTitle: "Proforma Invoice Generator – Free Format with GST, PDF",
    description:
      "Create a proforma invoice for advance payment or a bank or customs requirement, with GST, bank details and UPI QR. Convert it into a tax invoice later. Free.",
    preset: { kind: "proforma" },
    howToFirst: "Open Business settings in the invoice panel and enter your business, GSTIN and bank details; buyers paying in advance need your account details.",
    overview: [
      "A proforma invoice is a preliminary bill sent before the goods are delivered or the work is done. Buyers use it to arrange an advance payment, get internal approval, open a letter of credit, or support an import. It looks like an invoice, with the items, prices and GST, but it is not a tax invoice, so it does not create a GST liability or input tax credit.",
      "This generator numbers proforma invoices in their own series (PI/26-27/001), prints your bank details and a UPI QR code for the amount so the buyer can pay the advance, and keeps each one under Quotations. Once the supply happens, turn it into an invoice to create the tax invoice with the same items and the next invoice number, and record the advance received so the balance due is shown.",
    ],
    faq: [
      {
        question: "Is a proforma invoice a valid tax invoice under GST?",
        answer:
          "No. It is a quotation-like document for the buyer's convenience. You must issue a proper tax invoice when the goods are supplied or the service is provided (and a receipt voucher if you take an advance for services).",
      },
      {
        question: "How do I show an advance on the final invoice?",
        answer:
          "Convert the proforma to an invoice, then enter the advance in “Amount received so far”. The invoice shows the amount received and the balance due, and the UPI QR code asks for the balance.",
      },
      invoiceGenerator.faq[2],
      savedFaq,
    ],
  }),
];
