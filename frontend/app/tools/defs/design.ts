import type { WidgetToolDefinition } from "../types";

export const gradientGenerator: WidgetToolDefinition = {
  workspace: "gradient-generator",
  slug: "gradient-generator",
  category: "web-design-tools",
  name: "CSS Gradient Generator",
  metaTitle: "CSS Gradient Generator – Linear, Radial and Conic",
  description:
    "Design linear, radial and conic CSS gradients with a live preview. Add colour stops, set opacity, and copy ready-to-use CSS.",
  overview: [
    "Gradients add depth to backgrounds, buttons, cards and hero sections, and CSS can draw them without any image file, so they stay sharp at every size and cost nothing to download.",
    "Writing gradient syntax by hand is fiddly, especially with several colour stops, transparency or radial and conic shapes. This generator lets you adjust angles, colours, positions and opacity with a live preview, then copy CSS that works in all current browsers. You can also paste an existing gradient to edit it.",
  ],
  howTo: [
    "Start from a preset or keep the default, then choose Linear, Radial or Conic.",
    "Set the angle (or the shape for radial gradients) in the toolbar.",
    "Edit each colour stop: pick a colour or type a hex code, then drag its position and opacity. Add up to eight stops.",
    "Copy the CSS and paste it into your stylesheet.",
    "To tweak a gradient you already have, paste its CSS under “Edit an existing gradient” and press Load.",
  ],
  examples: [
    { title: "Normalise a direction keyword", input: "linear-gradient(to right, #f00, #00f)", output: "background: linear-gradient(90deg, #ff0000 0%, #0000ff 100%);" },
    {
      title: "Read rgba() colours",
      input: "radial-gradient(circle, rgba(255, 122, 26, 0.5) 0%, #ec3a76 80%)",
      output: "background: radial-gradient(circle at center, rgb(255 122 26 / 50%) 0%, #ec3a76 80%);",
    },
  ],
  limitations: [
    "Colours can be read as hex, rgb() and rgba() codes, plus white, black and transparent. Other colour names and hsl() are not imported.",
    "The CSS uses modern syntax (rgb() with a slash for opacity), supported by all current browsers.",
    "Gradients only: repeating gradients, multiple layered backgrounds and background-size are not generated.",
  ],
  faq: [
    {
      question: "How do I use the CSS?",
      answer:
        "Paste the line into any CSS rule, for example .hero { background: linear-gradient(…); }. It works on any element that has a size.",
    },
    {
      question: "What is the difference between linear, radial and conic?",
      answer:
        "Linear blends along a straight line at an angle. Radial spreads out from the centre as a circle or ellipse. Conic sweeps around the centre like a colour wheel or pie chart.",
    },
    {
      question: "How do I make a hard edge instead of a blend?",
      answer: "Put two stops at the same position, for example red at 50% and blue at 50%.",
    },
    {
      question: "Why is there banding in my gradient?",
      answer:
        "Long gradients between similar colours can show visible steps on some screens. Adding a middle stop or increasing the colour difference usually helps.",
    },
  ],
  related: ["css-formatter", "css-minifier", "uuid-generator"],
};

export const colorConverter: WidgetToolDefinition = {
  workspace: "color-converter",
  slug: "color-converter",
  category: "web-design-tools",
  name: "Color Converter (HEX, RGB, HSL)",
  metaTitle: "Color Converter – HEX to RGB, HSL, HSV and CMYK",
  description:
    "Convert colours between HEX, RGB, HSL, HSV and CMYK, pick one visually, and check its text contrast against white and black for accessibility.",
  overview: [
    "The same colour is written differently depending on where you use it: HEX codes in CSS and design tools, RGB values in code, HSL when you want to adjust lightness or saturation, and CMYK percentages for print. Converting by hand means juggling formulas and rounding.",
    "Type a colour in any common format, or pick one with the colour picker, and every other format appears ready to copy. The contrast check shows the WCAG 2 contrast ratio of the colour as text on white and on black backgrounds, and whether it meets the AA (4.5:1) or AAA (7:1) levels that accessibility guidelines recommend for body text. That helps you choose brand colours that stay readable.",
  ],
  howTo: [
    "Type a colour in any format, such as #1e90ff, rgb(30 144 255) or hsl(210 100% 56%), or use the picker.",
    "Copy the format you need: HEX, RGB, HSL, HSV or CMYK.",
    "Check the contrast rows to see whether text in this colour is readable on white or black.",
  ],
  examples: [
    { title: "A HEX code", input: "#f4511e", output: "#f4511e\nrgb(244 81 30)\nhsl(14 91% 54%)\nhsv(14, 88%, 96%)\ncmyk(0%, 67%, 88%, 4%)\nContrast with white 3.48:1 (AA large text only), with black 6.04:1 (AA)" },
    { title: "An RGB value", input: "rgb(30 144 255)", output: "#1e90ff\nrgb(30 144 255)\nhsl(210 100% 56%)\nhsv(210, 88%, 100%)\ncmyk(88%, 44%, 0%, 0%)\nContrast with white 3.24:1 (AA large text only), with black 6.49:1 (AA)" },
    { title: "An HSL value", input: "hsl(150 60% 40%)", output: "#29a366\nrgb(41 163 102)\nhsl(150 60% 40%)\nhsv(150, 75%, 64%)\ncmyk(75%, 0%, 37%, 36%)\nContrast with white 3.22:1 (AA large text only), with black 6.53:1 (AA)" },
  ],
  limitations: [
    "CMYK values are a simple mathematical conversion. Real print colours depend on the printer’s colour profile, so ask your printer for exact values.",
    "Reads HEX, rgb(), rgba(), hsl(), hsla() and 20 basic colour names. Other CSS colour names, hwb(), lab() and oklch() are not supported yet.",
    "Values are rounded to whole numbers, so converting back and forth can shift a channel by 1.",
  ],
  faq: [
    {
      question: "How do I convert HEX to RGB?",
      answer:
        "Split the six digits into three pairs and read each pair as a base-16 number: #1e90ff becomes 1e = 30, 90 = 144, ff = 255, so rgb(30 144 255).",
    },
    {
      question: "What contrast ratio do I need?",
      answer:
        "WCAG 2 asks for at least 4.5:1 for normal text and 3:1 for large text (about 24 px, or 19 px bold) at level AA. Level AAA asks for 7:1.",
    },
    {
      question: "What is the difference between HSL and HSV?",
      answer:
        "Both describe hue and saturation, but HSL’s lightness runs from black through the pure colour to white, while HSV’s value runs from black to the pure colour. Design apps often use HSV in their pickers; CSS uses HSL.",
    },
  ],
  related: ["gradient-generator", "css-formatter", "qr-code-generator"],
};
