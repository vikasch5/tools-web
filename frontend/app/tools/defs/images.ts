import type { WidgetToolDefinition } from "../types";
import { filePrivacyFaq } from "./shared";

export const compressImage: WidgetToolDefinition = {
  workspace: "compress-image",
  slug: "compress-image",
  category: "image-tools",
  name: "Compress Image",
  metaTitle: "Compress Image – Reduce JPG, PNG and WebP File Size",
  description:
    "Shrink JPG, PNG and WebP images in your browser. Choose quality and format, optionally cap the dimensions, and download them one by one or as a ZIP.",
  howTo: [
    "Drop up to 30 images onto the page or choose them from your device. They are compressed straight away.",
    "Adjust Quality: 70–80% is usually indistinguishable from the original and much smaller.",
    "Convert to WebP for the smallest files on the web, or JPG for maximum compatibility. PNG keeps transparency but compresses least.",
    "Set Max size to scale down very large photos, for example to 1920 px for a website.",
    "Download each image, or all of them as a ZIP file.",
  ],
  examples: [
    { title: "Scale a camera photo for the web (Max size 1920 px)", input: "6000 × 4000 px", output: "1920 × 1280 px" },
    { title: "Portrait phone photo (Max size 1280 px)", input: "3024 × 4032 px", output: "960 × 1280 px" },
  ],
  limitations: [
    "If an image is already well compressed and would get bigger, the original is kept and labelled as such.",
    "Re-encoding removes metadata such as camera details and GPS location, which also protects your privacy.",
    "Animated GIFs and WebPs are not supported. Some browsers (notably Safari) cannot save WebP; you will be told if a different format was used.",
  ],
  faq: [
    {
      question: "Does compressing reduce quality?",
      answer:
        "JPG and WebP compression is lossy, so some detail is discarded, but at 70–80% quality the difference is very hard to see. Compare before and after for important images.",
    },
    {
      question: "Why is my PNG barely smaller?",
      answer:
        "PNG is lossless, so the browser cannot throw detail away. For photos, switch the format to JPG or WebP; for screenshots and logos, reducing the dimensions helps most.",
    },
    {
      question: "Is there a limit?",
      answer: "Up to 30 images at a time, 25 MB each. Everything runs on your device, so very large photos take longer on older phones.",
    },
    filePrivacyFaq,
  ],
  related: ["resize-image", "passport-photo", "merge-pdf"],
};

export const resizeImage: WidgetToolDefinition = {
  workspace: "resize-image",
  slug: "resize-image",
  category: "image-tools",
  name: "Resize Image",
  metaTitle: "Resize Image – Change Image Size in Pixels or Percent",
  description:
    "Resize a JPG, PNG or WebP to exact pixel dimensions or by percentage, keeping the aspect ratio if you want. Free and private, in your browser.",
  howTo: [
    "Drop an image onto the page or choose one from your device.",
    "Type a new width or height in pixels. With “Keep aspect ratio” on, the other side follows automatically.",
    "Or switch to Percentage and drag the scale slider.",
    "Pick the output format and quality, then press Resize to see the result.",
    "Press Download to save the resized image.",
  ],
  examples: [
    { title: "Set a width and keep the proportions", input: "4032 × 3024 px → width 1600 px", output: "1600 × 1200 px" },
    { title: "Scale by percentage", input: "1920 × 1080 px → 50%", output: "960 × 540 px" },
  ],
  limitations: [
    "Enlarging an image cannot add detail, so it will look softer than the original.",
    "The largest output is 16,384 px on either side, the limit of most browsers.",
    "Transparency is kept for PNG and WebP; JPG fills transparent areas with white.",
  ],
  faq: [
    {
      question: "How do I resize without stretching?",
      answer:
        "Keep “Keep aspect ratio” switched on and set only the width or the height. If you turn it off and set both, the image is stretched to exactly that size.",
    },
    {
      question: "What size should I use for a website?",
      answer:
        "1600–2000 px wide is plenty for full-width images on most screens; 800–1200 px for images inside an article. Pair this with Compress Image to cut the file size further.",
    },
    {
      question: "Does resizing remove metadata?",
      answer: "Yes. The new file is re-encoded, so camera details and GPS location are not copied over.",
    },
    filePrivacyFaq,
  ],
  related: ["compress-image", "passport-photo", "gradient-generator"],
};

export const passportPhoto: WidgetToolDefinition = {
  workspace: "passport-photo",
  slug: "passport-photo",
  category: "image-tools",
  name: "Passport Photo Maker",
  metaTitle: "Passport Photo Maker – Crop to Official Sizes at 300 DPI",
  description:
    "Crop a portrait to common passport and visa photo sizes, including US 2×2 in and 35×45 mm. Download a single photo or a 6×4 in print sheet.",
  howTo: [
    "Take a photo facing the camera against a plain, light background, with even lighting and no shadows.",
    "Drop it onto the page and choose the country and document size.",
    "Zoom and drag the photo (or use the arrow keys) so the eyes sit on the upper guide and the chin on the lower one.",
    "Download a single photo for online applications, or a 6 × 4 in sheet to print at a photo shop and cut out.",
    "Check the official rules for your document before you submit.",
  ],
  examples: [
    { title: "US passport, single photo", input: "US passport & visa (2 × 2 in)", output: "600 × 600 px at 300 DPI; 6 photos fit on a 6 × 4 in sheet" },
    { title: "UK, EU & Schengen on a print sheet", input: "UK, EU & Schengen (35 × 45 mm)", output: "413 × 531 px at 300 DPI; 8 photos fit on a 6 × 4 in sheet" },
  ],
  limitations: [
    "This tool crops and sizes your photo. It does not check the background, lighting, expression or head size against official rules, and it does not remove backgrounds.",
    "Photo rules change. Always confirm the current size and requirements with the issuing authority before printing.",
    "Downloads are JPG at 300 DPI. Print the 6 × 4 in sheet at 100% size (“actual size”), not “fit to page”.",
  ],
  faq: [
    {
      question: "Will my photo be accepted?",
      answer:
        "We cannot promise that: acceptance depends on the photo itself (lighting, background, expression, glasses) and on the official who checks it. The size and crop will match the preset you choose.",
    },
    {
      question: "How do I print the photos?",
      answer:
        "Download the 6 × 4 in sheet and print it at a photo shop or on photo paper at 100% scale. Cut along the thin grey lines.",
    },
    {
      question: "What resolution is the download?",
      answer:
        "300 DPI, the standard for photo printing. A 2 × 2 in photo is 600 × 600 pixels; a 35 × 45 mm photo is 413 × 531 pixels.",
    },
    filePrivacyFaq,
  ],
  related: ["resize-image", "compress-image", "merge-pdf"],
};
