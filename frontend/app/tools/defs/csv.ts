import type { TextToolDefinition } from "../types";
import { indentOption, textPrivacyFaq } from "./shared";

export const csvToJson: TextToolDefinition = {
  workspace: "text",
  slug: "csv-to-json",
  category: "converters",
  name: "CSV to JSON Converter",
  metaTitle: "CSV to JSON Converter – Turn Spreadsheet Rows into JSON",
  description:
    "Convert CSV or TSV into a JSON array of objects. Detects the delimiter, handles quoted fields and line breaks, and turns numbers into numbers.",
  engine: "csv",
  actions: [{ id: "convert", label: "Convert" }],
  options: [
    {
      type: "segmented",
      id: "delimiter",
      label: "Delimiter",
      choices: [
        { value: "auto", label: "Auto" },
        { value: ",", label: "Comma" },
        { value: ";", label: "Semicolon" },
        { value: "tab", label: "Tab" },
      ],
      default: "auto",
    },
    { type: "switch", id: "header", label: "First row is header", default: true },
    { type: "switch", id: "types", label: "Detect numbers", default: true },
    indentOption,
  ],
  language: "CSV",
  accept: [".csv", ".tsv", ".txt"],
  downloadExtension: "json",
  tree: true,
  sample: `id,name,email,plan,seats,active
1,Ada Lovelace,ada@example.com,Team,5,true
2,"Hopper, Grace",grace@example.com,Business,25,true
3,Alan Turing,alan@example.com,Free,1,false`,
  howTo: [
    "Paste rows copied from a spreadsheet, open a .csv or .tsv file, or load the sample. It converts straight away.",
    "Leave the delimiter on Auto, or pick one if your file uses semicolons (common in European Excel exports) or tabs.",
    "With “First row is header” on, each row becomes an object keyed by the column names; turn it off to get arrays.",
    "“Detect numbers” turns 42 and 3.5 into JSON numbers and true or false into booleans. Turn it off to keep every value as text.",
    "Switch the output to Tree to check the result, then copy it or download a .json file.",
  ],
  examples: [
    {
      title: "Rows with a header",
      input: "name,age,city\nAda,36,London\nGrace,85,New York",
      output: "[\n  {\n    \"name\": \"Ada\",\n    \"age\": 36,\n    \"city\": \"London\"\n  },\n  {\n    \"name\": \"Grace\",\n    \"age\": 85,\n    \"city\": \"New York\"\n  }\n]",
    },
    {
      title: "Quoted values with commas and quotes",
      input: 'sku;title;price\nA-1;"Desk, oak";249.5\nB-2;"The ""Pro"" chair";189',
      output: "[\n  {\n    \"sku\": \"A-1\",\n    \"title\": \"Desk, oak\",\n    \"price\": 249.5\n  },\n  {\n    \"sku\": \"B-2\",\n    \"title\": \"The \\\"Pro\\\" chair\",\n    \"price\": 189\n  }\n]",
    },
  ],
  limitations: [
    "Numbers that would lose precision as JSON numbers (such as 16-digit IDs) and values with leading zeros (like 007 or ZIP codes) are kept as text.",
    "Empty cells become empty strings, not null, so no data is lost.",
    "Files up to 5 MB can be opened; very large exports are better converted with a command-line tool.",
  ],
  faq: [
    {
      question: "My Excel CSV uses semicolons. Will it work?",
      answer:
        "Yes. Auto picks whichever of comma, semicolon, tab or pipe appears most in the first row. If it guesses wrong, choose the delimiter yourself.",
    },
    {
      question: "What happens to duplicate or empty column names?",
      answer:
        "Empty headers become column_1, column_2 and so on, and repeated names get a suffix (email, email_2), so no value overwrites another.",
    },
    {
      question: "What if a row has more or fewer values than the header?",
      answer:
        "Missing values become empty strings. Extra values are kept under column_N keys, so you can spot the problem in the output.",
    },
    textPrivacyFaq,
  ],
  related: ["json-formatter", "sql-formatter", "diff-checker"],
};
