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
