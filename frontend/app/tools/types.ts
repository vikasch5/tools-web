import type { EngineAction, EngineId, OptionValue } from "./engine/types";

export type ToolAction = {
  id: EngineAction;
  label: string;
  /** Download extension when this action produced the output. */
  downloadExtension?: string;
};

export type ToolOption =
  | {
      type: "segmented";
      id: string;
      label: string;
      choices: { value: string; label: string }[];
      default: string;
    }
  | { type: "switch"; id: string; label: string; default: boolean };

export type ToolExample = {
  title: string;
  input: string;
  output: string;
};

/** Long-form page content shared by every tool. */
type ToolContentBase = {
  slug: string;
  category: string;
  name: string;
  /** <title>, 50–60 characters. */
  metaTitle: string;
  /** Meta description and intro, ~150 characters. */
  description: string;
  /** "About" section: what the tool is for and when to use it, 2–3 paragraphs. */
  overview: string[];
  howTo: string[];
  examples: ToolExample[];
  limitations: string[];
  faq: { question: string; answer: string }[];
  related: string[];
};

/** Text in, text out: rendered by the shared two-pane ToolWorkspace. */
export type TextToolDefinition = ToolContentBase & {
  workspace: "text";
  engine: EngineId;
  /** First action is the primary one (and Ctrl/Cmd+Enter). */
  actions: ToolAction[];
  options: ToolOption[];
  /** Fixed engine options merged under the user-facing ones. */
  engineOptions?: Record<string, OptionValue>;
  /** Language label shown on the panes, e.g. "JSON". */
  language: string;
  /** File extensions accepted by "Open file" and drag-and-drop. */
  accept: string[];
  /** Extension used for "Download". */
  downloadExtension: string;
  sample: string;
  /** Input placeholder, when "Paste <language> to <action> it" reads badly. */
  placeholder?: string;
  /** Offer the JSON tree view for the output. */
  tree?: boolean;
};

/**
 * Tools whose input is not a single text (files, two texts, numbers,
 * colours). Each id maps to a panel in components/tool/widgets.
 */
export type WidgetId =
  | "word-counter"
  | "diff-checker"
  | "uuid-generator"
  | "gradient-generator"
  | "percentage-calculator"
  | "compress-image"
  | "resize-image"
  | "passport-photo"
  | "merge-pdf"
  | "split-pdf"
  | "image-converter"
  | "rotate-pdf"
  | "pdf-to-image"
  | "case-converter"
  | "password-generator"
  | "qr-code-generator"
  | "lorem-ipsum"
  | "image-to-pdf"
  | "age-calculator"
  | "bmi-calculator"
  | "loan-calculator"
  | "timestamp-converter"
  | "hash-generator"
  | "color-converter"
  | "compress-pdf"
  | "word-to-pdf"
  | "pdf-to-word"
  | "organize-pdf"
  | "delete-pdf-pages"
  | "add-page-numbers"
  | "watermark-pdf"
  | "protect-pdf"
  | "unlock-pdf"
  | "form-photo";

/** Starting settings for a widget on a landing page, e.g. { targetKb: 50 }. */
export type WidgetPreset = Record<string, string | number>;

export type WidgetToolDefinition = ToolContentBase & {
  workspace: WidgetId;
  /** Landing-page variants of a tool open the same widget with these settings. */
  preset?: WidgetPreset;
};

/**
 * Everything a tool page needs. Definitions are plain data, loaded by the
 * route loader on the server, so their long-form content does not ship in
 * the client JavaScript bundle.
 */
export type ToolDefinition = TextToolDefinition | WidgetToolDefinition;

export type ToolOptionValues = Record<string, OptionValue>;
