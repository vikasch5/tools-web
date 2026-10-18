import type { EngineAction, EngineId, OptionValue } from "./engine/types";

export type ToolAction = {
  id: EngineAction;
  label: string;
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

/**
 * Everything a tool page needs. Definitions are plain data, loaded by the
 * route loader on the server, so their long-form content does not ship in
 * the client JavaScript bundle.
 */
export type ToolDefinition = {
  slug: string;
  category: string;
  name: string;
  /** <title>, 50–60 characters. */
  metaTitle: string;
  /** Meta description and intro, ~150 characters. */
  description: string;
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
  howTo: string[];
  examples: ToolExample[];
  limitations: string[];
  faq: { question: string; answer: string }[];
  related: string[];
};

export type ToolOptionValues = Record<string, OptionValue>;
