import type { WidgetToolDefinition } from "../types";
import { compressPdf } from "./pdf-more";
import { filePrivacyFaq } from "./shared";

/** Where each limit usually comes up. */
const uses: Record<number, string> = {
  100: "A 100 KB limit is common for certificates, mark sheets, caste and income certificates and ID proofs on Indian government and exam portals, where each document is a scanned page or two.",
  200: "200 KB limits show up on scholarship, university admission and recruitment portals for scanned documents such as degree certificates, experience letters and address proofs.",
  500: "A 500 KB cap is typical for multi-page documents on job portals, visa and passport-related services, and bank or insurance forms.",
  1000: "A 1 MB limit is common for resumes, project reports, tender and GST documents, and many email systems and web forms that keep attachments small.",
};

function pdfPage(kb: number): WidgetToolDefinition {
  const label = kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`;
  const slug = kb >= 1000 ? `compress-pdf-to-${kb / 1000}mb` : `compress-pdf-to-${kb}kb`;
  return {
    ...compressPdf,
    preset: { mode: "target", targetKb: kb },
    slug,
    name: `Compress PDF to ${label}`,
    metaTitle: `Compress PDF to ${label} Online – Free, No Upload`,
    description: `Reduce a PDF to under ${label} for upload forms and email. Text stays selectable whenever possible. Free and private, in your browser.`,
    overview: [
      uses[kb],
      `This page is set to ${label}. It first tries the gentlest options: repacking the file, then re-encoding photos and scans step by step, keeping text and drawings as they are. If that still is not small enough, it offers to save each page as an image at a lower resolution, which almost always fits but makes the text unselectable, so you decide.`,
    ],
    howTo: [
      `Drop your PDF on the page. The limit is already set to ${label}.`,
      "Press Compress PDF. The gentlest compression that gets under the limit is used.",
      "If the PDF is still too big, choose whether to turn its pages into images to reach the limit.",
      "Download the PDF and check its size next to the button before uploading.",
    ],
    examples: [{ title: `Target ${label}`, input: `Target ${kb} KB`, output: `at most ${(kb * 1000).toLocaleString("en-US")} bytes` }],
    faq: [
      {
        question: `Why can't some PDFs reach ${label} with text kept?`,
        answer:
          "Text and drawings are already compact, so they cannot be squeezed much. If a document has many pages or a lot of embedded fonts, it can stay over a small limit even with tiny images; then saving pages as pictures is the remaining option.",
      },
      {
        question: "How is a KB counted?",
        answer: `As 1,000 bytes, the stricter of the two conventions, so a file under ${label} here is also under ${label} on forms that count 1,024 bytes.`,
      },
      ...compressPdf.faq.filter((f) => f !== filePrivacyFaq),
      filePrivacyFaq,
    ],
    related: ["compress-pdf", "merge-pdf", "split-pdf"],
  };
}

export const compressPdfTargets: WidgetToolDefinition[] = [100, 200, 500, 1000].map(pdfPage);
