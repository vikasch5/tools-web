import type { ToolOption } from "../types";

export const indentOption: ToolOption = {
  type: "segmented",
  id: "indent",
  label: "Indent",
  choices: [
    { value: "2", label: "2 spaces" },
    { value: "4", label: "4 spaces" },
    { value: "tab", label: "Tab" },
  ],
  default: "2",
};

export const printWidthOption: ToolOption = {
  type: "segmented",
  id: "printWidth",
  label: "Line width",
  choices: [
    { value: "80", label: "80" },
    { value: "100", label: "100" },
    { value: "120", label: "120" },
  ],
  default: "80",
};

export const privacyFaq = {
  question: "Is my code uploaded to a server?",
  answer:
    "No. Processing happens entirely in your browser, in a background thread. Your input is never sent to our servers or stored anywhere.",
};

export const textPrivacyFaq = {
  question: "Is my text uploaded to a server?",
  answer:
    "No. Everything is processed in your browser. Your text is never sent to our servers or stored anywhere.",
};

export const filePrivacyFaq = {
  question: "Are my files uploaded?",
  answer:
    "No. Files are opened and processed in your browser, in a background thread. Nothing is uploaded, so the tool also works for confidential documents.",
};
