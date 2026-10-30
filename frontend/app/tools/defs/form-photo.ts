import type { WidgetToolDefinition } from "../types";
import { filePrivacyFaq } from "./shared";

const checkFaq = {
  question: "Are these sizes official?",
  answer:
    "They are taken from recent notifications and exam guides, but each recruitment notice can change them. Check the photo and signature section of your own notification; if it differs, choose Custom size and enter its numbers.",
};

const minimumFaq = {
  question: "My form has a minimum size. What if the file is too small?",
  answer:
    "If the best-quality file is still below the minimum (common for small signatures on white paper), the tool adds a hidden comment inside the JPEG to reach it. The picture does not change, and the file opens normally everywhere.",
};

export const examPhotoResizer: WidgetToolDefinition = {
  workspace: "form-photo",
  slug: "exam-photo-resizer",
  category: "image-tools",
  name: "Exam Photo & Signature Resizer",
  metaTitle: "Exam Photo & Signature Resizer – IBPS, SSC, UPSC, PAN",
  description:
    "Resize your photo, signature or thumb impression to the exact pixel size and KB range of Indian exam and government forms. Free, nothing uploaded.",
  overview: [
    "Online application forms for bank exams, UPSC, India Post GDS and PAN cards reject uploads that are the wrong size. They check two things: the pixel dimensions (for example 200 × 230 px) and the file size (for example 20–50 KB). A phone photo fails both, since it is thousands of pixels wide and several megabytes.",
    "Choose your form and upload type, and this tool crops the image to the exact shape, resizes it to the required pixels, and picks the best JPEG quality that lands inside the allowed KB range. Signatures and thumb impressions are framed around the ink automatically and the paper is cleaned up to plain white. Everything happens on your phone or computer, so your photo and signature are never uploaded anywhere.",
  ],
  howTo: [
    "Choose your form and what you are uploading, for example Bank exams → Photo (200 × 230 px, 20–50 KB).",
    "Add a clear photo or scan. For a signature, sign on white paper with a black pen and photograph it in good light.",
    "For a photo, zoom and drag so your face sits inside the oval. For a signature, the crop is fitted around the ink; adjust the margin if needed.",
    "Download the JPG. The status line shows its pixel size and KB, so you can check it against the form.",
    "If your notification lists other numbers, choose Custom size and enter them.",
  ],
  examples: [
    { title: "Bank exam photo (IBPS, SBI)", input: "bank-photo", output: "200 × 230 px JPG, 20–50 KB" },
    { title: "Bank exam signature", input: "bank-signature", output: "140 × 60 px JPG, 10–20 KB" },
    { title: "India Post GDS photo", input: "gds-photo", output: "320 × 400 px JPG, 30–100 KB" },
  ],
  limitations: [
    "The tool sizes and crops your image; it cannot check whether the photo itself (background, lighting, glasses, expression) meets the form's rules.",
    "SSC now takes candidate photos live in its own portal, so only the SSC signature preset is offered.",
    "Specs change between notifications. The presets were checked in October 2026; always compare with your own notice.",
  ],
  faq: [
    checkFaq,
    minimumFaq,
    {
      question: "Why does a 4 MB photo become only 30 KB?",
      answer:
        "Forms need small pictures such as 200 × 230 pixels, which is about 1% of a phone photo's pixels. At that size a good-quality JPEG is naturally only tens of kilobytes.",
    },
    filePrivacyFaq,
  ],
  related: ["signature-resizer", "passport-photo", "compress-image"],
};

export const signatureResizer: WidgetToolDefinition = {
  workspace: "form-photo",
  preset: { kind: "signature" },
  slug: "signature-resizer",
  category: "image-tools",
  name: "Signature Resizer",
  metaTitle: "Signature Resizer – 10–20 KB, 140 × 60 px for Online Forms",
  description:
    "Turn a photo of your signature into a clean, white-background JPG at the exact size and KB your form needs: bank exams, SSC, UPSC, GDS and PAN.",
  overview: [
    "Most online applications ask for a scanned signature in a strict format, such as 140 × 60 pixels and 10–20 KB for bank exams or 4 × 2 cm and 10–20 KB for SSC. A quick phone photo of your signature is usually too big, slightly grey, and has a lot of empty paper around it.",
    "This tool finds the ink, crops tightly around it with a small margin, turns the paper pure white and the ink darker, and saves a JPG at the exact pixel size inside the allowed KB range. If the clean image is smaller than the form's minimum, it is padded invisibly to reach it. Nothing is uploaded: your signature stays on your device.",
  ],
  howTo: [
    "Sign on plain white paper with a black pen. Leave some space around the signature.",
    "Take a photo straight from above, in daylight or good room light, without shadows.",
    "Choose your form, for example Bank exams → Signature (140 × 60 px, 10–20 KB), and add the photo.",
    "Check the preview: the crop is fitted around the ink. Adjust the margin or turn off the clean-up if needed.",
    "Download the JPG and upload it to your form.",
  ],
  examples: [
    { title: "Bank exams (IBPS, SBI, RBI)", input: "bank-signature", output: "140 × 60 px JPG, 10–20 KB" },
    { title: "SSC exams", input: "ssc-signature", output: "280 × 140 px JPG, 10–20 KB" },
    { title: "PAN card online application", input: "pan-signature", output: "354 × 157 px JPG, up to 10 KB" },
  ],
  limitations: [
    "Blue or very light ink is darkened, but black ink on white paper gives the cleanest result.",
    "If the photo has dark marks, folds or other writing near the signature, crop the photo first or retake it on a clean sheet.",
    "UPSC asks for three signatures stacked on one sheet; write all three before taking the photo.",
  ],
  faq: [
    {
      question: "Can I sign on my phone screen instead?",
      answer:
        "Most forms want a handwritten signature on paper. Sign on white paper and photograph it; the tool handles the cropping, cleaning and sizing.",
    },
    minimumFaq,
    checkFaq,
    filePrivacyFaq,
  ],
  related: ["exam-photo-resizer", "compress-image", "resize-image"],
};

/** Landing pages: the resizer preset to one form's upload. */
function formPage(
  slug: string,
  formPreset: string,
  name: string,
  metaTitle: string,
  description: string,
  who: string,
  spec: string,
  output: string,
): WidgetToolDefinition {
  return {
    ...examPhotoResizer,
    preset: { formPreset },
    slug,
    name,
    metaTitle,
    description,
    overview: [who, examPhotoResizer.overview[1]],
    examples: [{ title: name, input: formPreset, output }],
    faq: [
      {
        question: "What size does this page make?",
        answer: `${spec} The preset is already selected; switch to another form or Custom size in the list if your notification says otherwise.`,
      },
      ...examPhotoResizer.faq,
    ],
    related: ["exam-photo-resizer", "signature-resizer", "compress-image"],
  };
}

export const formPhotoPages: WidgetToolDefinition[] = [
  formPage(
    "pan-card-photo-resizer",
    "pan-photo",
    "PAN Card Photo Resizer",
    "PAN Card Photo Resizer – 3.5 × 2.5 cm, Under 20 KB",
    "Resize a photo for the PAN card online application: 3.5 × 2.5 cm on a white background, under 20 KB. The signature preset is one click away.",
    "The online PAN application (Form 49A on the Protean or UTIITSL portal) asks for a recent colour photo of about 3.5 × 2.5 cm on a white background, and a signature in black ink, each as a small JPG. Portals have listed limits between 20 and 30 KB for the photo, so this page uses the stricter 20 KB.",
    "A 197 × 276 px JPG (3.5 × 2.5 cm at 200 DPI) under 20 KB.",
    "197 × 276 px JPG, up to 20 KB",
  ),
  formPage(
    "ibps-photo-signature-resizer",
    "bank-photo",
    "IBPS & SBI Photo and Signature Resizer",
    "IBPS & SBI Photo Resizer – 200 × 230 px, 20–50 KB",
    "Make the photo (200 × 230 px, 20–50 KB), signature (140 × 60 px, 10–20 KB), thumb impression and declaration for IBPS, SBI and RBI forms.",
    "Bank recruitment forms run by IBPS and by banks such as SBI and RBI use the same upload format: a photo of 200 × 230 px at 20–50 KB, a signature of 140 × 60 px at 10–20 KB, a left thumb impression of 240 × 240 px at 20–50 KB, and a handwritten declaration of 800 × 400 px at 50–100 KB.",
    "A 200 × 230 px photo between 20 and 50 KB. Signature, thumb impression and declaration presets are in the same list.",
    "200 × 230 px JPG, 20–50 KB",
  ),
  formPage(
    "upsc-photo-resizer",
    "upsc-photo",
    "UPSC Photo and Signature Resizer",
    "UPSC Photo Resizer – 20–200 KB JPG for the Online Form",
    "Resize your photo (20–200 KB) and signature (20–100 KB) for UPSC online applications, on a plain white background. Free and private.",
    "UPSC online applications accept a photo of 20–200 KB with a plain white background, taken recently, and a signature image of 20–100 KB showing three signatures one below the other. Both must be JPG.",
    "A 350 × 450 px photo between 20 and 200 KB, with the signature preset in the same list.",
    "350 × 450 px JPG, 20–200 KB",
  ),
  formPage(
    "india-post-gds-photo-resizer",
    "gds-photo",
    "India Post GDS Photo and Signature Resizer",
    "India Post GDS Photo Resizer – 320 × 400 px, 30–100 KB",
    "Resize your photo (320 × 400 px, 30–100 KB) and signature (300 × 120 px, 20–100 KB) for the India Post GDS online application.",
    "The India Post Gramin Dak Sevak (GDS) application asks for a recent colour photo of about 320 × 400 px between 30 and 100 KB, and a signature of about 300 × 120 px between 20 and 100 KB, both as JPG.",
    "A 320 × 400 px photo between 30 and 100 KB, with the signature preset in the same list.",
    "320 × 400 px JPG, 30–100 KB",
  ),
];
