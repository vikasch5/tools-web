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
import { caseConverter, diffChecker, wordCounter } from "./defs/text";
import { loremIpsum, passwordGenerator, qrCodeGenerator, uuidGenerator } from "./defs/generators";
import { colorConverter, gradientGenerator } from "./defs/design";
import { ageCalculator, bmiCalculator, loanCalculator, percentageCalculator } from "./defs/calculators";
import { compressImage, imageConverter, passportPhoto, resizeImage } from "./defs/images";
import { imageToPdf, mergePdf, pdfToImage, rotatePdf, splitPdf } from "./defs/pdf";
import { hashGenerator, timestampConverter } from "./defs/utilities";
import {
  addPageNumbers,
  compressPdf,
  deletePdfPages,
  organizePdf,
  pdfToWord,
  protectPdf,
  unlockPdf,
  watermarkPdf,
  wordToPdf,
} from "./defs/pdf-more";

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
  timestampConverter,
  hashGenerator,
  mergePdf,
  splitPdf,
  rotatePdf,
  pdfToImage,
  imageToPdf,
  compressPdf,
  wordToPdf,
  pdfToWord,
  organizePdf,
  deletePdfPages,
  addPageNumbers,
  watermarkPdf,
  protectPdf,
  unlockPdf,
  compressImage,
  resizeImage,
  passportPhoto,
  imageConverter,
  wordCounter,
  diffChecker,
  caseConverter,
  csvToJson,
  yamlJson,
  gradientGenerator,
  colorConverter,
  uuidGenerator,
  passwordGenerator,
  qrCodeGenerator,
  loremIpsum,
  percentageCalculator,
  ageCalculator,
  bmiCalculator,
  loanCalculator,
];

export function getToolDefinition(category: string, slug: string) {
  return toolDefinitions.find((t) => t.category === category && t.slug === slug);
}
