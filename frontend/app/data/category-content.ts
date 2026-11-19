/**
 * Long-form content for category pages: what the tools are for, which one
 * fits which job, and common questions. Every `slug` must be a live tool or
 * landing page (checked in category-content.test.ts).
 */
export type CategoryContent = {
  /** "About" paragraphs. */
  about: string[];
  /** "Which tool do I need?": a job, and the tool that does it. */
  choose: { job: string; slug: string }[];
  faq: { question: string; answer: string }[];
};

const privacy = {
  question: "Are my files or data uploaded anywhere?",
  answer:
    "No. Every tool on this site runs in your browser, so files and text stay on your device. You can check by turning off your internet connection after the page loads: the tools keep working.",
};

export const categoryContent: Record<string, CategoryContent> = {
  "developer-tools": {
    about: [
      "These are the small jobs that interrupt real work: an API response that arrives as one long line of JSON, a SQL query copied from a log, a JWT you need to read, a timestamp that has to become a date. Each tool here does one of those jobs properly and shows you exactly what changed.",
      "Formatting uses the same engines most projects use, Prettier for JavaScript, TypeScript, CSS and HTML and sql-formatter for SQL dialects, so the output matches what your editor would produce. The minifiers use Terser and CSSO and report the bytes saved. Validators point to the line and column of an error instead of just saying “invalid”.",
      "Everything runs locally. That matters for developer data: tokens, internal URLs and customer records should never be pasted into a site that sends them to a server.",
    ],
    choose: [
      { job: "Read or fix an API response, or find a JSON syntax error", slug: "json-formatter" },
      { job: "Tidy a long SQL query for MySQL, PostgreSQL or SQL Server", slug: "sql-formatter" },
      { job: "Make minified or messy JavaScript or TypeScript readable", slug: "js-formatter" },
      { job: "Shrink JavaScript or CSS before deploying", slug: "js-minifier" },
      { job: "See what is inside a login token and when it expires", slug: "jwt-decoder" },
      { job: "Turn a Unix timestamp into a date, or a date into epoch time", slug: "timestamp-converter" },
      { job: "Check a download against its SHA-256 checksum", slug: "hash-generator" },
      { job: "Encode a query string, or decode %20-style escapes", slug: "url-encoder" },
    ],
    faq: [
      {
        question: "What is the difference between formatting and minifying?",
        answer:
          "Formatting adds indentation and line breaks so people can read code. Minifying does the opposite: it removes everything a computer does not need, so files download faster. Format while you work, minify before you deploy.",
      },
      {
        question: "Can these tools change what my code does?",
        answer:
          "Formatters only change spacing and line breaks. Minifiers rewrite code, for example shortening variable names, but keep its behaviour; keep your original source and test the minified build as you normally would.",
      },
      privacy,
    ],
  },
  "pdf-tools": {
    about: [
      "Most PDF jobs come from forms and offices: an upload limit of 200 KB, a bank statement locked with a password, a scanned document with one page upside down, ten receipts that must go as a single file. These tools cover those jobs end to end, from merging and splitting to page numbers, watermarks and passwords.",
      "The tools work on the PDF itself instead of re-printing it, so text stays sharp and selectable wherever possible. Compress PDF, for example, first tries lossless repacking and only then lowers image quality step by step, stopping at the first result under your limit. Previews show each page before you download, so you can check the result.",
      "PDFs often hold the most private documents people own: ID proofs, salary slips, bank statements, medical reports. Here they never leave your device, which is the safest way to handle them.",
    ],
    choose: [
      { job: "Get a PDF under an upload limit like 100 KB, 200 KB or 1 MB", slug: "compress-pdf" },
      { job: "Join several PDFs, or scans, into one file", slug: "merge-pdf" },
      { job: "Take out some pages, or split a PDF by range", slug: "split-pdf" },
      { job: "Remove blank or unwanted pages", slug: "delete-pdf-pages" },
      { job: "Reorder pages or fix a sideways scan", slug: "organize-pdf" },
      { job: "Turn photos of documents into a PDF", slug: "image-to-pdf" },
      { job: "Open a password-protected bank statement for good", slug: "unlock-pdf" },
      { job: "Add a password before emailing a document", slug: "protect-pdf" },
      { job: "Convert a Word file to PDF, or get a PDF's text into Word", slug: "word-to-pdf" },
    ],
    faq: [
      {
        question: "Why is my PDF so large?",
        answer:
          "Almost always because of scanned pages or photos inside it. A phone scan can be several megabytes per page. Compress PDF lowers the image resolution and quality just enough to meet your limit; text-only PDFs are usually small already.",
      },
      {
        question: "Can I unlock a PDF if I do not know the password?",
        answer:
          "No. Unlock PDF removes a password you already know, such as the date of birth or PAN-based password on a bank statement, so you do not have to type it every time. It does not break passwords.",
      },
      privacy,
    ],
  },
  "image-tools": {
    about: [
      "Online forms in India are strict about images: an exam portal wants a 200 × 230 px photo between 20 and 50 KB, the PAN portal a 3.5 × 2.5 cm photo under 20 KB, a signature at 140 × 60 px. A photo straight from a phone is 3–5 MB and the wrong shape, so it gets rejected. These tools fix that, along with everyday jobs like cropping, resizing, converting formats and adding text.",
      "The exam photo and signature resizer has the published sizes for IBPS, SBI, SSC, UPSC, India Post GDS and PAN built in: pick the form and it produces a JPG at the exact pixel size and inside the KB range. Compress Image can aim for a size you name, such as 20 KB or 50 KB, instead of making you guess a quality setting.",
      "Photos of your face, signature and documents are personal, so all processing happens on your device and nothing is uploaded.",
    ],
    choose: [
      { job: "Photo and signature for IBPS, SSC, UPSC, GDS or PAN forms", slug: "exam-photo-resizer" },
      { job: "PAN card photo and signature for NSDL (Protean) or UTIITSL", slug: "pan-card-photo-resizer" },
      { job: "Get a photo under 20 KB, 50 KB or any size limit", slug: "compress-image" },
      { job: "Change an image to exact pixel dimensions", slug: "resize-image" },
      { job: "Clean up and size a scanned signature", slug: "signature-resizer" },
      { job: "Make a passport or visa photo, or a print sheet of them", slug: "passport-photo" },
      { job: "Cut an image to square, 4:5 or 16:9", slug: "crop-image" },
      { job: "Convert between JPG, PNG and WebP", slug: "image-converter" },
      { job: "Add a caption, Hindi text or a date stamp to a photo", slug: "add-text-to-photo" },
    ],
    faq: [
      {
        question: "What is the difference between resizing and compressing?",
        answer:
          "Resizing changes the number of pixels, for example 3000 × 4000 to 200 × 230. Compressing keeps the pixels but stores them in fewer kilobytes. Forms usually ask for both, which is why the exam photo resizer does both in one step.",
      },
      {
        question: "Why does the form say my 20 KB photo is too big?",
        answer:
          "Some portals count 1 KB as 1,000 bytes and others as 1,024 bytes, so a file your computer shows as 20 KB (20,480 bytes) is 20.5 KB to a portal that counts in thousands. The tools here count an upper limit in 1,000-byte KB, the stricter of the two, so the file passes either way.",
      },
      privacy,
    ],
  },
  calculators: {
    about: [
      "These calculators answer money and everyday questions with the rules that apply in India today: EMI on a home, car or personal loan, income tax under the new and old regimes, GST with the CGST and SGST split, returns on SIP, FD and PPF, gratuity, HRA exemption, and BMI with both WHO and Asian ranges.",
      "Each one shows its working, not just an answer. The loan calculator gives the full repayment schedule and what a prepayment saves; the tax calculator lists every step from gross income to cess; the BMI page has a height and weight chart. Rates and rules were checked against official and published sources, and each page states which rules it uses.",
      "Use them to understand a decision and compare options. For a final figure on tax or a loan, confirm with your bank, employer or a tax professional, because personal details can change the result.",
    ],
    choose: [
      { job: "EMI, total interest and prepayment savings on a loan", slug: "loan-calculator" },
      { job: "Home loan EMI with yearly prepayments", slug: "home-loan-emi-calculator" },
      { job: "New vs old tax regime for FY 2026-27", slug: "income-tax-calculator" },
      { job: "Add or remove GST from a price", slug: "gst-calculator" },
      { job: "What a monthly SIP grows to", slug: "sip-calculator" },
      { job: "FD maturity amount and interest", slug: "fd-calculator" },
      { job: "BMI in kg and cm or kg and feet", slug: "bmi-calculator" },
      { job: "Exact age on a date, for forms and exams", slug: "age-calculator" },
      { job: "Days or working days between two dates", slug: "date-calculator" },
    ],
    faq: [
      {
        question: "How accurate are the results?",
        answer:
          "The formulas are the standard ones banks and the tax department use, and the published examples on each page are tested against the calculator's own output. Results can still differ slightly from a bank's figure because of rounding, fees or the exact day interest starts.",
      },
      {
        question: "Are the tax and interest rates up to date?",
        answer:
          "Each calculator states the rules it uses, for example the FY 2026-27 slabs or the PPF rate for the current quarter, and they are reviewed when rules change. Where rates change daily, such as gold prices, you enter today's rate yourself.",
      },
      privacy,
    ],
  },
  "text-tools": {
    about: [
      "Writing for the web comes with limits: 150 characters for a meta description, 2,200 for an Instagram caption, 160 for a single SMS, a word count for an essay or assignment. These tools count words and characters the way those platforms do, convert text between cases, and compare two versions of a text line by line.",
      "The counters treat emoji and Hindi conjuncts as single characters, as people read them, and the character counter shows how much room is left for each common platform at once. The typing test measures net words per minute and accuracy with the standard five-characters-per-word rule used in typing exams.",
      "Text you paste here stays in your browser. That makes the tools safe for drafts, assignments and work documents.",
    ],
    choose: [
      { job: "Word count and reading time for an essay or article", slug: "word-counter" },
      { job: "Characters left for Instagram, X, YouTube or an SMS", slug: "character-counter" },
      { job: "Change text to UPPER, lower, Title or camelCase", slug: "case-converter" },
      { job: "See what changed between two versions of a text", slug: "diff-checker" },
      { job: "Check your typing speed for an exam", slug: "typing-test" },
    ],
    faq: [
      {
        question: "Why do different tools give different word counts?",
        answer:
          "They disagree on hyphenated words, numbers and symbols. This counter uses your browser's built-in Unicode word rules, which count well-known as two words and handle Hindi and other scripts correctly. Microsoft Word counts well-known as one, so its total can be slightly lower.",
      },
      {
        question: "How is typing speed calculated?",
        answer:
          "Every five characters typed count as one word. Gross (raw) speed counts everything you typed; net speed subtracts errors. Check your exam's notification for which one it uses and the passage length.",
      },
      privacy,
    ],
  },
  converters: {
    about: [
      "Converters for the numbers and data formats that come up every day: height in feet and inches to centimetres, land in gaj, square feet and acres, temperatures, data sizes, and data formats like CSV, YAML and JSON.",
      "The unit converter shows a value in every unit of its kind at once, so one entry answers several questions. The height converter handles the most common confusion in height, where “5.8 feet” is often meant as 5 ft 8 in, by showing both readings. Indian land units with a fixed size everywhere, such as gaj and guntha, are included; units like bigha that vary by state are left out on purpose.",
      "CSV to JSON turns numbers and true or false values into real JSON numbers and booleans, and the YAML converter reports errors with their line and column.",
    ],
    choose: [
      { job: "Height in feet and inches to cm, or cm to feet", slug: "feet-to-cm" },
      { job: "Length, weight, area, volume, speed or temperature", slug: "unit-converter" },
      { job: "Spreadsheet rows (CSV) to JSON", slug: "csv-to-json" },
      { job: "YAML config to JSON, or JSON back to YAML", slug: "yaml-to-json" },
    ],
    faq: [
      {
        question: "How many centimetres are in a foot?",
        answer: "Exactly 30.48 cm, because an inch is defined as 2.54 cm and a foot has 12 inches.",
      },
      {
        question: "Why is bigha not in the unit converter?",
        answer:
          "Because its size depends on the state, and sometimes the district. A conversion that is right in one place would be wrong in another. Use the area figure from your land record in square feet, gaj or acres instead.",
      },
      privacy,
    ],
  },
  generators: {
    about: [
      "Generators for things you need on demand: a strong password, a QR code for a link, Wi-Fi network or UPI payment, unique IDs for software, placeholder text for a design, and rent receipts for claiming HRA.",
      "Passwords and UUIDs come from your browser's cryptographic random number generator, the same source security software uses. QR codes download as PNG for printing or SVG for designs, and the UPI QR code follows the NPCI payment link format, so any UPI app can scan it. Rent receipts come as a printable PDF with the amount in words and a revenue stamp box where one is needed.",
      "Nothing you generate is stored or sent: passwords especially should never come from a site that could keep a copy.",
    ],
    choose: [
      { job: "A strong random password", slug: "password-generator" },
      { job: "A QR code for a website or Wi-Fi network", slug: "qr-code-generator" },
      { job: "A QR code that takes UPI payments", slug: "upi-qr-code-generator" },
      { job: "Monthly rent receipts for HRA", slug: "rent-receipt-generator" },
      { job: "Unique IDs (UUID v4 or v7) for software", slug: "uuid-generator" },
      { job: "Placeholder text for a layout", slug: "lorem-ipsum" },
    ],
    faq: [
      {
        question: "How long should a password be?",
        answer:
          "At least 14 characters for important accounts, with a mix of letters, numbers and symbols, and a different password for every site. A password manager makes that practical.",
      },
      {
        question: "Do the QR codes expire?",
        answer:
          "No. They hold the link or details directly, with no redirect through another server, so they keep working as long as the link itself does.",
      },
      {
        question: "Is it safe to print my UPI QR code at a shop counter?",
        answer:
          "Yes. It holds only your UPI ID, your name and, if you set one, an amount. Anyone who scans it can send you money but cannot take any. Ask customers to check that your name appears in their UPI app before they pay.",
      },
      privacy,
    ],
  },
  "web-design-tools": {
    about: [
      "Tools for colour work on websites and apps: convert colours between HEX, RGB, HSL, HSV and CMYK, check whether text on a background is readable, and build CSS gradients visually.",
      "The colour converter shows the contrast ratio against white and black text and whether it passes the WCAG AA and AAA levels used in accessibility guidelines, so you can pick readable combinations from the start. The gradient generator builds linear, radial and conic gradients and gives you the CSS to copy.",
      "Both tools run in your browser, so they work offline once the page has loaded.",
    ],
    choose: [
      { job: "Convert a HEX code to RGB, HSL or CMYK", slug: "color-converter" },
      { job: "Check text contrast for accessibility", slug: "color-converter" },
      { job: "Build a CSS gradient and copy the code", slug: "gradient-generator" },
    ],
    faq: [
      {
        question: "What contrast ratio does text need?",
        answer:
          "WCAG AA asks for at least 4.5:1 for normal text and 3:1 for large text; AAA asks for 7:1 and 4.5:1. The colour converter shows the ratio and which levels pass.",
      },
      {
        question: "Why does a colour look different in print?",
        answer:
          "Screens mix red, green and blue light; printers mix cyan, magenta, yellow and black ink, which cannot reproduce every screen colour. The CMYK values here are a starting point; your printer's colour profile decides the final result.",
      },
      {
        question: "Do CSS gradients work in every browser?",
        answer:
          "Linear and radial gradients work in every browser in use today. Conic gradients need a browser from 2020 or later (Chrome 69, Safari 12.1, Firefox 83 and newer), which covers almost all visitors; add a plain background colour first as a fallback for the rest.",
      },
      privacy,
    ],
  },
};
