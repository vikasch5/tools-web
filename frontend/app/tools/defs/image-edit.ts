import type { WidgetToolDefinition } from "../types";
import { filePrivacyFaq } from "./shared";

export const cropImage: WidgetToolDefinition = {
  workspace: "crop-image",
  slug: "crop-image",
  category: "image-tools",
  name: "Crop Image",
  metaTitle: "Crop Image Online – Free Crop to 1:1, 4:5, 16:9 or Exact Pixels",
  description:
    "Crop a photo freely or to a fixed shape like square 1:1, 4:5 for Instagram or 16:9, set exact pixels, and rotate or mirror it. Free, in your browser.",
  overview: [
    "Cropping removes what you do not want in a picture and gives it the right shape for where it is going: a square profile picture, a 4:5 Instagram post, a 16:9 thumbnail or banner, or a scan trimmed to the page. Phone galleries can crop, but they rarely let you set an exact pixel size or keep a precise ratio.",
    "Drag the crop box or its handles over your photo, pick a ratio to lock its shape, or type the width, height and position in pixels. Rotate in quarter turns or mirror the image first if needed. The crop is cut from the full-resolution original, not the preview, so no quality is lost beyond saving the file, and nothing is uploaded: the photo never leaves your device.",
  ],
  howTo: [
    "Drop a JPG, PNG or WebP image onto the page.",
    "Choose a ratio such as 1:1 or 16:9, or keep Free for any shape.",
    "Drag the box to move it and its corners or edges to resize it, or type exact pixels. With the box focused, arrow keys move it and Shift + arrows resize it.",
    "Rotate or mirror the image if needed, then download the cropped image.",
  ],
  examples: [
    { title: "Square crop of a landscape photo", input: "4000 × 3000 px, 1:1", output: "3000 × 3000 px from (500, 0)" },
    { title: "16:9 thumbnail from a phone photo", input: "3000 × 4000 px, 16:9", output: "3000 × 1688 px from (0, 1156)" },
  ],
  limitations: [
    "Animated GIFs and WebPs are not supported.",
    "Re-saving a JPG re-encodes it at high quality; choose PNG for screenshots and graphics with sharp edges.",
  ],
  faq: [
    {
      question: "What size should an Instagram or WhatsApp picture be?",
      answer:
        "Instagram posts look best at 4:5 (for example 1080 × 1350 px) or 1:1; stories at 9:16. WhatsApp and most profile pictures are shown as circles cut from a square, so crop to 1:1 with the face in the middle.",
    },
    {
      question: "Does cropping reduce quality?",
      answer: "No. The crop is taken from the original pixels; only the parts outside the box are removed. Saving as JPG re-encodes once at 92% quality.",
    },
    {
      question: "Can I crop to an exact pixel size?",
      answer: "Yes. Type the width and height in pixels. With a ratio selected, changing one side adjusts the other to keep the shape.",
    },
    filePrivacyFaq,
  ],
  related: ["resize-image", "compress-image", "add-text-to-photo"],
};

export const addTextToPhoto: WidgetToolDefinition = {
  workspace: "add-text",
  slug: "add-text-to-photo",
  category: "image-tools",
  name: "Add Text to Photo",
  metaTitle: "Add Text to Photo Online – Captions, Hindi Text and Date Stamp",
  description:
    "Write on a photo: add captions, names or a date stamp in any language including Hindi, choose font, size, colour and outline, and drag them into place.",
  overview: [
    "Adding text turns a photo into a greeting, a poster, a shop offer or a labelled picture for a report. You might want a caption at the bottom, a name on a group photo, a price on a product shot or the date a photo of a document was taken.",
    "Type your text, choose a font, size and colour, and drag it to where it should go. Each text gets an optional outline so it stays readable on light or dark parts of the photo. Add as many texts as you need, or one click adds today's date in the corner. Hindi and other Indian scripts work with the fonts already on your device. The finished image is drawn at the photo's full resolution and nothing is uploaded.",
  ],
  howTo: [
    "Drop a JPG, PNG or WebP photo onto the page.",
    "Type your text; press Enter for a new line.",
    "Pick a font, size and colour, and keep Outline on for text that stands out on any background.",
    "Drag the text on the photo, or use the position sliders, to place it. Add more texts or a date stamp with the buttons.",
    "Download the photo with the text.",
  ],
  examples: [
    { title: "Caption at 7% on an Instagram portrait", input: "7% on 1080 × 1350 px", output: "76 px text" },
    { title: "Date stamp at 4% on a phone photo", input: "4% on 3000 × 4000 px", output: "120 px text" },
  ],
  limitations: [
    "Text size is set as a share of the photo's shorter side, so it looks the same on small and large photos.",
    "Fonts come from your device: a font may look slightly different on another phone or computer.",
    "Text cannot be edited after you download the photo; keep the original if you may want to change it.",
  ],
  faq: [
    {
      question: "Can I write in Hindi or other Indian languages?",
      answer:
        "Yes. Type or paste text in Hindi, Marathi, Tamil, Bengali or any other script; it is drawn with the fonts installed on your device, which on phones and modern computers include Indian scripts.",
    },
    {
      question: "How do I add the date to a photo?",
      answer: "Press Date: today's date is added in the bottom-right corner. Edit it like any other text if you need a different date.",
    },
    {
      question: "Will the text be sharp?",
      answer: "Yes. The preview is a small copy, but the download is drawn at the photo's full resolution.",
    },
    filePrivacyFaq,
  ],
  related: ["crop-image", "resize-image", "compress-image"],
};
