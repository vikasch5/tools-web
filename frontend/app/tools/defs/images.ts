import type { WidgetToolDefinition } from "../types";
import { filePrivacyFaq } from "./shared";

export const compressImage: WidgetToolDefinition = {
  workspace: "compress-image",
  slug: "compress-image",
  category: "image-tools",
  name: "Compress Image",
  metaTitle: "Compress Image – Reduce JPG, PNG and WebP File Size",
  description:
    "Shrink JPG, PNG and WebP images in your browser. Pick a quality, or a target size like 50 KB for upload forms, and download one by one or as a ZIP.",
  overview: [
    "Large images are the main reason web pages load slowly and emails bounce. Photos from phones are often 3–10 MB each, far more than a website, chat app or upload form needs.",
    "Compression re-encodes the image at a chosen quality. Around 70–80% quality, most photos look the same to the eye but are several times smaller. Converting to WebP saves even more for the web, and capping the dimensions helps when the original is much larger than it will ever be shown. Re-encoding also removes hidden metadata such as GPS location, and because it happens in your browser, your photos stay private.",
  ],
  howTo: [
    "Drop up to 30 images onto the page or choose them from your device. They are compressed straight away.",
    "For an upload form with a size limit, switch Mode to Size limit and pick the limit (for example 50 KB). Each image is fitted under it at the best quality that fits.",
    "Otherwise adjust Quality: 70–80% is usually indistinguishable from the original and much smaller.",
    "Convert to WebP for the smallest files on the web, or JPG for maximum compatibility. PNG keeps transparency but compresses least.",
    "Set Max size to scale down very large photos, for example to 1920 px for a website.",
    "Download each image, or all of them as a ZIP file.",
  ],
  examples: [
    { title: "Scale a camera photo for the web (Max size 1920 px)", input: "6000 × 4000 px", output: "1920 × 1280 px" },
    { title: "Portrait phone photo (Max size 1280 px)", input: "3024 × 4032 px", output: "960 × 1280 px" },
    { title: "Target size for a form limit", input: "Target 50 KB", output: "at most 50,000 bytes" },
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
      question: "How do I compress an image to a specific size like 50 KB?",
      answer:
        "Switch Mode to Size limit and choose the limit. The tool tries the highest quality first and lowers it, then the dimensions if needed, until the file is under the limit. 1 KB is counted as 1,000 bytes, so it passes forms that use either 1,000 or 1,024.",
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
  overview: [
    "Websites, marketplaces, job portals and social networks often ask for images at specific dimensions or below a size limit. Resizing to the size that will actually be displayed also makes files much smaller and pages faster.",
    "You can set an exact width and height in pixels or scale by percentage, and keep the original aspect ratio so the image is not stretched. Scaling down keeps images sharp, while enlarging cannot add detail that was never captured. All resizing happens in your browser.",
  ],
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
  overview: [
    "Passport, visa and ID applications require photos of an exact size, with the head at a set position and scale. Getting this wrong is one of the most common reasons applications are delayed or rejected.",
    "This tool helps you crop your own photo to the right dimensions, using guides for the eye and chin positions, and produces a 300 DPI file for online submission or a 6×4 inch sheet with several copies to print at a photo shop. It does not judge whether the background, lighting or expression meet the rules, so always compare your photo with the official requirements for your document.",
  ],
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

export const imageConverter: WidgetToolDefinition = {
  workspace: "image-converter",
  slug: "image-converter",
  category: "image-tools",
  name: "Image Converter",
  metaTitle: "Image Converter – Convert to JPG, PNG or WebP Online",
  description:
    "Convert images between JPG, PNG and WebP, from GIF, BMP, AVIF and ICO too. Batch up to 30 files and download them as a ZIP. Nothing is uploaded.",
  overview: [
    "Different places need different image formats. JPG is accepted almost everywhere and suits photos; PNG keeps sharp edges and transparency for screenshots and logos; WebP gives the smallest files for websites. Older or unusual formats such as BMP, ICO or AVIF often need converting before they can be uploaded or edited.",
    "This converter handles batches of up to 30 images and saves them as a ZIP, with quality control for lossy formats and a choice of background colour when transparency has to be flattened for JPG. Everything runs locally, so the images are never uploaded.",
  ],
  howTo: [
    "Choose the format to convert to: JPG for compatibility, PNG for lossless images with transparency, or WebP for the smallest files.",
    "Drop up to 30 images onto the page or choose them from your device. They are converted straight away.",
    "For JPG and WebP, adjust Quality. For JPG, choose the colour that replaces transparent areas.",
    "Download each image, or all of them as a ZIP file.",
  ],
  examples: [
    { title: "PNG logo to JPG", input: "logo.png → JPG", output: "logo.jpg (transparent areas filled with white)" },
    { title: "Phone photo to WebP", input: "IMG_2041.jpeg → WebP", output: "IMG_2041.webp" },
    { title: "Old BMP to PNG", input: "scan.bmp → PNG", output: "scan.png" },
  ],
  limitations: [
    "JPG has no transparency, so transparent areas are filled with white or black.",
    "Only the first frame of an animated GIF or WebP is converted.",
    "HEIC photos from iPhones and SVG files are not supported. On iPhone, photos are usually converted to JPG automatically when you share or upload them.",
    "Which formats can be opened depends on your browser: AVIF needs a recent browser, and some browsers (notably Safari) cannot save WebP. You will be told if a different format was used.",
    "Converting removes metadata such as camera details and GPS location.",
  ],
  faq: [
    {
      question: "Which format should I choose?",
      answer:
        "WebP for websites (smallest files, supports transparency), JPG for photos you will email or print, and PNG for screenshots, logos and anything that needs sharp edges or lossless quality.",
    },
    {
      question: "Will converting to PNG improve quality?",
      answer:
        "No. PNG keeps the image exactly as it is now, but cannot restore detail that JPG compression already discarded. The file will usually be larger.",
    },
    filePrivacyFaq,
  ],
  related: ["compress-image", "resize-image", "passport-photo"],
};
