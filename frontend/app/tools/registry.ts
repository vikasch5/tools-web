import type { ToolDefinition } from "./types";
import { jsonFormatter } from "./defs/json-formatter";
import { cssFormatter, cssMinifier } from "./defs/css";
import { jsFormatter, jsMinifier } from "./defs/js";
import { htmlFormatter, htmlMinifier } from "./defs/html";
import { sqlFormatter } from "./defs/sql";
import { xmlFormatter } from "./defs/xml";
import { yamlJson } from "./defs/yaml";
import { base64, jwtDecoder, urlEncoder } from "./defs/encoding";
import { csvToJson } from "./defs/csv";
import { diffChecker, wordCounter } from "./defs/text";
import { uuidGenerator } from "./defs/generators";
import { gradientGenerator } from "./defs/design";
import { percentageCalculator } from "./defs/calculators";
import { compressImage, imageConverter, passportPhoto, resizeImage } from "./defs/images";
import { mergePdf, pdfToImage, rotatePdf, splitPdf } from "./defs/pdf";

/** Full definitions of working tools. Import from loaders only. */
export const toolDefinitions: ToolDefinition[] = [
  jsonFormatter,
  cssFormatter,
  cssMinifier,
  jsFormatter,
  jsMinifier,
  htmlFormatter,
  htmlMinifier,
  xmlFormatter,
  sqlFormatter,
  base64,
  jwtDecoder,
  urlEncoder,
  mergePdf,
  splitPdf,
  rotatePdf,
  pdfToImage,
  compressImage,
  resizeImage,
  passportPhoto,
  imageConverter,
  wordCounter,
  diffChecker,
  csvToJson,
  yamlJson,
  gradientGenerator,
  uuidGenerator,
  percentageCalculator,
];

export function getToolDefinition(category: string, slug: string) {
  return toolDefinitions.find((t) => t.category === category && t.slug === slug);
}
