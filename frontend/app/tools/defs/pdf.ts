import type { WidgetToolDefinition } from "../types";
import { filePrivacyFaq } from "./shared";

export const mergePdf: WidgetToolDefinition = {
  workspace: "merge-pdf",
  slug: "merge-pdf",
  category: "pdf-tools",
  name: "Merge PDF",
  metaTitle: "Merge PDF – Combine PDF Files into One, Free and Private",
  description:
    "Combine several PDF files into one document in the order you choose. Runs in your browser, so your documents are never uploaded.",
  howTo: [
    "Drop two or more PDF files onto the page, or choose them from your device.",
    "Put them in order with the up and down buttons. The page count of each file is shown.",
    "Press “Merge and download” to save merged.pdf.",
  ],
  examples: [
    { title: "Combine a contract and its appendices", input: "contract.pdf (4 pages)\nappendix-a.pdf (2 pages)\nappendix-b.pdf (3 pages)", output: "merged.pdf (9 pages)" },
  ],
  limitations: [
    "Password-protected PDFs cannot be merged. Remove the password in your PDF reader first.",
    "Pages are copied exactly; bookmarks and fillable form fields from the original files may not carry over.",
    "Up to 100 MB per file. Large documents need enough free memory on your device.",
  ],
  faq: [
    {
      question: "Is merging PDFs here safe for confidential documents?",
      answer:
        "Yes. The files are read and combined in your browser using the open-source pdf-lib library. They never leave your device.",
    },
    {
      question: "Does merging reduce quality?",
      answer: "No. Pages are copied as they are: text stays selectable and images are not re-compressed.",
    },
    {
      question: "Can I merge only some pages?",
      answer: "Use Split PDF first to extract the pages you need, then merge the results here.",
    },
    filePrivacyFaq,
  ],
  related: ["split-pdf", "compress-image", "passport-photo"],
};

export const splitPdf: WidgetToolDefinition = {
  workspace: "split-pdf",
  slug: "split-pdf",
  category: "pdf-tools",
  name: "Split PDF",
  metaTitle: "Split PDF – Extract Pages or Split by Range, Free",
  description:
    "Extract pages from a PDF, split it into ranges, or save every page as its own file. Works in your browser with no upload.",
  howTo: [
    "Drop a PDF onto the page or choose one from your device. Its page count is shown.",
    "Choose Extract pages to save chosen pages as one PDF, Split by range for one PDF per range, or Every page.",
    "Type the pages, for example 1-3, 5, 8- (“8-” means page 8 to the end).",
    "Press “Split and download”. Several files are bundled into one ZIP.",
  ],
  examples: [
    { title: "Extract pages from a 12-page report", input: "1-3, 5, 10-", output: "report-extract.pdf with pages 1, 2, 3, 5, 10, 11, 12" },
    { title: "One file per range", input: "1-4, 5-8, 9-12", output: "report-split.zip with report-pages-1-4.pdf, report-pages-5-8.pdf, report-pages-9-12.pdf" },
  ],
  limitations: [
    "Password-protected PDFs cannot be split. Remove the password in your PDF reader first.",
    "Pages are shown by number only; there are no thumbnails yet.",
    "Up to 100 MB per file.",
  ],
  faq: [
    {
      question: "Can I reorder pages while extracting?",
      answer:
        "Pages are saved in the order you type them, so 5, 1-3 puts page 5 first. Use Merge PDF to combine pages from different files.",
    },
    {
      question: "Why do I get a ZIP file?",
      answer:
        "When the result is more than one PDF, they are bundled into a ZIP so you get a single download. Most systems open ZIP files with a double-click.",
    },
    {
      question: "Does splitting change the pages?",
      answer: "No. Pages are copied exactly, with selectable text and original image quality.",
    },
    filePrivacyFaq,
  ],
  related: ["merge-pdf", "compress-image", "word-counter"],
};
