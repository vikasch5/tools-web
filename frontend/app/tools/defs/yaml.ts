import type { TextToolDefinition } from "../types";
import { privacyFaq } from "./shared";

export const yamlJson: TextToolDefinition = {
  workspace: "text",
  slug: "yaml-to-json",
  category: "converters",
  name: "YAML ⇄ JSON Converter",
  metaTitle: "YAML to JSON Converter – and JSON to YAML, Online",
  description:
    "Convert YAML to JSON and JSON back to YAML. Anchors, merge keys and multi-document files are supported, and errors show the line. Runs in your browser.",
  engine: "yaml",
  actions: [
    { id: "to-json", label: "YAML → JSON", downloadExtension: "json" },
    { id: "to-yaml", label: "JSON → YAML", downloadExtension: "yaml" },
  ],
  options: [
    {
      type: "segmented",
      id: "indent",
      label: "Indent",
      choices: [
        { value: "2", label: "2 spaces" },
        { value: "4", label: "4 spaces" },
      ],
      default: "2",
    },
  ],
  language: "YAML or JSON",
  accept: [".yaml", ".yml", ".json", ".txt"],
  downloadExtension: "json",
  placeholder: "Paste YAML or JSON to convert it instantly…",
  sample: `# Service config
service: checkout
replicas: 3
defaults: &defaults
  timeout: 30
  retries: 2
environments:
  staging:
    <<: *defaults
    url: https://staging.example.com
  production:
    <<: *defaults
    timeout: 10
    url: https://example.com
features: [payments, coupons]
maintenance: null
`,
  overview: [
    "YAML is popular for configuration because it is easy to read and write: Kubernetes manifests, Docker Compose files, CI pipelines, OpenAPI specifications and many app settings use it. JSON is stricter and is what most programs and APIs consume.",
    "Converting YAML to JSON shows exactly how a parser will interpret your file, which helps catch indentation mistakes and surprising values. Converting JSON to YAML is a quick way to start a readable configuration from an API response or an existing JSON file. Anchors, aliases, merge keys and multi-document files are supported.",
  ],
  howTo: [
    "Paste YAML or JSON, open a .yaml, .yml or .json file, or load the sample. Pasting, opening a file or loading the sample runs it automatically.",
    "Press YAML → JSON to convert YAML, or JSON → YAML to go the other way.",
    "Choose 2 or 4 spaces of indentation for the result.",
    "Copy the result, or download it as .json or .yaml depending on the direction.",
  ],
  examples: [
    {
      title: "Nested YAML to JSON",
      input: `name: shop\nports:\n  - 80\n  - 443\ndebug: false`,
      output: `{\n  "name": "shop",\n  "ports": [\n    80,\n    443\n  ],\n  "debug": false\n}`,
    },
    {
      title: "Anchors and merge keys are expanded",
      input: `base: &base\n  retries: 3\nprod:\n  <<: *base\n  host: example.com`,
      output: `{\n  "base": {\n    "retries": 3\n  },\n  "prod": {\n    "retries": 3,\n    "host": "example.com"\n  }\n}`,
    },
  ],
  limitations: [
    "Comments are not carried over: JSON has no comments, so they are dropped when converting YAML to JSON.",
    "Values follow YAML 1.2, so yes, no, on and off stay as text rather than becoming true or false. Dates also stay as text.",
    "Files with several documents separated by --- become a JSON array, one item per document.",
    "Aliases are expanded up to a fixed limit, so a file built to explode in size (a “billion laughs” file) is rejected rather than freezing the page.",
  ],
  faq: [
    {
      question: "Why does my YAML report “Tabs are not allowed as indentation”?",
      answer: "YAML only allows spaces for indentation. Replace the tabs at the start of the reported line with spaces.",
    },
    {
      question: "Can I convert Kubernetes or Docker Compose files?",
      answer:
        "Yes. Multi-document Kubernetes manifests become a JSON array, and Compose files with anchors and merge keys are expanded.",
    },
    privacyFaq,
  ],
  related: ["json-formatter", "csv-to-json", "xml-formatter"],
};
