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
  overview: [
    "Combining PDFs is one of the most common document tasks: putting scanned pages together, attaching receipts to an expense claim, or assembling chapters, forms and appendices into a single file to send or upload.",
    "Many online PDF tools upload your documents to a server to do this. Here the files are read and joined by your browser, so contracts, bank statements and ID documents never leave your device. Pages are copied as they are, without re-compressing, so text stays sharp and searchable and images keep their quality.",
  ],
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
  overview: [
    "Splitting a PDF lets you send only the pages someone needs, break a large scan into separate documents, or meet the file size and page limits of upload forms. It is also a quick way to remove pages you do not want to share.",
    "You can extract a selection of pages into one new file, cut the document into several ranges, or save every page separately. The pages are copied without re-compressing, so the quality of text and images is unchanged, and the processing happens on your device rather than on a server.",
  ],
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

export const rotatePdf: WidgetToolDefinition = {
  workspace: "rotate-pdf",
  slug: "rotate-pdf",
  category: "pdf-tools",
  name: "Rotate PDF",
  metaTitle: "Rotate PDF – Turn Pages and Save, Free and Private",
  description:
    "Rotate single pages or a whole PDF by 90° steps with live page previews, then save it. Quality and text are kept. Runs in your browser, no upload.",
  overview: [
    "Scanned documents and phone captures often come out sideways or upside down, and a mix of portrait and landscape pages is common in reports. Rotating them properly makes the file comfortable to read on screen and print correctly.",
    "This tool changes each page's rotation setting rather than re-drawing its contents, so text remains selectable and searchable and the file size stays almost the same. Previews show every page so you can fix only the ones that need it, and your document is processed in the browser without being uploaded.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device. A preview of every page appears.",
    "Use the arrows under a page to turn it left or right, or All left / All right to turn every page.",
    "Press “Save rotated PDF” to download the result. Reset undoes all turns.",
  ],
  examples: [
    { title: "Fix two sideways scans in a 5-page report", input: "turn 0, 90, 0, 90, 0", output: "report-rotated.pdf with page rotations 0°, 90°, 0°, 90°, 0°" },
    { title: "Turns add up, and left is negative", input: "turn -90, 180, 450", output: "report-rotated.pdf with page rotations 270°, 180°, 90°" },
  ],
  limitations: [
    "Pages turn in 90° steps. Straightening a slightly skewed scan needs an image editor.",
    "Password-protected PDFs cannot be rotated. Remove the password in your PDF reader first.",
    "Previews are drawn on your device, so very long documents take a moment to show every page. You can rotate and save before all previews have appeared.",
  ],
  faq: [
    {
      question: "Does rotating reduce quality?",
      answer:
        "No. Only each page's rotation setting changes; text, images and links are copied exactly, and text stays selectable.",
    },
    {
      question: "Will the rotation stick when I open the file elsewhere?",
      answer: "Yes. The rotation is saved in the PDF, so every reader and printer shows the pages the new way round.",
    },
    filePrivacyFaq,
  ],
  related: ["split-pdf", "merge-pdf", "compress-image"],
};

export const pdfToImage: WidgetToolDefinition = {
  workspace: "pdf-to-image",
  slug: "pdf-to-image",
  category: "pdf-tools",
  name: "PDF to Image",
  metaTitle: "PDF to Image – Convert PDF Pages to PNG or JPG",
  description:
    "Turn PDF pages into PNG, JPG or WebP images at 72, 150 or 300 DPI. Pick the pages from previews and download them as a ZIP. No upload.",
  overview: [
    "Turning PDF pages into images is handy when you need to post a page on social media, put it in a slide deck, attach it where PDFs are not accepted, or share a preview without the full document.",
    "Resolution decides how sharp the image is: 72 or 150 DPI suits screens and messages, while 300 DPI is the usual choice for printing. PNG keeps text and line art crisp, while JPG and WebP make smaller files for photos and scans. The pages are drawn by your browser, so the PDF is never uploaded.",
  ],
  howTo: [
    "Drop a PDF onto the page or choose one from your device. A preview of every page appears, all selected.",
    "Click previews to leave pages out, or use Select all / Select none.",
    "Choose a format: PNG for sharp text, JPG or WebP for smaller files. Choose 150 DPI for screens or 300 DPI for print.",
    "Press Convert. One page downloads as an image; several are bundled into a ZIP.",
  ],
  examples: [
    { title: "A4 page for screens", input: "A4 page (595.28 × 841.89 pt) at 150 DPI", output: "1240 × 1754 px" },
    { title: "US Letter page for print", input: "Letter page (612 × 792 pt) at 300 DPI", output: "2550 × 3300 px" },
    { title: "File names keep page order", input: "report.pdf, page 3 of 12, as PNG", output: "report-page-03.png" },
  ],
  limitations: [
    "Very large pages (such as posters) are saved at a lower resolution if the image would exceed 40 megapixels, and you will be told.",
    "Password-protected PDFs cannot be opened. Remove the password in your PDF reader first.",
    "Pages are drawn by your browser, so a long document at 300 DPI can take a while on older phones.",
    "Form fields are drawn as they appear in the PDF; interactive elements such as links do not carry over into images.",
  ],
  faq: [
    {
      question: "Which resolution should I choose?",
      answer:
        "150 DPI is sharp on screens and keeps files small. Use 300 DPI for printing or zooming into fine text, and 72 DPI for quick thumbnails.",
    },
    {
      question: "PNG or JPG?",
      answer:
        "PNG keeps text and lines perfectly crisp and suits documents. JPG and WebP are much smaller for pages that are mostly photos.",
    },
    filePrivacyFaq,
  ],
  related: ["rotate-pdf", "split-pdf", "image-converter"],
};

export const imageToPdf: WidgetToolDefinition = {
  workspace: "image-to-pdf",
  slug: "image-to-pdf",
  category: "pdf-tools",
  name: "JPG to PDF",
  metaTitle: "JPG to PDF – Convert Images to PDF Free, No Upload",
  description:
    "Turn JPG, PNG and other images into one PDF, one image per page. Choose A4, Letter or the image’s own size, orientation and margins. No upload.",
  overview: [
    "Forms, visa portals, schools and employers often ask for a single PDF: scanned pages, receipts, ID cards or photos of handwritten work. Sending a pile of separate photos is awkward, and many upload forms accept only one file.",
    "This tool puts each image on its own page, in the order you choose. A4 and Letter pages scale images down to fit inside the margins and centre them, and wide images can turn the page to landscape automatically. Upright JPEG photos are placed in the PDF exactly as they are, without re-compressing, so they keep their quality. Phone photos stored sideways are turned upright first. Everything happens in your browser, so your documents are never uploaded.",
  ],
  howTo: [
    "Drop your images onto the page or choose them from your device. Phone photos, scans and screenshots all work.",
    "Put them in order with the up and down arrows. Each image becomes one page.",
    "Choose the page size: A4 or Letter for printing and forms, or “Same as image” for pages that match each picture.",
    "Pick an orientation and margin, then press Create PDF to download images.pdf.",
  ],
  examples: [
    { title: "A 12-megapixel phone photo on A4", input: "4032 × 3024 px on A4, auto, small margin", output: "Page 841.89 × 595.28 pt (11.69 × 8.27 in)\nImage 745.71 × 559.28 pt at (48.09, 18)" },
    { title: "A portrait screenshot on Letter", input: "1080 × 1920 px on Letter, portrait, none margin", output: "Page 612 × 792 pt (8.5 × 11 in)\nImage 445.5 × 792 pt at (83.25, 0)" },
    { title: "Page the same size as the image", input: "1920 × 1080 px on image size, auto, none margin", output: "Page 1440 × 810 pt (20 × 11.25 in)\nImage 1440 × 810 pt at (0, 0)" },
  ],
  limitations: [
    "Images are scaled down to fit a page but never enlarged beyond their natural size (96 pixels per inch), so small images stay sharp and centred.",
    "WebP, GIF, BMP and AVIF images, and sideways phone photos, are redrawn as high-quality JPEG first. Transparent areas become white.",
    "Up to 100 images and 25 MB per image. The PDF contains images only, so text in a scan is not searchable.",
  ],
  faq: [
    {
      question: "Will my photos lose quality?",
      answer:
        "Upright JPEG and PNG files are embedded unchanged, so they keep their original quality. Other formats are converted to JPEG at 92% quality, which is visually lossless for most photos.",
    },
    {
      question: "Why is my PDF large?",
      answer:
        "The PDF is about as big as the images inside it. To make it smaller, first shrink the photos with the Compress Image tool, then convert them.",
    },
    {
      question: "Can I put several images on one page?",
      answer: "Not yet. Each image gets its own page. To combine existing PDFs instead, use Merge PDF.",
    },
    filePrivacyFaq,
  ],
  related: ["merge-pdf", "compress-image", "pdf-to-image"],
};
