import type { ToolDefinition } from "./types";
import { jsonFormatter } from "./defs/json-formatter";
import { cssFormatter, cssMinifier } from "./defs/css";
import { jsFormatter, jsMinifier } from "./defs/js";
import { htmlFormatter } from "./defs/html";

/** Full definitions of working tools. Import from loaders only. */
export const toolDefinitions: ToolDefinition[] = [
  jsonFormatter,
  cssFormatter,
  cssMinifier,
  jsFormatter,
  jsMinifier,
  htmlFormatter,
];

export function getToolDefinition(category: string, slug: string) {
  return toolDefinitions.find((t) => t.category === category && t.slug === slug);
}
