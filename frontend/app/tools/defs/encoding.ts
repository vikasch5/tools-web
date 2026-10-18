import type { TextToolDefinition } from "../types";
import { privacyFaq } from "./shared";

export const base64: TextToolDefinition = {
  workspace: "text",
  slug: "base64",
  category: "developer-tools",
  name: "Base64 Encode / Decode",
  metaTitle: "Base64 Encode and Decode – Text to Base64 Online",
  description:
    "Encode text to Base64 or decode Base64 back to readable text. Full UTF-8 support, URL-safe output and tolerant decoding.",
  engine: "base64",
  actions: [
    { id: "encode", label: "Encode" },
    { id: "decode", label: "Decode" },
  ],
  options: [
    { type: "switch", id: "urlSafe", label: "URL-safe", default: false },
    { type: "switch", id: "wrap", label: "Wrap at 76", default: false },
  ],
  language: "Text",
  accept: [".txt", ".b64", ".json", ".csv", ".xml", ".html"],
  downloadExtension: "txt",
  sample: "Hello, world! Grüße aus Köln 👋",
  howTo: [
    "Paste text into the input panel or open a text file. Pasted text is encoded immediately.",
    "Press Encode to turn text into Base64, or Decode to turn Base64 back into text.",
    "Turn on URL-safe to use - and _ instead of + and /, without = padding, for tokens and URLs.",
    "Turn on Wrap at 76 to break long output into lines, as email (MIME) and PEM files expect.",
    "Use the swap button to feed the output back in, for example to check that decoding returns your original text.",
  ],
  examples: [
    { title: "Encode text with accents and emoji", input: "Grüße 👋", output: "R3LDvMOfZSDwn5GL" },
    { title: "Encode a simple ASCII string", input: "user:password", output: "dXNlcjpwYXNzd29yZA==" },
  ],
  limitations: [
    "This page works with text. Decoding Base64 that holds a binary file (an image, a PDF) reports that the result is not text instead of showing garbled characters.",
    "Text is encoded as UTF-8, which is what the web, JSON and most APIs expect. Legacy encodings such as Windows-1252 are not offered.",
    "Base64 is an encoding, not encryption. Anyone can decode it, so never use it to hide passwords or secrets.",
  ],
  faq: [
    {
      question: "What is Base64 used for?",
      answer:
        "Base64 turns any data into 64 safe ASCII characters so it can travel through systems built for text: email attachments, data: URLs, JSON payloads, HTTP Basic authentication headers and JWTs.",
    },
    {
      question: "What does URL-safe Base64 change?",
      answer:
        "It replaces + with - and / with _, and drops the = padding, so the result can sit in a URL or filename without escaping. Decoding accepts both forms automatically.",
    },
    {
      question: "Why is my Base64 string longer than the original?",
      answer:
        "Every 3 bytes become 4 characters, so Base64 is about 33% larger than the data it encodes. Characters outside ASCII take 2 to 4 bytes in UTF-8, which adds more.",
    },
    {
      question: "Why does decoding fail?",
      answer:
        "The input contains a character that is not part of Base64, padding in the middle, or a length that cannot be valid. Spaces and line breaks are ignored, so wrapped input is fine.",
    },
    privacyFaq,
  ],
  related: ["jwt-decoder", "json-formatter", "uuid-generator"],
};

export const jwtDecoder: TextToolDefinition = {
  workspace: "text",
  slug: "jwt-decoder",
  category: "developer-tools",
  name: "JWT Decoder",
  metaTitle: "JWT Decoder – Inspect JSON Web Token Header and Payload",
  description:
    "Decode a JSON Web Token to read its header and claims, with readable issue and expiry times. Tokens are decoded locally and never sent anywhere.",
  engine: "jwt",
  actions: [{ id: "decode", label: "Decode" }],
  options: [],
  language: "JWT",
  accept: [".txt", ".jwt"],
  downloadExtension: "json",
  tree: true,
  sample:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEwMjQiLCJuYW1lIjoiQWRhIExvdmVsYWNlIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkyMjgxNjAwLCJleHAiOjE3OTIyODUyMDB9.sj_mdtVW0-HSaWARdcfUltf1Y2TP8ymIf1QJe3aNtW0",
  howTo: [
    "Paste a token into the input panel. A leading “Bearer ” is removed for you.",
    "The header and payload are decoded straight away and shown as formatted JSON.",
    "The status bar shows when the token was issued and when it expires, and warns if it has expired or is unsigned.",
    "Switch the output to Tree to browse nested claims and copy any value.",
  ],
  examples: [
    {
      title: "Decode an access token",
      input:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInNjb3BlIjoicmVhZDpvcmRlcnMiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDA3MDgwMH0.k7-PWNqLx40yD4h9J3DnTtmMcrGk0ZunfPgqt6-5ZN0",
      output: "{\n  \"header\": {\n    \"alg\": \"HS256\",\n    \"typ\": \"JWT\"\n  },\n  \"payload\": {\n    \"sub\": \"42\",\n    \"scope\": \"read:orders\",\n    \"iat\": 1704067200,\n    \"exp\": 1704070800\n  },\n  \"signature\": \"k7-PWNqLx40yD4h9J3DnTtmMcrGk0ZunfPgqt6-5ZN0\"\n}",
    },
  ],
  limitations: [
    "The signature is not verified: verifying needs the secret or public key, which should never be pasted into a website. Treat decoded claims as unconfirmed.",
    "Encrypted tokens (JWE, five parts) cannot be read without the key and are reported as such.",
    "Expiry is checked against your device clock, so a wrong system time gives a wrong result.",
  ],
  faq: [
    {
      question: "Is it safe to paste a real token here?",
      answer:
        "Decoding happens entirely in your browser and nothing is sent or stored. Still, a valid token is a credential: avoid sharing screenshots of it, and prefer expired or test tokens when you can.",
    },
    {
      question: "Why does the tool not check the signature?",
      answer:
        "Checking a signature needs the signing secret (HS256) or the issuer’s public key (RS256, ES256). Your server should do that. This tool is for reading what a token claims, which is what you need while debugging.",
    },
    {
      question: "What do iat, exp and nbf mean?",
      answer:
        "They are Unix timestamps in seconds: iat is when the token was issued, exp when it stops being valid, and nbf the time before which it must not be accepted. The status bar shows them as UTC dates.",
    },
    privacyFaq,
  ],
  related: ["base64", "json-formatter", "uuid-generator"],
};
