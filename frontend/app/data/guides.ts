/**
 * Long-form guides: original articles that explain the problems the tools
 * solve. Figures come from the same engines and presets the tools use
 * (tools/engine/*), so a guide and its tool always agree. When a rule
 * changes (tax slabs, form specs), update the engine and the guide together.
 */

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "table"; caption: string; head: string[]; rows: string[][] }
  | { type: "note"; text: string };

export type GuideSection = { id: string; heading: string; blocks: GuideBlock[] };

export type Guide = {
  slug: string;
  /** H1 and card title. */
  title: string;
  /** <title>, under 60 characters. */
  metaTitle: string;
  /** Meta description and card summary, 140–160 characters. */
  description: string;
  topic: "Forms and uploads" | "Money and tax";
  /** ISO date of the last content review. */
  updated: string;
  intro: string[];
  sections: GuideSection[];
  /** Slugs of tools or landing pages used in the guide, most relevant first. */
  tools: string[];
};

const p = (text: string): GuideBlock => ({ type: "p", text });
const list = (items: string[], ordered = false): GuideBlock => ({ type: "list", items, ordered });
const note = (text: string): GuideBlock => ({ type: "note", text });

export const guides: Guide[] = [
  {
    slug: "exam-photo-signature-size",
    title: "Photo and Signature Size for Exam Forms in 2026: IBPS, SBI, SSC, UPSC, GDS and PAN",
    metaTitle: "Photo and Signature Size for Exam Forms (2026 Guide)",
    description:
      "Pixel size and KB limits for photos, signatures and thumb impressions on IBPS, SBI, SSC, UPSC, India Post GDS and PAN forms, and how to meet them on a phone.",
    topic: "Forms and uploads",
    updated: "2026-11-11",
    intro: [
      "Most online application forms in India reject an upload for one of three reasons: the file is too big, it is too small, or its pixel size is wrong. The rules differ from one recruiting body to the next, and they are buried in long PDF notifications.",
      "This guide collects the common specifications in one table, explains what each number means, and shows a reliable way to produce a file that passes the first time. Specifications change with each notification, so always compare them with the official notice for your exam before you upload.",
    ],
    sections: [
      {
        id: "sizes",
        heading: "Common photo and signature sizes",
        blocks: [
          {
            type: "table",
            caption: "Upload specifications used by our Exam Photo & Signature Resizer (checked October 2026)",
            head: ["Form", "Upload", "Pixel size", "File size"],
            rows: [
              ["IBPS, SBI, RBI, RRB bank exams", "Photo", "200 × 230 px", "20–50 KB"],
              ["IBPS, SBI, RBI, RRB bank exams", "Signature", "140 × 60 px", "10–20 KB"],
              ["IBPS, SBI, RBI, RRB bank exams", "Left thumb impression", "240 × 240 px", "20–50 KB"],
              ["IBPS, SBI, RBI, RRB bank exams", "Handwritten declaration", "800 × 400 px", "50–100 KB"],
              ["SSC (CGL, CHSL, MTS, GD)", "Signature", "4 × 2 cm (about 280 × 140 px)", "10–20 KB"],
              ["UPSC", "Photo", "350 × 450 px works well", "20–200 KB"],
              ["UPSC", "Signature (three, one below the other)", "350 × 500 px works well", "20–100 KB"],
              ["India Post GDS", "Photo", "320 × 400 px", "30–100 KB"],
              ["India Post GDS", "Signature", "300 × 120 px", "20–100 KB"],
              ["PAN card (online)", "Photo", "3.5 × 2.5 cm", "up to 20 KB"],
              ["PAN card (online)", "Signature", "2 × 4.5 cm", "up to 10 KB"],
            ],
          },
          p("SSC now captures the candidate's photo live through its own portal, so for SSC exams only the signature is uploaded. PAN portals (Protean and UTIITSL) word their limits slightly differently; the table uses the stricter one."),
        ],
      },
      {
        id: "read-the-numbers",
        heading: "What the numbers mean",
        blocks: [
          p("A specification has two independent parts. The pixel size (for example 200 × 230 px) is the shape and resolution of the picture. The file size (for example 20–50 KB) is how many bytes the saved file takes. Resizing a photo to the right pixels does not guarantee the right file size: two photos of exactly 200 × 230 px can differ in size by several times, depending on the background, lighting and JPEG quality."),
          p("Sizes given in centimetres are print sizes. The portal still checks pixels and bytes; centimetre sizes mainly fix the shape (3.5 × 2.5 cm is a portrait rectangle), so crop to that ratio and let the KB limit decide the rest."),
          p("A minimum size matters too. A 4 KB signature fails a 10–20 KB rule just as surely as a 40 KB one. Forms use minimums to block blank or unreadable scans, so a tiny file is usually rejected automatically."),
        ],
      },
      {
        id: "how-to",
        heading: "How to make a photo that passes",
        blocks: [
          list(
            [
              "Take the photo in daylight facing a window, against a plain white or light wall. Shadows and busy backgrounds make the file bigger and the face harder to see.",
              "Hold the phone at eye level, about an arm's length away, and leave some space above the head.",
              "Open the Exam Photo & Signature Resizer, pick your exam and upload type, and choose the photo.",
              "Adjust the crop so the face fills about 70–80% of the height, as on a passport photo.",
              "Download the JPG and check the size and dimensions shown under the result before uploading.",
            ],
            true,
          ),
          p("The resizer crops to the exact pixel size, then searches for the highest JPEG quality that stays under the maximum. If the result would fall below the minimum, it adds harmless padding inside the file so the portal's size check passes without changing the picture."),
        ],
      },
      {
        id: "signature",
        heading: "Getting the signature right",
        blocks: [
          list([
            "Sign on plain white paper with a black ink pen. Blue ballpoint often scans grey and faint.",
            "Sign in your normal running hand. Bank exam notices say signatures in capital letters are not accepted.",
            "Photograph it from directly above in good light, with no shadow from the phone across the paper.",
            "Use the Signature Resizer: it trims the empty paper around the ink, turns the paper pure white and fits the file into the KB range.",
          ]),
          note("For UPSC, the signature upload is one image with three signatures, one below the other, on a single sheet. Sign three times before you photograph it."),
        ],
      },
      {
        id: "common-errors",
        heading: "Common upload errors and fixes",
        blocks: [
          list([
            "“File size should be between 20 KB and 50 KB”: the file is outside the range. Process it again with the right preset rather than compressing it twice by hand.",
            "“Invalid file format”: most portals want .jpg or .jpeg. Photos from iPhones are often HEIC; the tools save JPG.",
            "“Image dimensions are not proper”: the pixel size is wrong. Use the preset for your exam, not a general resize.",
            "The photo uploaded but looks stretched in the preview: the original was cropped to the wrong shape. Crop to the form's ratio first; never stretch.",
          ]),
        ],
      },
    ],
    tools: ["exam-photo-resizer", "signature-resizer", "ibps-photo-signature-resizer", "pan-card-photo-resizer", "upsc-photo-resizer", "india-post-gds-photo-resizer"],
  },
  {
    slug: "compress-photo-for-online-forms",
    title: "How to Reduce a Photo to 20 KB or 50 KB Without Making It Blurry",
    metaTitle: "Reduce Photo Size to 20 KB or 50 KB Without Blur",
    description:
      "Why phone photos are 2–5 MB, what actually makes a JPEG small, and a step-by-step way to get under 20, 50 or 100 KB while keeping the face sharp.",
    topic: "Forms and uploads",
    updated: "2026-11-11",
    intro: [
      "A photo straight from a phone camera is usually 2 to 5 MB. Government and exam portals often accept only 20, 50 or 100 KB, which is 50 to 200 times smaller. Getting there by lowering the quality slider in a photo app usually ends in a blocky, smeared face.",
      "The trick is to remove what the form does not need before touching quality. This guide explains what makes a JPEG big and the order of steps that keeps a small file looking clean.",
    ],
    sections: [
      {
        id: "what-makes-big",
        heading: "What makes a photo file big",
        blocks: [
          p("Three things decide the size of a JPEG: the number of pixels, the amount of detail in those pixels, and the quality setting used when saving it. A 12-megapixel phone photo has about 4000 × 3000 pixels. A bank exam photo needs 200 × 230. That is roughly 260 times fewer pixels, and most of the size disappears in that step alone."),
          p("Detail matters next. A plain white wall compresses to almost nothing; leaves, patterned curtains or a crowded room behind you cost bytes that the form does not care about. Noise from low light behaves like detail too, which is why dim indoor photos are hard to shrink."),
          p("Quality comes last. JPEG quality between about 70 and 90 is hard to tell apart at small sizes. Below about 40, blocks and colour smudges appear, especially on skin."),
        ],
      },
      {
        id: "order",
        heading: "The order that works",
        blocks: [
          list(
            [
              "Crop to what the form needs: head and shoulders for a photo, just the ink for a signature. Cropping throws away pixels without any loss of quality in what remains.",
              "Resize to the pixel size the form asks for, or to a sensible size if it gives none: 300–400 px wide for a passport-style photo, 1000–1200 px for a scanned document.",
              "Only then lower JPEG quality, step by step, until the file is under the limit.",
              "If the highest quality that fits is still very low, go back and make the image a little smaller instead.",
            ],
            true,
          ),
          p("Our Compress Image tool follows this order in Target size mode. It measures the real file after each attempt, keeps the highest quality that fits, and reduces dimensions only if quality alone cannot reach the target."),
        ],
      },
      {
        id: "sizes",
        heading: "What each target size can hold",
        blocks: [
          {
            type: "table",
            caption: "Rough guide for a JPEG with a plain background",
            head: ["Target", "Good for", "Typical size that still looks sharp"],
            rows: [
              ["10 KB", "Signatures, tiny thumbnails", "200–300 px on the long side"],
              ["20 KB", "Signatures, small ID photos", "250–350 px wide"],
              ["50 KB", "Passport-size photos for most forms", "350–450 px wide at high quality"],
              ["100 KB", "Scanned certificates, ID cards", "1000–1200 px wide"],
              ["200 KB", "Mark sheets, full-page documents", "Most phone photos at full width"],
            ],
          },
          p("These are starting points, not rules. A photo against a busy background can need twice the bytes of the same face against a white wall."),
        ],
      },
      {
        id: "mistakes",
        heading: "Mistakes that make results worse",
        blocks: [
          list([
            "Compressing an already compressed file again and again. Each pass adds new artefacts. Start from the original photo every time.",
            "Taking a screenshot of the photo to make it smaller. Screenshots are PNG files, often bigger than the JPEG, and they include phone borders.",
            "Saving as PNG for a size limit. PNG has no quality setting, so it cannot be squeezed to a target. Use JPG for photos.",
            "Ignoring transparency. A PNG logo or cut-out saved as JPG gets a solid background; our tool makes it white, which is what forms expect.",
          ]),
        ],
      },
      {
        id: "privacy",
        heading: "Is it safe to compress ID photos online?",
        blocks: [
          p("Many compression sites upload your file to their server, process it there and send it back. For a photo used on identity documents, that is a copy you no longer control. The tools on AllToolsDesk run inside your browser: the photo is read and compressed on your own phone or computer, and nothing is sent to us. You can check this by switching to flight mode after the page loads; the tool keeps working."),
        ],
      },
    ],
    tools: ["compress-image-to-50kb", "compress-image-to-20kb", "compress-image-to-100kb", "compress-image", "crop-image", "resize-image"],
  },
  {
    slug: "kb-vs-kib-file-size",
    title: "Why Your “50 KB” File Gets Rejected: KB vs KiB Explained",
    metaTitle: "Why a 50 KB File Gets Rejected: KB vs KiB Explained",
    description:
      "Windows, Mac and upload portals count kilobytes differently. Learn why a file that shows 49 KB can still fail a 50 KB limit, and how to stay safe.",
    topic: "Forms and uploads",
    updated: "2026-11-11",
    intro: [
      "You compress a photo, your computer says 49 KB, and the portal still says the file is larger than 50 KB. Or the reverse: a form says the file is too small when it looks fine. Often nothing is wrong with the photo. The two sides are counting kilobytes differently.",
    ],
    sections: [
      {
        id: "two-kilobytes",
        heading: "Two kinds of kilobyte",
        blocks: [
          p("A kilobyte can mean 1,000 bytes (the decimal kilobyte, KB) or 1,024 bytes (the binary kibibyte, KiB). Both are in everyday use, and most software just writes “KB” for either."),
          {
            type: "table",
            caption: "The same file, counted two ways",
            head: ["File size in bytes", "In KB (1,000)", "In KiB (1,024)"],
            rows: [
              ["50,000", "50.0", "48.8"],
              ["51,000", "51.0", "49.8"],
              ["51,200", "51.2", "50.0"],
              ["20,000", "20.0", "19.5"],
            ],
          },
          p("A 51,000-byte file passes a portal that divides by 1,024 (49.8) and fails one that divides by 1,000 (51.0). Windows File Explorer divides by 1,024 and labels the result KB; macOS Finder divides by 1,000. So the same file can show different numbers on two computers."),
        ],
      },
      {
        id: "rounding",
        heading: "Rounding makes it worse",
        blocks: [
          p("File managers also round. Windows Explorer's Size column rounds up to the next whole kilobyte, so a file of 49.1 KiB shows as 50 KB. Some portals round down, some compare exact bytes. A file within a few hundred bytes of the limit can pass on one day's portal and fail after an update."),
        ],
      },
      {
        id: "safe-rule",
        heading: "A simple rule that always passes",
        blocks: [
          list([
            "For a maximum, count 1 KB as 1,000 bytes. A file under 50,000 bytes is under 50 KB by either definition.",
            "For a minimum, count 1 KB as 1,024 bytes. A file over 20,480 bytes is over 20 KB by either definition.",
            "Check the exact size in bytes: Properties on Windows, Get Info on a Mac, or the size shown under each result in our tools.",
          ]),
          p("Our KB tools apply exactly this rule. Compress Image to 50 KB keeps files at or under 50,000 bytes, and the exam photo presets pad files that would otherwise fall below 1,024 bytes per kilobyte of the stated minimum."),
          note("The same confusion exists for megabytes: 1 MB is 1,000,000 bytes, while 1 MiB is 1,048,576 bytes. For a 1 MB limit, stay under 1,000,000 bytes."),
        ],
      },
      {
        id: "check-exact-size",
        heading: "How to see the exact size in bytes",
        blocks: [
          list([
            "Windows: right-click the file, choose Properties, and read the first number on the Size line, in bytes. Ignore “Size on disk”, which depends on the drive, not the file.",
            "Mac: select the file and press Command + I. Get Info shows the size in bytes in brackets.",
            "Android: most file manager apps show details or properties for a file; some round to one decimal place, so check bytes where the app offers them.",
            "iPhone: in the Files app, long-press the file and choose Get Info.",
          ]),
          p("If the size is within about 2% of the limit, assume it might fail and make the file a little smaller. The difference in quality between a 49 KB and a 47 KB photo is invisible, while a rejection costs you another attempt and sometimes a session timeout on the portal."),
        ],
      },
    ],
    tools: ["compress-image-to-50kb", "compress-image-to-20kb", "exam-photo-resizer", "compress-pdf"],
  },
  {
    slug: "reduce-pdf-size-for-upload",
    title: "How to Reduce PDF Size for Online Form Uploads",
    metaTitle: "How to Reduce PDF Size for Online Form Uploads",
    description:
      "Why scanned PDFs are so large, how to scan smaller in the first place, and how to get a certificate or ID under 100 KB, 200 KB or 500 KB without losing readability.",
    topic: "Forms and uploads",
    updated: "2026-11-11",
    intro: [
      "Admission, scholarship and recruitment portals often limit document uploads to 100 KB, 200 KB or 500 KB. A two-page certificate scanned on a phone can easily be 3 MB. This guide covers why that happens and the steps that reliably bring a PDF under the limit while keeping it readable.",
    ],
    sections: [
      {
        id: "why-big",
        heading: "Why scanned PDFs are big",
        blocks: [
          p("A PDF made in a word processor stores text as letters and fonts, so a page takes a few kilobytes. A scanned PDF stores each page as a photograph. At full phone-camera resolution, every page is a multi-megabyte image, even when it holds three lines of text."),
          p("That is why ‘compress PDF’ tools work so differently on the two kinds of file. A text PDF has little to remove. A scanned PDF can shrink dramatically, because the page images can be made smaller and saved at a lower quality."),
        ],
      },
      {
        id: "scan-smaller",
        heading: "Scan smaller in the first place",
        blocks: [
          list([
            "Use a scanning mode (most phone camera and notes apps have one). It flattens the page and crops it to the edges.",
            "Choose black and white or greyscale for text documents. Colour triples the data for no gain on a printed certificate.",
            "If your scanner asks for a resolution, 150–200 DPI is plenty for reading. 300 DPI and above is for printing.",
            "Scan only the pages the form asks for. Remove blank backs and covers before uploading.",
          ]),
        ],
      },
      {
        id: "compress",
        heading: "Compress to an exact size",
        blocks: [
          list(
            [
              "Open Compress PDF and choose your file. It stays on your device.",
              "Pick the target size the portal asks for: 100 KB, 200 KB, 500 KB or 1 MB.",
              "The tool first tries normal compression. If that is not enough, it re-draws each page as an image at falling quality until the whole file fits.",
              "Open the result and zoom in on the smallest text before you upload it.",
            ],
            true,
          ),
          note("When pages are re-drawn as images, the text is no longer selectable or searchable. That is fine for an upload portal, which only needs a readable copy, but keep the original for your own records."),
        ],
      },
      {
        id: "still-too-big",
        heading: "If it is still too big",
        blocks: [
          list([
            "Remove pages: use Delete PDF Pages, or Organize PDF to keep just the ones needed.",
            "Split a long document and upload the parts the form asks for separately, if it allows several files.",
            "Crop wide margins from scans before making the PDF; empty paper still costs bytes.",
            "For a single-page document, try saving it as a JPG under the limit instead, if the portal accepts images.",
          ]),
        ],
      },
      {
        id: "before-upload",
        heading: "Check before you upload",
        blocks: [
          p("Portals rarely let you preview an uploaded document properly, and some lock the application once it is submitted. Before uploading, open the compressed PDF on your phone and read every page at normal zoom: names, dates, roll numbers, marks and stamps must all be legible. A certificate that is under 200 KB but unreadable can get an application rejected at the verification stage, weeks later."),
          p("Also check the page order and orientation. A sideways page is harder to read once compressed; rotate it before compressing rather than after."),
        ],
      },
    ],
    tools: ["compress-pdf", "compress-pdf-to-100kb", "compress-pdf-to-200kb", "delete-pdf-pages", "organize-pdf", "image-to-pdf"],
  },
  {
    slug: "old-vs-new-tax-regime-2026-27",
    title: "Old vs New Tax Regime for FY 2026-27: Worked Examples",
    metaTitle: "Old vs New Tax Regime FY 2026-27: Worked Examples",
    description:
      "The FY 2026-27 slabs for both regimes, the ₹12 lakh rebate, and three salary examples worked out in full, so you can see which regime saves more for you.",
    topic: "Money and tax",
    updated: "2026-11-11",
    intro: [
      "Every salaried taxpayer in India chooses between two ways of calculating income tax. The new regime has lower rates and almost no deductions. The old regime has higher rates but lets you subtract investments, insurance, rent and home loan interest. Which one is cheaper depends entirely on how much you can deduct.",
      "Budget 2026 kept the rates from the previous year, so the figures below apply to income earned from 1 April 2026 to 31 March 2027. The Income-tax Act, 2025 took effect on the same date and renumbered most sections (the old 80C deduction is now section 123, with the same ₹1.5 lakh limit), but the familiar names are used here because that is still how employers and investment proofs refer to them.",
    ],
    sections: [
      {
        id: "slabs",
        heading: "Tax slabs for FY 2026-27",
        blocks: [
          {
            type: "table",
            caption: "New regime (default)",
            head: ["Taxable income", "Rate"],
            rows: [
              ["Up to ₹4,00,000", "Nil"],
              ["₹4,00,001 – ₹8,00,000", "5%"],
              ["₹8,00,001 – ₹12,00,000", "10%"],
              ["₹12,00,001 – ₹16,00,000", "15%"],
              ["₹16,00,001 – ₹20,00,000", "20%"],
              ["₹20,00,001 – ₹24,00,000", "25%"],
              ["Above ₹24,00,000", "30%"],
            ],
          },
          {
            type: "table",
            caption: "Old regime (below 60 years)",
            head: ["Taxable income", "Rate"],
            rows: [
              ["Up to ₹2,50,000", "Nil"],
              ["₹2,50,001 – ₹5,00,000", "5%"],
              ["₹5,00,001 – ₹10,00,000", "20%"],
              ["Above ₹10,00,000", "30%"],
            ],
          },
          p("Both regimes add 4% health and education cess on the tax. Salaried people get a standard deduction of ₹75,000 in the new regime and ₹50,000 in the old one."),
        ],
      },
      {
        id: "rebate",
        heading: "The ₹12 lakh rebate",
        blocks: [
          p("In the new regime, if taxable income is ₹12 lakh or less, a rebate of up to ₹60,000 cancels the tax completely. With the ₹75,000 standard deduction, a salary of up to ₹12.75 lakh pays no income tax. Just above that line, marginal relief makes sure the tax is never more than the income above ₹12 lakh."),
          p("The old regime's rebate is much smaller: up to ₹12,500, for taxable income of ₹5 lakh or less."),
        ],
      },
      {
        id: "examples",
        heading: "Three worked examples",
        blocks: [
          p("All three people are under 60, earn only salary, and have no capital gains. Figures are from our Income Tax Calculator."),
          {
            type: "table",
            caption: "Tax payable including 4% cess",
            head: ["", "Salary", "Deductions in old regime", "New regime", "Old regime"],
            rows: [
              ["Anita", "₹12,75,000", "—", "₹0", "—"],
              ["Rahul", "₹15,00,000", "₹2,25,000 (80C ₹1.5 lakh, 80D ₹25,000, NPS ₹50,000)", "₹97,500", "₹1,87,200"],
              ["Priya", "₹15,00,000", "₹6,05,000 (Rahul's, plus HRA ₹1.8 lakh and home loan interest ₹2 lakh)", "₹97,500", "₹84,760"],
            ],
          },
          p("Rahul in the new regime: ₹15,00,000 − ₹75,000 = ₹14,25,000 taxable. Tax is 5% of ₹4 lakh (₹20,000) + 10% of ₹4 lakh (₹40,000) + 15% of ₹2.25 lakh (₹33,750) = ₹93,750, plus 4% cess = ₹97,500."),
          p("Rahul in the old regime: ₹15,00,000 − ₹50,000 − ₹2,25,000 = ₹12,25,000 taxable. Tax is 5% of ₹2.5 lakh (₹12,500) + 20% of ₹5 lakh (₹1,00,000) + 30% of ₹2.25 lakh (₹67,500) = ₹1,80,000, plus cess = ₹1,87,200. The new regime saves him ₹89,700."),
          p("Priya has the same salary but pays rent and a home loan. Her old-regime taxable income falls to ₹8,45,000, and her tax to ₹84,760, which is ₹12,740 less than the new regime."),
        ],
      },
      {
        id: "rule-of-thumb",
        heading: "A quick way to decide",
        blocks: [
          list([
            "If your salary is ₹12.75 lakh or less, the new regime costs nothing in tax. Choose it.",
            "If your only deductions are 80C and a health insurance premium, the new regime almost always wins.",
            "The old regime starts to win when large HRA exemption and home loan interest are added on top of 80C. For a ₹15 lakh salary, deductions other than the standard deduction need to exceed about ₹5.4 lakh.",
            "Salaried people can switch every year. Tell your employer at the start of the year, and you can still change the choice when filing your return.",
          ]),
          note("This guide is general information, not tax advice. Surcharge applies above ₹50 lakh, and capital gains, business income and senior-citizen slabs follow different rules. Check your own figures in the calculator, and with a tax professional for complex cases."),
        ],
      },
    ],
    tools: ["income-tax-calculator", "hra-calculator", "ppf-calculator", "sip-calculator"],
  },
  {
    slug: "hra-exemption-calculation",
    title: "HRA Exemption: How It Is Calculated, With an Example",
    metaTitle: "HRA Exemption Calculation Explained With Example",
    description:
      "The three-way rule that decides how much of your house rent allowance is tax-free, which cities count as metro from April 2026, and a worked example.",
    topic: "Money and tax",
    updated: "2026-11-11",
    intro: [
      "House rent allowance is part of many salary slips, but only some of it is tax-free, and only if you pay rent and choose the old tax regime. The tax-free part is the smallest of three amounts. Once you see the three side by side, the rule is easy to apply.",
    ],
    sections: [
      {
        id: "rule",
        heading: "The rule",
        blocks: [
          p("Exempt HRA is the least of:"),
          list(
            [
              "The HRA you actually received from your employer in the year.",
              "Rent paid in the year, minus 10% of your salary.",
              "50% of salary if you live in one of the eight listed cities, or 40% anywhere else.",
            ],
            true,
          ),
          p("“Salary” here means basic pay plus dearness allowance (where DA counts for retirement benefits) plus any commission fixed as a percentage of turnover. It does not include HRA itself, bonus or other allowances."),
          p("From 1 April 2026, the 50% cities are Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune and Ahmedabad. Before that, only the first four counted as metros."),
        ],
      },
      {
        id: "example",
        heading: "Worked example",
        blocks: [
          p("Ravi works in Pune. His basic pay plus DA is ₹50,000 a month (₹6,00,000 a year), his HRA is ₹20,000 a month (₹2,40,000 a year), and he pays rent of ₹20,000 a month (₹2,40,000 a year)."),
          {
            type: "table",
            caption: "Ravi's three amounts for the year",
            head: ["Test", "Calculation", "Amount"],
            rows: [
              ["HRA received", "₹20,000 × 12", "₹2,40,000"],
              ["Rent minus 10% of salary", "₹2,40,000 − ₹60,000", "₹1,80,000"],
              ["50% of salary (Pune)", "50% of ₹6,00,000", "₹3,00,000"],
            ],
          },
          p("The smallest is ₹1,80,000, so that much HRA is tax-free and the remaining ₹60,000 is taxed as salary. In this case the rent test decides the answer, which is common: the exemption grows with the rent you pay, until it reaches the HRA you receive."),
          p("Now suppose Ravi lived in Jaipur instead and paid ₹12,000 a month. Rent minus 10% of salary is ₹1,44,000 − ₹60,000 = ₹84,000, and 40% of salary is ₹2,40,000. Only ₹84,000 of his ₹2,40,000 HRA would be exempt. The lower the rent compared with salary, the less the HRA saves."),
        ],
      },
      {
        id: "no-hra",
        heading: "If you pay rent but get no HRA",
        blocks: [
          p("Self-employed people and employees whose salary has no HRA component can still claim a smaller deduction for rent in the old regime, known for years as section 80GG. It is the least of ₹5,000 a month, 25% of total income, or rent paid minus 10% of total income, and it is not available if you, your spouse or your minor child own a home in the same city. In the new regime, neither HRA nor this deduction is available."),
        ],
      },
      {
        id: "practical",
        heading: "Practical points",
        blocks: [
          list([
            "HRA exemption exists only in the old regime. In the new regime, all HRA is taxable.",
            "Keep rent receipts. Employers usually ask for them, and for the landlord's PAN when yearly rent is above ₹1 lakh.",
            "Paying rent to a parent is allowed if they really own the home and declare the rent as their income. Paying rent to a spouse is generally not accepted.",
            "If you moved city or your rent changed during the year, work out each period separately and add them up.",
          ]),
        ],
      },
    ],
    tools: ["hra-calculator", "rent-receipt-generator", "income-tax-calculator"],
  },
  {
    slug: "home-loan-prepayment-emi-or-tenure",
    title: "Home Loan Prepayment: Reduce the EMI or the Tenure?",
    metaTitle: "Home Loan Prepayment: Reduce EMI or Tenure?",
    description:
      "A ₹50 lakh home loan example showing how much interest a ₹5 lakh prepayment saves when you cut the tenure versus the EMI, and when each choice makes sense.",
    topic: "Money and tax",
    updated: "2026-11-11",
    intro: [
      "When you make a part-prepayment on a home loan, the bank asks one question: should the monthly EMI go down, or should the loan finish sooner? The choice changes how much interest you save, often by lakhs of rupees.",
    ],
    sections: [
      {
        id: "example",
        heading: "The example loan",
        blocks: [
          p("Take a ₹50 lakh home loan at 8.5% a year for 20 years. The EMI is ₹43,391, and over 20 years you would pay ₹54.14 lakh in interest, more than the loan itself. Now suppose you prepay ₹5 lakh at the end of the second year, from a bonus or savings."),
          {
            type: "table",
            caption: "Effect of a ₹5 lakh prepayment after 24 months (from our EMI calculator)",
            head: ["", "No prepayment", "Reduce tenure", "Reduce EMI"],
            rows: [
              ["Monthly EMI", "₹43,391", "₹43,391", "₹38,864 after prepayment"],
              ["Loan length", "240 months", "195 months", "240 months"],
              ["Total interest", "₹54.14 lakh", "₹39.57 lakh", "₹49.36 lakh"],
              ["Interest saved", "—", "₹14.57 lakh", "₹4.78 lakh"],
            ],
          },
          p("Keeping the EMI and cutting the tenure saves three times as much interest, and the loan ends three years and nine months early."),
        ],
      },
      {
        id: "yearly",
        heading: "Small yearly prepayments add up",
        blocks: [
          p("A one-time lump sum is not the only option. On the same loan, prepaying ₹1 lakh at the end of every year while keeping the EMI unchanged clears it in 168 months instead of 240, six years early. You would prepay ₹13 lakh in total over those years and save ₹18.55 lakh in interest."),
          p("The earlier a prepayment is made, the more it saves, because in the first years most of each EMI goes to interest. A prepayment in year two removes interest that would otherwise be charged for eighteen more years."),
        ],
      },
      {
        id: "why",
        heading: "Why cutting the tenure saves more",
        blocks: [
          p("Interest is charged on the outstanding balance every month. A prepayment lowers the balance either way. If you keep paying the same EMI, the part of each EMI that goes to principal grows faster, and the balance keeps falling faster for the rest of the loan. If you lower the EMI instead, you pay the loan down at the original slower pace, just from a smaller starting point."),
        ],
      },
      {
        id: "when-emi",
        heading: "When reducing the EMI makes sense",
        blocks: [
          list([
            "Your income has fallen or is uncertain, and a lower fixed outgoing gives you breathing room.",
            "You plan to invest the monthly difference at a return clearly above the loan rate, and you will actually do it every month.",
            "You need the lower EMI to qualify for another loan.",
          ]),
          p("Many banks let you choose at each prepayment, and some let you lower the EMI later on request. If you are unsure, reducing the tenure and keeping an emergency fund is the safer default."),
        ],
      },
      {
        id: "checklist",
        heading: "Before you prepay",
        blocks: [
          list([
            "Keep six months of expenses aside first. Money paid into a loan is hard to get back.",
            "Check charges. RBI rules do not allow banks to charge a prepayment penalty on floating-rate loans taken by individuals for non-business purposes; fixed-rate loans may carry one.",
            "Compare with tax benefits. In the old regime, up to ₹2 lakh of home loan interest a year is deductible, which slightly lowers the effective rate.",
            "Get the revised schedule from the bank in writing after the prepayment.",
          ]),
        ],
      },
    ],
    tools: ["home-loan-emi-calculator", "loan-calculator", "income-tax-calculator", "fd-calculator"],
  },
  {
    slug: "gst-calculation-cgst-sgst-igst",
    title: "How to Calculate GST: Adding, Removing, and the CGST, SGST and IGST Split",
    metaTitle: "How to Calculate GST: CGST, SGST and IGST Explained",
    description:
      "The 2025 GST slabs, the formulas to add GST to a price or remove it from an inclusive one, and when a bill shows CGST and SGST instead of IGST, with examples.",
    topic: "Money and tax",
    updated: "2026-11-11",
    intro: [
      "Whether you run a shop, freelance or simply want to know how much tax is inside a price, GST comes down to two calculations and one rule about where the sale happens. This guide covers all three with numbers you can check.",
    ],
    sections: [
      {
        id: "rates",
        heading: "GST rates after September 2025",
        blocks: [
          p("Since 22 September 2025, most goods and services fall into two main slabs: 5% and 18%. A 40% rate applies to luxury and sin goods such as tobacco products and large cars. Many essentials are exempt. Gold is taxed at 3% and cut and polished diamonds at 0.25%. The earlier 12% and 28% slabs were folded into these."),
          p("The rate depends on the item's HSN code (for goods) or SAC code (for services). A calculator can do the arithmetic, but the rate for a particular product has to come from the official rate notifications."),
        ],
      },
      {
        id: "add",
        heading: "Adding GST to a price",
        blocks: [
          p("GST amount = price × rate ÷ 100. Total = price + GST."),
          p("Example: a service billed at ₹10,000 at 18%. GST = 10,000 × 18 ÷ 100 = ₹1,800. The customer pays ₹11,800."),
        ],
      },
      {
        id: "remove",
        heading: "Removing GST from an inclusive price",
        blocks: [
          p("A price that already includes GST cannot be reduced by simply taking 18% off; that gives the wrong answer. Divide instead: price before tax = inclusive price ÷ (1 + rate ÷ 100)."),
          p("Example: an item costs ₹1,180 including 18% GST. 1,180 ÷ 1.18 = ₹1,000 before tax, so the GST inside the price is ₹180. Taking 18% off ₹1,180 would give ₹967.60, which is wrong by ₹32.40."),
        ],
      },
      {
        id: "split",
        heading: "CGST and SGST, or IGST?",
        blocks: [
          p("The split depends on the place of supply, not on the rate."),
          list([
            "Seller and place of supply in the same state: the tax is split equally into CGST (to the Centre) and SGST (to the State). On the ₹10,000 example: CGST ₹900 + SGST ₹900.",
            "Seller and place of supply in different states, or an import: the full tax is IGST. On the same example: IGST ₹1,800.",
            "In union territories without a legislature, such as Chandigarh or Ladakh, UTGST takes the place of SGST.",
          ]),
          p("The total tax is identical in every case. Only the label and the government that receives it change, which matters for the seller's returns and the buyer's input tax credit."),
        ],
      },
      {
        id: "invoice",
        heading: "On an invoice",
        blocks: [
          list([
            "Show the taxable value, the rate and the tax for each line or each rate, with CGST and SGST (or IGST) in separate columns.",
            "Write the HSN or SAC code for each item, and the buyer's GSTIN for business sales.",
            "Round the final total to the nearest rupee if you wish, and show the round-off as a separate line.",
          ]),
          note("This guide explains the arithmetic. It does not cover cess, reverse charge, composition scheme rates or e-invoicing rules; check those with the GST portal or a tax professional."),
        ],
      },
    ],
    tools: ["gst-calculator", "discount-calculator", "gold-price-calculator"],
  },
];

export const guidePath = (guide: Pick<Guide, "slug">) => `/guides/${guide.slug}`;

/** Guides that use a tool or landing page, for links from its page. */
export const guidesForTool = (slug: string) => guides.filter((g) => g.tools.includes(slug));

/** "11 November 2026" */
export const formatGuideDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
