import type { ToolDefinition } from "./types";
import { jsonFormatter } from "./defs/json-formatter";
import { cssFormatter, cssMinifier } from "./defs/css";
import { jsFormatter, jsMinifier } from "./defs/js";
import { htmlFormatter } from "./defs/html";
import { sqlFormatter } from "./defs/sql";
import { base64, jwtDecoder } from "./defs/encoding";
import { csvToJson } from "./defs/csv";
import { diffChecker, wordCounter } from "./defs/text";
import { uuidGenerator } from "./defs/generators";
import { gradientGenerator } from "./defs/design";
import { percentageCalculator } from "./defs/calculators";
import { compressImage, passportPhoto, resizeImage } from "./defs/images";
import { mergePdf, splitPdf } from "./defs/pdf";

/** Full definitions of working tools. Import from loaders only. */
export const toolDefinitions: ToolDefinition[] = [
  jsonFormatter,
  cssFormatter,
  cssMinifier,
  jsFormatter,
  jsMinifier,
  htmlFormatter,
  sqlFormatter,
  base64,
  jwtDecoder,
  mergePdf,
  splitPdf,
  compressImage,
  resizeImage,
  passportPhoto,
  wordCounter,
  diffChecker,
  csvToJson,
  gradientGenerator,
  uuidGenerator,
  percentageCalculator,
];

export function getToolDefinition(category: string, slug: string) {
  return toolDefinitions.find((t) => t.category === category && t.slug === slug);
}
