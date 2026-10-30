import type { WidgetToolDefinition } from "../types";
import { filePrivacyFaq } from "./shared";

/** Where each target size usually comes up, so every page explains its own case. */
const uses: Record<number, { who: string; tip: string; question: string; answer: string }> = {
  10: {
    who: "Signature uploads and tiny thumbnails often have to be 10 KB or less. Some exam and bank forms set this limit for the scanned signature, and chat apps or old systems sometimes cap profile images this low.",
    tip: "A signature on white paper reaches 10 KB easily at a few hundred pixels wide. A full-colour photo usually has to be scaled down a lot, so crop it to the face first.",
    question: "Can a photo really fit in 10 KB?",
    answer:
      "Yes, but only at a small size, roughly 200–300 px on the long side. The tool lowers quality first and shrinks the image only as much as needed. Crop away background first and the face keeps more detail.",
  },
  20: {
    who: "Many recruitment and exam forms ask for a signature of 10–20 KB and a photo of 20–50 KB. A 20 KB limit is also common for scanned thumb impressions and small ID photos on government portals.",
    tip: "If the form gives a pixel size as well (for example 140 × 60 px for a signature), resize to that first, then compress to 20 KB here.",
    question: "My form says 10–20 KB. Will this work?",
    answer:
      "The tool keeps the file at or under 20 KB, and it uses the highest quality that fits, so the result usually lands close to 20 KB rather than far below it. If a result is under the minimum, check that the image is not tiny to begin with.",
  },
  30: {
    who: "A 30 KB limit shows up on exam application forms, school and college admission portals, and some state government services that want a small passport-size photo.",
    tip: "Passport-size photos at 30 KB keep good detail around 300–400 px wide. Use the Passport Photo tool first if the form also needs an exact shape.",
    question: "Why does my 30 KB photo look softer than the original?",
    answer:
      "To fit 30 KB, the tool lowers the JPEG quality and, if needed, the pixel size. Faces stay clear at this size, but fine background detail is lost. A plain background helps, since it compresses much better.",
  },
  50: {
    who: "50 KB is one of the most common upload limits in India: PAN card applications, many exam and job forms, and plenty of government portals ask for a photo or signature under 50 KB.",
    tip: "For a passport-size photo, 50 KB is enough to keep the face sharp at full quality, so most phone photos only need their size and quality reduced.",
    question: "Is the file under 50 KB by the form's count?",
    answer:
      "Yes. Forms count a kilobyte as either 1,000 or 1,024 bytes; the tool uses 1,000, the stricter of the two, so the file passes either check.",
  },
  100: {
    who: "A 100 KB limit is common on job portals, scholarship and university forms, and for scanned documents such as certificates or ID cards uploaded as images.",
    tip: "Scanned documents with text stay readable at 100 KB at around 1000–1200 px wide. If text looks blurry, crop the margins before compressing.",
    question: "Will text in a scanned document stay readable?",
    answer:
      "Usually, yes. 100 KB is enough for a full page at a readable size. If it is not, the tool tells you the final pixel size so you can judge, and cropping margins first frees up space for the text.",
  },
  200: {
    who: "200 KB is a typical cap for certificates, mark sheets and other documents uploaded as images, and for photos on some passport, visa and admission portals.",
    tip: "Most phone photos reach 200 KB at a high quality setting without being made smaller, so the result looks almost the same as the original.",
    question: "Why not just resize the photo?",
    answer:
      "Resizing alone does not guarantee a file size: two photos of the same dimensions can differ in size by several times. This tool measures the actual file and adjusts until it is under 200 KB.",
  },
  500: {
    who: "500 KB limits are common for document uploads, website and blog images, email attachments that need to stay small, and listings on shopping and classified sites.",
    tip: "At 500 KB, photos usually keep their full dimensions. Choose WebP for websites if the site accepts it, since it looks better at the same size.",
    question: "Can I compress several photos to 500 KB at once?",
    answer:
      "Yes. Add up to 30 images; each one is fitted under 500 KB on its own, and you can download them together as a ZIP file.",
  },
};

export const targetKbSizes = Object.keys(uses).map(Number);

function kbPage(kb: number): WidgetToolDefinition {
  const use = uses[kb];
  return {
    workspace: "compress-image",
    preset: { mode: "target", targetKb: kb },
    slug: `compress-image-to-${kb}kb`,
    category: "image-tools",
    name: `Compress Image to ${kb} KB`,
    metaTitle: `Compress Image to ${kb} KB Online – Free JPG Size Reducer`,
    description: `Reduce a photo or signature to under ${kb} KB for forms and uploads. Keeps the best quality that fits, right in your browser, nothing uploaded.`,
    overview: [
      use.who,
      `Upload forms check the file size, not how the picture looks, so a photo that is 2 MB from your phone is rejected even if it looks fine. This tool measures the real file as it compresses: it tries the highest JPEG quality first, lowers it step by step until the file is under ${kb} KB, and makes the image smaller only if quality alone is not enough. ${use.tip}`,
    ],
    howTo: [
      `Drop your photo, signature or scan on the page. The target is already set to ${kb} KB.`,
      `Wait a moment: each image is fitted under ${kb} KB at the best quality that fits.`,
      "Check the result next to each image: its final size, quality and dimensions.",
      "Download the image, or all images as a ZIP if you added several.",
      "Need a different limit? Change the target size or switch to Quality mode.",
    ],
    examples: [
      {
        title: `Target ${kb} KB`,
        input: `${kb} KB`,
        output: `at most ${(kb * 1000).toLocaleString("en-US")} bytes`,
      },
    ],
    limitations: [
      "PNG files are saved as JPG in target mode, since PNG has no quality setting to lower. Transparent areas become white.",
      `If an image cannot reach ${kb} KB even at a very small size, the smallest version is offered and clearly marked as still too big.`,
      "Some forms also need exact pixel dimensions. Use Resize Image or Passport Photo Maker first, then compress.",
    ],
    faq: [
      { question: use.question, answer: use.answer },
      {
        question: `How do I get exactly ${kb} KB?`,
        answer: `Forms ask for a maximum, so the tool keeps the file at or just under ${kb} KB at the highest quality that fits. It never goes over the limit.`,
      },
      {
        question: "Does it work on my phone?",
        answer:
          "Yes. Choose a photo from your gallery or take one with the camera. Everything runs in the phone's browser, so it also works on a slow connection once the page has loaded.",
      },
      filePrivacyFaq,
    ],
    related: ["compress-image", "resize-image", "passport-photo"],
  };
}

export const compressImageTargets: WidgetToolDefinition[] = targetKbSizes.map(kbPage);
