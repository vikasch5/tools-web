import type { WidgetToolDefinition } from "../types";
import { describeLevel } from "../engine/pdf-compress";
import { describeWordLayout } from "../engine/pdf-word";
import { filePrivacyFaq } from "./shared";

const lockedFaq = {
  question: "What if my PDF has a password?",
  answer:
    "Password-protected PDFs cannot be changed until the password is removed. Use Unlock PDF with the password you open it with, then come back.",
};

export const compressPdf: WidgetToolDefinition = {
  workspace: "compress-pdf",
  slug: "compress-pdf",
  category: "pdf-tools",
  name: "Compress PDF",
  metaTitle: "Compress PDF – Reduce PDF File Size, Free and Private",
  description:
    "Make a PDF smaller for email and upload forms. Photos and scans are re-encoded while text stays sharp and selectable. Runs in your browser, no upload.",
  overview: [
    "Upload forms for jobs, visas, banks and universities often cap files at 1, 2 or 5 MB, and email services reject large attachments. Most oversized PDFs are big because of their pictures: scanned pages, phone photos and high-resolution images that were never meant for the screen.",
    "This tool rebuilds the file in your browser. The lossless level only repacks its internal structure, so nothing changes visually. The Recommended and Strong levels also re-encode photos and scans as JPEG and scale down very large images, which is where the real savings are. Text, vector drawings and links are kept as they are, so the result stays crisp and searchable. If a PDF cannot be made smaller, you are told instead of being handed a larger file.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device.",
    "Pick a level: Lossless changes nothing visible, Recommended suits most files, and Strong makes the smallest file with softer photos.",
    "Press “Compress PDF”. The sizes before and after are shown.",
    "Press Download to save the smaller file, or pick another level and compress again.",
  ],
  examples: [
    { title: "The Recommended level", input: "Recommended", output: describeLevel("medium") },
    { title: "The Strong level", input: "Strong", output: describeLevel("high") },
    { title: "The Lossless level", input: "Lossless", output: describeLevel("low") },
  ],
  limitations: [
    "Savings depend on the file. PDFs that are mostly text are often small already and may shrink only a little.",
    "CMYK images, masked images and other unusual image types are left unchanged.",
    "Password-protected PDFs must be unlocked first.",
    "Up to 100 MB per file. Large scans need enough free memory and can take a minute.",
  ],
  faq: [
    {
      question: "How small will my PDF get?",
      answer:
        "Scanned documents and PDFs full of photos often shrink by half or more on the Recommended level. Text-only PDFs usually shrink much less, because text is already compact.",
    },
    {
      question: "Will the text still be selectable?",
      answer:
        "Yes. Only images are re-encoded. Text stays real text, so you can still search, select and copy it, and it prints sharply.",
    },
    {
      question: "What if the compressed file is still too big?",
      answer:
        "Try the Strong level. If that is not enough, Split PDF can break the document into smaller parts, or Delete PDF Pages can remove pages you do not need to send.",
    },
    filePrivacyFaq,
  ],
  related: ["split-pdf", "delete-pdf-pages", "compress-image", "merge-pdf"],
};

export const wordToPdf: WidgetToolDefinition = {
  workspace: "word-to-pdf",
  slug: "word-to-pdf",
  category: "pdf-tools",
  name: "Word to PDF",
  metaTitle: "Word to PDF – Convert DOCX to PDF in Your Browser",
  description:
    "Convert a Word document (.docx) to PDF with a live preview. The file is laid out on your device and saved through your browser's print to PDF. No upload.",
  overview: [
    "A PDF looks the same on every device and cannot be edited by accident, which is why CVs, applications, invoices and reports are usually sent as PDF rather than as a Word file. Converting is also the usual answer when a form says “PDF only”.",
    "This tool opens the .docx in your browser, lays out its pages with their fonts, tables, images, headers and footers, and shows you a preview. Saving uses your browser's own “Save as PDF” printer, which writes a proper PDF with real, selectable text. Your document is never uploaded. Layout is drawn by the browser rather than by Microsoft Word, so complex documents can differ in small ways; check the preview before saving.",
  ],
  howTo: [
    "Drop a .docx file onto the page or choose one from your device. A preview of the pages appears.",
    "Check the preview, then press “Save as PDF”.",
    "In the print window, choose “Save as PDF” (or “Microsoft Print to PDF” on Windows) as the printer, and save.",
  ],
  examples: [
    { title: "A document saved by Microsoft Word", input: "report.docx with saved page breaks", output: describeWordLayout(true) },
    { title: "A document exported from another app", input: "notes.docx with no saved page layout", output: describeWordLayout(false) },
  ],
  limitations: [
    "Only .docx files. Save older .doc files as .docx in Word, LibreOffice or Google Docs first.",
    "Fonts that are not installed on your device are replaced by similar ones, which can move line and page breaks.",
    "Text boxes, shapes, charts, equations and tracked changes may not appear exactly as in Word.",
    "Saving goes through the print window, so there are two clicks instead of a direct download.",
  ],
  faq: [
    {
      question: "Why does it open a print window?",
      answer:
        "Your browser's “Save as PDF” printer creates a real PDF with selectable text and embedded fonts, from the pages laid out on your device. Doing it this way means the document never has to be sent to a server.",
    },
    {
      question: "Will the PDF look exactly like Word?",
      answer:
        "Simple and medium documents (text, headings, lists, tables, pictures) usually come out very close. Complex layouts and missing fonts can shift things, so the preview shows the pages before you save.",
    },
    {
      question: "Can I convert on my phone?",
      answer:
        "Yes. Android's print window offers “Save as PDF”. On iPhone or iPad, tap the share button in the print options and choose Save to Files.",
    },
    filePrivacyFaq,
  ],
  related: ["pdf-to-word", "merge-pdf", "compress-pdf", "image-to-pdf"],
};

export const pdfToWord: WidgetToolDefinition = {
  workspace: "pdf-to-word",
  slug: "pdf-to-word",
  category: "pdf-tools",
  name: "PDF to Word",
  metaTitle: "PDF to Word – Convert PDF Text to an Editable DOCX",
  description:
    "Turn a PDF's text into an editable Word document, with headings, paragraphs and lists rebuilt. Works in your browser; your file is never uploaded.",
  overview: [
    "A PDF is built for reading and printing, not editing. When you need to update an old document, reuse text from a report, or fill in something sent as PDF, getting its words into Word is usually the quickest way.",
    "This tool reads the text of each page in your browser and rebuilds it as a .docx: lines are joined back into paragraphs, larger text becomes headings, bulleted and numbered lines become list items, and bold and italic are kept. Each PDF page starts a new Word page. It concentrates on getting the words out cleanly rather than copying the exact layout, so columns, tables and images are not recreated, and scanned PDFs without real text cannot be converted.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device.",
    "Press “Convert to Word”. Each page is read in turn.",
    "The .docx downloads when it is ready. Open it in Word, Google Docs or LibreOffice.",
  ],
  examples: [
    {
      title: "A title, a wrapped paragraph and a list",
      input: "[20pt] Annual report\nThis year the team shipped 42 tools\nacross five categories.\n\n• Faster pages\n• Private by design",
      output:
        "Heading 1: Annual report\nParagraph: This year the team shipped 42 tools across five categories.\nList item: • Faster pages\nList item: • Private by design",
    },
  ],
  limitations: [
    "Text only: images, tables, columns, text boxes and exact positions are not recreated.",
    "Scanned PDFs or photos of pages have no real text and need OCR (text recognition), which this tool does not do.",
    "Password-protected PDFs must be unlocked first.",
    "A word split with a hyphen at the end of a line is joined back together, which also joins a few real hyphenated words split across lines.",
  ],
  faq: [
    {
      question: "Why are the tables and images missing?",
      answer:
        "A PDF stores text as positioned pieces, without knowing which pieces form a table or a column. This tool rebuilds the reading order and paragraphs reliably and leaves out what it cannot rebuild faithfully, rather than producing a jumble.",
    },
    {
      question: "My PDF converted to an empty document. Why?",
      answer:
        "The PDF is probably a scan: each page is a picture of text rather than text. That needs OCR software to recognise the letters first. You will see a message when no text is found.",
    },
    {
      question: "Does it work with Hindi, Arabic or Chinese text?",
      answer:
        "Usually, yes: the text is copied as Unicode. Some PDFs store text with custom font encodings that cannot be turned back into letters, and those come out garbled in any converter.",
    },
    filePrivacyFaq,
  ],
  related: ["word-to-pdf", "pdf-to-image", "split-pdf", "word-counter"],
};

export const organizePdf: WidgetToolDefinition = {
  workspace: "organize-pdf",
  slug: "organize-pdf",
  category: "pdf-tools",
  name: "Organize PDF",
  metaTitle: "Organize PDF – Reorder, Rotate and Remove Pages, Free",
  description:
    "Rearrange PDF pages by dragging their previews, turn pages that are sideways and remove the ones you do not need. In your browser, with no upload.",
  overview: [
    "Scanned documents often come out in the wrong order, and merged files rarely have their pages exactly where you want them. Putting pages in order before sending a file makes it much easier for the reader, whether it is a contract with its appendices or a pack of receipts.",
    "Every page is shown as a preview. Drag pages into a new order, or use the arrow buttons if you prefer the keyboard or a touch screen; turn sideways pages and remove the ones you do not need, all in one pass. The pages are copied into the new file as they are, so text stays selectable and image quality is unchanged, and the work happens on your device rather than on a server.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device. A preview of every page appears.",
    "Drag pages into order, or use the left and right arrows under each page.",
    "Turn a page with the rotate button, or take it out with the bin. Reset puts everything back.",
    "Press “Save organized PDF” to download the result.",
  ],
  examples: [
    { title: "Put the last page first in a 4-page file", input: "order 4, 1, 2, 3", output: "report-organized.pdf with pages 4, 1, 2, 3" },
    { title: "Remove page 2 and turn page 3", input: "order 1, 3 (turn 90), 4", output: "report-organized.pdf with pages 1, 3 (90°), 4" },
  ],
  limitations: [
    "Pages turn in 90° steps.",
    "Bookmarks and links that point to other pages may not carry over to the new file.",
    "Previews are drawn on your device, so very long documents take a moment to show every page.",
    "Password-protected PDFs must be unlocked first.",
  ],
  faq: [
    {
      question: "Can I move pages without a mouse?",
      answer:
        "Yes. Each page has buttons to move it earlier or later, turn it and remove it, and they all work with the keyboard and on touch screens.",
    },
    {
      question: "Does reordering reduce quality?",
      answer: "No. Pages are copied exactly as they are, with selectable text and the original images.",
    },
    {
      question: "Can I combine pages from several PDFs?",
      answer: "Merge the files with Merge PDF first, then open the result here to put the pages in order.",
    },
    lockedFaq,
    filePrivacyFaq,
  ],
  related: ["delete-pdf-pages", "merge-pdf", "rotate-pdf", "split-pdf"],
};

export const deletePdfPages: WidgetToolDefinition = {
  workspace: "delete-pdf-pages",
  slug: "delete-pdf-pages",
  category: "pdf-tools",
  name: "Delete PDF Pages",
  metaTitle: "Delete PDF Pages – Remove Pages from a PDF, Free",
  description:
    "Remove blank, duplicate or private pages from a PDF. Click the previews or type page numbers, then save. Runs in your browser; nothing is uploaded.",
  overview: [
    "Removing pages is a quick way to drop the blank sheets a scanner adds, take out duplicates, or leave out pages with details you do not want to share before sending a document. It is also useful for getting under the page or size limit of an upload form.",
    "Click the pages to remove in the previews, or type them as ranges such as 2, 5-7; the two stay in sync. The remaining pages are copied into a new PDF exactly as they are, so text stays selectable and quality is unchanged. Everything runs in your browser, which matters when the pages you are removing are the sensitive ones.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device. A preview of every page appears.",
    "Click each page you want to remove, or type them, for example 2, 5-7.",
    "Press “Delete pages and download” to save the PDF without them.",
  ],
  examples: [
    {
      title: "Remove three pages from a 10-page file",
      input: "delete 2, 5-6 from 10 pages",
      output: "report-pages-removed.pdf with pages 1, 3, 4, 7, 8, 9, 10",
    },
  ],
  limitations: [
    "At least one page must remain.",
    "Deleting a page removes it from the new file only; the original file on your device is not changed.",
    "Password-protected PDFs must be unlocked first.",
  ],
  faq: [
    {
      question: "Is the deleted content really gone?",
      answer:
        "Yes. The new PDF is built only from the pages you keep, so the removed pages are not hidden inside it.",
    },
    {
      question: "Can I keep certain pages instead?",
      answer: "Use Split PDF and choose Extract pages to save only the pages you list.",
    },
    lockedFaq,
    filePrivacyFaq,
  ],
  related: ["organize-pdf", "split-pdf", "compress-pdf", "merge-pdf"],
};

export const addPageNumbers: WidgetToolDefinition = {
  workspace: "add-page-numbers",
  slug: "add-page-numbers",
  category: "pdf-tools",
  name: "Add Page Numbers to PDF",
  metaTitle: "Add Page Numbers to PDF – Free, Private, No Upload",
  description:
    "Number the pages of a PDF at the top or bottom, as 1, Page 1 or 1 of 12. Skip a cover page or start from any number. Runs in your browser.",
  overview: [
    "Page numbers make long documents easier to read, print and discuss: “see page 14” only works if there is a page 14. Theses, reports, legal bundles and manuals often have to be numbered before they are submitted.",
    "Choose where the number goes, its style and size, and which pages get one; a live preview shows the result on your first numbered page. You can skip a cover or contents page and start counting from any number, which is handy when the PDF is one part of a larger document. Numbers are added on top of the existing pages, so the original text and images are untouched, and the file is processed on your device.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device.",
    "Choose the position, format and size. The preview updates as you go.",
    "To skip a cover, type 2- in “Pages to number”. Change “First number” to start from another number.",
    "Press “Add numbers and download”.",
  ],
  examples: [
    {
      title: "Skip the cover of a 12-page report",
      input: "12 pages, format Page 1 of 12, pages 2-, start 1",
      output: "11 numbered: page 2 shows “Page 1 of 11”, page 12 shows “Page 11 of 11”",
    },
    {
      title: "Continue numbering from an earlier part",
      input: "5 pages, format 1, pages all, start 21",
      output: "5 numbered: page 1 shows “21”, page 5 shows “25”",
    },
  ],
  limitations: [
    "Numbers use Western digits in Helvetica; other numerals and fonts are not available yet.",
    "Numbers are drawn on top of the page, so they can overlap content that reaches the very edge.",
    "Password-protected PDFs must be unlocked first.",
  ],
  faq: [
    {
      question: "How do I leave the first page without a number?",
      answer:
        "Type 2- in “Pages to number”. The second page then gets the first number. Change “First number” if it should start at 2.",
    },
    {
      question: "Do the numbers follow rotated pages?",
      answer:
        "Yes. The number is placed where it looks right on the page as you see it, even when the page itself is stored sideways.",
    },
    lockedFaq,
    filePrivacyFaq,
  ],
  related: ["watermark-pdf", "organize-pdf", "merge-pdf", "split-pdf"],
};

export const watermarkPdf: WidgetToolDefinition = {
  workspace: "watermark-pdf",
  slug: "watermark-pdf",
  category: "pdf-tools",
  name: "Watermark PDF",
  metaTitle: "Watermark PDF – Add Text or a Logo to PDF Pages, Free",
  description:
    "Stamp a PDF with text like CONFIDENTIAL or DRAFT, or with your logo. Set size, opacity and angle with a live preview. Runs in your browser, no upload.",
  overview: [
    "A watermark tells readers at a glance that a document is a draft, confidential or a copy, and a logo marks it as yours. It also discourages people from passing on or reusing a file as if it were the final version.",
    "Type your text, in any language your device can display, or add a logo, then set its colour, size, opacity, angle and whether it appears once or repeated across the page. The preview shows the first page as it will look. The mark is placed on top of every chosen page while the original content stays untouched underneath, and the whole job runs in your browser, so the document is never uploaded.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device.",
    "Choose Text and type the words, or choose Image and add a logo.",
    "Adjust the colour, size, opacity, angle and layout while watching the preview.",
    "Optionally list the pages to mark, then press “Add watermark and download”.",
  ],
  examples: [
    { title: "Mark only some pages of a 10-page file", input: "pages 1-3, 7 of 10", output: "4 pages watermarked" },
    {
      title: "A repeated mark on an A4 page",
      input: "a 150 × 30 pt mark, flat, repeated on A4",
      output: "30 copies on the page",
    },
  ],
  limitations: [
    "Text watermarks are added as an image of the text, so they cannot be selected or searched.",
    "A watermark sits on top of the page; it does not stop anyone with PDF editing software from removing it.",
    "Password-protected PDFs must be unlocked first.",
  ],
  faq: [
    {
      question: "Can I write the watermark in Hindi or another script?",
      answer:
        "Yes. The text is drawn with your device's own fonts, so any script your device can show works, including Devanagari, Arabic and Chinese.",
    },
    {
      question: "Will the watermark hide my content?",
      answer:
        "Not at the default 25% opacity: the page shows through. Lower the opacity for a fainter mark, or raise it for a stronger one.",
    },
    {
      question: "Can a watermark be removed?",
      answer:
        "With PDF editing software, often yes. A watermark is a clear label, not protection. To stop people opening a file, use Protect PDF.",
    },
    filePrivacyFaq,
  ],
  related: ["add-page-numbers", "protect-pdf", "image-to-pdf", "merge-pdf"],
};

export const protectPdf: WidgetToolDefinition = {
  workspace: "protect-pdf",
  slug: "protect-pdf",
  category: "pdf-tools",
  name: "Protect PDF",
  metaTitle: "Protect PDF – Add a Password to a PDF (AES-256), Free",
  description:
    "Lock a PDF with a password using AES-256 encryption, so only people who know it can open the file. Done in your browser; the file and password stay private.",
  overview: [
    "A password on a PDF keeps its contents private when it travels by email, sits in a shared folder or is uploaded somewhere you do not fully control. Payslips, bank statements, medical letters and ID scans are common examples.",
    "The tool encrypts the whole file with AES-256, the strongest standard PDF encryption, which every modern PDF reader supports. Anyone opening the file is asked for the password. Encryption happens in your browser with qpdf, an open-source PDF tool, so neither the document nor the password is sent anywhere. Send the password by a different route from the file, for example by phone or text message, so one intercepted message is not enough.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device.",
    "Type a password twice. Twelve or more characters is much harder to guess.",
    "Press “Protect and download” to save the locked copy.",
  ],
  examples: [
    { title: "Lock a report", input: "report.pdf with a password of 4 characters or more", output: "report-protected.pdf, encrypted with AES-256" },
    { title: "Too short", input: "report.pdf with the password abc", output: "Error: Use a password of at least 4 characters." },
  ],
  limitations: [
    "A forgotten password cannot be recovered, by us or anyone else. Keep an unprotected copy if you might need one.",
    "Very old PDF readers that do not support AES-256 cannot open the file.",
    "PDFs that already have a password must be unlocked first.",
  ],
  faq: [
    {
      question: "How secure is it?",
      answer:
        "AES-256 is the strongest encryption in the PDF standard. In practice, security depends on the password: a long, unusual password or passphrase is very hard to break, a short common one is not.",
    },
    {
      question: "Can I stop people printing or copying instead?",
      answer:
        "Not yet. Print and copy restrictions are easy to bypass in many readers, so this tool sets an open password, which actually keeps the contents private.",
    },
    {
      question: "Is my password stored?",
      answer: "No. It is used in your browser to encrypt the file and is then forgotten. It is never sent or saved.",
    },
    filePrivacyFaq,
  ],
  related: ["unlock-pdf", "watermark-pdf", "compress-pdf", "merge-pdf"],
};

export const unlockPdf: WidgetToolDefinition = {
  workspace: "unlock-pdf",
  slug: "unlock-pdf",
  category: "pdf-tools",
  name: "Unlock PDF",
  metaTitle: "Unlock PDF – Remove a PDF Password You Know, Free",
  description:
    "Remove the password from a PDF you can open, or lift its print and copy limits, and save an unlocked copy. Runs in your browser; nothing is uploaded.",
  overview: [
    "Banks, phone companies and employers often send statements as password-protected PDFs, and typing the password every time you open one gets old quickly. Many online tools also refuse locked files, so merging, compressing or splitting means removing the password first.",
    "Give the password you open the file with and the tool saves a copy that opens without one. Files that open freely but block printing, copying or editing are recognised automatically, and their limits can be removed with one click. Decryption happens in your browser with qpdf, an open-source PDF tool, so the document and its password stay on your device. The tool does not guess or crack passwords: you need to know it.",
  ],
  howTo: [
    "Drop a locked PDF onto the page or choose one from your device.",
    "If it needs a password to open, type it. If it only has print or copy limits, no password is needed.",
    "Press the unlock button to save a copy without the password or limits.",
  ],
  examples: [
    {
      title: "Remove a known password",
      input: "report-protected.pdf and its password",
      output: "report-protected-unlocked.pdf, opens without a password",
    },
  ],
  limitations: [
    "You must know the password. Forgotten passwords cannot be found or guessed.",
    "Only unlock documents you own or have permission to change.",
    "Damaged PDFs or unusual encryption from some document management systems may not open.",
  ],
  faq: [
    {
      question: "Can you unlock a PDF if I forgot the password?",
      answer:
        "No. Modern PDF encryption cannot be opened without the password, and this tool does not try to guess it. Ask whoever sent the file, as statements often use something like a date of birth or account number.",
    },
    {
      question: "What does “restricted” mean?",
      answer:
        "The PDF opens without a password but its creator blocked printing, copying or editing. Unlocking saves a copy without those blocks.",
    },
    {
      question: "Is the unlocked file the same otherwise?",
      answer: "Yes. Only the encryption is removed; pages, text, images and links are unchanged.",
    },
    filePrivacyFaq,
  ],
  related: ["protect-pdf", "merge-pdf", "compress-pdf", "split-pdf"],
};
