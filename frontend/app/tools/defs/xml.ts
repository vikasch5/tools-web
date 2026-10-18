import type { TextToolDefinition } from "../types";
import { indentOption, privacyFaq } from "./shared";

export const xmlFormatter: TextToolDefinition = {
  workspace: "text",
  slug: "xml-formatter",
  category: "developer-tools",
  name: "XML Formatter & Validator",
  metaTitle: "XML Formatter – Beautify, Minify and Validate XML",
  description:
    "Format, minify and check XML in your browser. Mismatched tags, unquoted attributes and unescaped characters are reported with line and column.",
  engine: "xml",
  actions: [
    { id: "format", label: "Format" },
    { id: "minify", label: "Minify" },
    { id: "validate", label: "Validate" },
  ],
  options: [
    indentOption,
    { type: "switch", id: "keepComments", label: "Keep comments when minifying", default: false },
  ],
  language: "XML",
  accept: [".xml", ".svg", ".rss", ".atom", ".xsd", ".xsl", ".plist", ".txt"],
  downloadExtension: "xml",
  sample: `<?xml version="1.0" encoding="UTF-8"?><catalog><!-- Two books --><book id="bk101" available="true"><title>XML Developer's Guide</title><author>Gambardella, Matthew</author><price currency="USD">44.95</price></book><book id="bk102" available="false"><title>Midnight Rain</title><author>Ralls, Kim</author><price currency="USD">5.95</price><tags><tag>fantasy</tag><tag>bestseller</tag></tags></book></catalog>`,
  howTo: [
    "Paste your XML, open a file (.xml, .svg, .rss and more), or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Choose an indent size.",
    "Press Format to indent it, Minify to remove whitespace between tags, or Validate to check it without changing the output.",
    "If the XML is not well-formed, the error shows the line and column. Fix it and run again.",
  ],
  examples: [
    {
      title: "Indent nested elements",
      input: `<order id="7"><item sku="A1">Pen</item><item sku="B2">Paper</item><note/></order>`,
      output: `<order id="7">\n  <item sku="A1">Pen</item>\n  <item sku="B2">Paper</item>\n  <note/>\n</order>`,
    },
    {
      title: "Mismatched closing tag",
      input: `<order><item>Pen</order>`,
      output: "Error on line 1, column 18: expected </item> but found </order>.",
    },
  ],
  limitations: [
    "This checks that XML is well-formed: balanced tags, one root element, quoted and unique attributes, escaped “<” and “&”. It does not validate against a DTD or XML Schema (XSD).",
    "Formatting trims whitespace at the start and end of text, and puts text in mixed content (text next to child elements) on its own line. If spacing inside text matters, use Minify, which keeps text exactly as written.",
    "Attributes stay on the same line as their tag.",
  ],
  faq: [
    {
      question: "Can I format SVG or RSS files?",
      answer: "Yes. SVG, RSS, Atom and plist files are XML, so they can be formatted and checked here.",
    },
    {
      question: "Why is “&” reported as an error?",
      answer:
        "In XML a bare “&” starts an entity such as &amp; or &#169;. Write &amp; for a literal ampersand, or wrap the text in a CDATA section.",
    },
    privacyFaq,
  ],
  related: ["html-formatter", "json-formatter", "html-minifier"],
};
