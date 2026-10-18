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
  overview: [
    "Base64 represents any data using 64 safe characters (A–Z, a–z, 0–9, + and /), so it can travel through systems that only handle text. You meet it in email attachments, data: URLs, HTTP Basic authentication headers, JSON Web Tokens and many API payloads.",
    "Encoding makes data about a third larger, so it is about compatibility, not compression or security. This tool encodes and decodes text as UTF-8, so accented letters, non-Latin scripts and emoji round-trip correctly. The URL-safe variant swaps + and / for - and _, which is what tokens and URL parameters use.",
  ],
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
  overview: [
    "A JSON Web Token (JWT) is a compact, signed token that many sign-in systems and APIs use to carry identity and permissions. It has three parts separated by dots: a header describing the algorithm, a payload of claims such as the user ID and expiry time, and a signature.",
    "The header and payload are only Base64URL-encoded, not encrypted, so anyone holding a token can read them. Decoding is useful when debugging authentication: checking which scopes a token grants, whether it has expired, or which issuer and audience it was made for. Because the decoding happens in your browser, the token is never sent to a server, which matters since a valid token can grant access to an account.",
  ],
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

export const urlEncoder: TextToolDefinition = {
  workspace: "text",
  slug: "url-encoder",
  category: "developer-tools",
  name: "URL Encode / Decode",
  metaTitle: "URL Encode and Decode – Percent-Encoding Online",
  description:
    "Percent-encode text for URLs, decode %20-style escapes, and split a URL into its parts and query parameters. Full UTF-8 support, in your browser.",
  engine: "url",
  actions: [
    { id: "encode", label: "Encode" },
    { id: "decode", label: "Decode" },
    { id: "parse", label: "Parse URL", downloadExtension: "json" },
  ],
  options: [
    {
      type: "segmented",
      id: "mode",
      label: "Style",
      choices: [
        { value: "component", label: "Component" },
        { value: "uri", label: "Full URL" },
        { value: "form", label: "Form (+)" },
      ],
      default: "component",
    },
  ],
  language: "Text",
  accept: [".txt"],
  downloadExtension: "txt",
  placeholder: "Paste text to encode, or an encoded URL to decode or parse…",
  sample: `https://shop.example.com/search?q=red shoes&tag=sale&tag=new#results`,
  overview: [
    "URLs can only contain a limited set of characters. Spaces, accented letters and symbols like & or # must be percent-encoded (for example, a space becomes %20) or they break the address or change its meaning.",
    "Encoding is needed when you build query strings by hand, pass a URL inside another URL (such as a redirect parameter), or prepare values for an API. Decoding turns escaped text from logs, analytics or browser address bars back into something readable. The URL parser splits an address into its scheme, host, path, query parameters and fragment, which helps when debugging tracking links or long redirect chains.",
  ],
  howTo: [
    "Paste text or a URL, open a file, or load the sample.",
    "Pick how to encode: Component for a single query value or path segment, Full URL to keep : / ? & = intact, or Form to turn spaces into +.",
    "Press Encode or Decode. Decoding reports the position of a broken % escape.",
    "Press Parse URL to see the scheme, host, path, decoded query parameters and fragment as JSON.",
  ],
  examples: [
    {
      title: "Encode a query value",
      input: `red shoes & bags`,
      output: `red%20shoes%20%26%20bags`,
    },
    {
      title: "Accented and non-Latin text becomes UTF-8 escapes",
      input: `café/東京`,
      output: `caf%C3%A9%2F%E6%9D%B1%E4%BA%AC`,
    },
  ],
  limitations: [
    "Component mode also escapes ! ' ( ) and *, following RFC 3986. Full URL mode cannot tell a literal & or = in a value from one that separates parameters, so encode values one by one in Component mode when that matters.",
    "Parse URL needs a complete URL with a scheme, such as https://. Passwords in a URL are shown as (hidden).",
    "Decoding does not turn + into a space unless Form is selected, because + is a literal plus sign outside form data.",
  ],
  faq: [
    {
      question: "What is the difference between %20 and +?",
      answer:
        "Both can mean a space. %20 works anywhere in a URL. + means a space only in form-encoded query strings (application/x-www-form-urlencoded); elsewhere it is a literal plus.",
    },
    {
      question: "Why does decoding say the escapes are not valid UTF-8?",
      answer:
        "The text was probably encoded with an older character set such as Latin-1. Each % escape is a byte, and those bytes do not form valid UTF-8 characters.",
    },
    privacyFaq,
  ],
  related: ["base64", "jwt-decoder", "json-formatter"],
};
