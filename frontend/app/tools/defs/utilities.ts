import type { WidgetToolDefinition } from "../types";
import { filePrivacyFaq } from "./shared";

export const timestampConverter: WidgetToolDefinition = {
  workspace: "timestamp-converter",
  slug: "timestamp-converter",
  category: "developer-tools",
  name: "Unix Timestamp Converter",
  metaTitle: "Unix Timestamp Converter – Epoch to Date and Back",
  description:
    "Convert Unix epoch timestamps in seconds, milliseconds or microseconds to readable dates in UTC and your time zone, and turn dates back into timestamps.",
  overview: [
    "Computers often store time as a Unix timestamp: the number of seconds since 1 January 1970 at midnight UTC. You see these numbers in databases, log files, APIs, JWT tokens and analytics exports, where they are compact and easy to compare but impossible to read at a glance.",
    "This converter turns a timestamp into an ISO 8601 date, a UTC date and the time in your own time zone, plus how long ago or how far ahead it is. It recognises seconds, milliseconds, microseconds and nanoseconds from the size of the number, so values from JavaScript, Python, Java or Go all work. It also goes the other way: type a date such as 2026-10-18 14:30 and get its timestamp.",
  ],
  howTo: [
    "Paste a timestamp, type a date, or press “Use current time”.",
    "Leave the unit on Auto, or choose seconds, milliseconds or microseconds if the guess is wrong.",
    "Copy any format: Unix seconds or milliseconds, ISO 8601, UTC, your local time or the relative time.",
  ],
  examples: [
    { title: "Seconds", input: "1700000000", output: "Unix time in seconds\nISO 8601: 2023-11-14T22:13:20.000Z\nUnix seconds: 1700000000\nUnix milliseconds: 1700000000000" },
    { title: "Milliseconds (JavaScript Date.now())", input: "1700000000123", output: "Unix time in milliseconds\nISO 8601: 2023-11-14T22:13:20.123Z\nUnix seconds: 1700000000\nUnix milliseconds: 1700000000123" },
    { title: "A date with a time zone offset", input: "2026-10-18T12:00:00+05:30", output: "Date text\nISO 8601: 2026-10-18T06:30:00.000Z\nUnix seconds: 1792305000\nUnix milliseconds: 1792305000000" },
  ],
  limitations: [
    "Auto-detection reads numbers up to 11 digits as seconds, which covers dates up to the year 5138. Pick the unit yourself for unusual values.",
    "Date text is read by your browser. ISO 8601 (2026-10-18T14:30:00Z) works everywhere; other formats such as “18/10/2026” may be read differently or not at all.",
    "Unix time ignores leap seconds, as almost all systems do, and nanosecond values lose precision below a microsecond.",
  ],
  faq: [
    {
      question: "What is the Unix epoch?",
      answer: "00:00:00 UTC on 1 January 1970. A Unix timestamp counts seconds from that moment; negative values are dates before 1970.",
    },
    {
      question: "Is my timestamp in seconds or milliseconds?",
      answer:
        "Current dates are 10 digits in seconds (such as 1700000000) and 13 digits in milliseconds. JavaScript and Java use milliseconds; most databases, PHP and Unix tools use seconds.",
    },
    {
      question: "What is the year 2038 problem?",
      answer:
        "Systems that store seconds in a signed 32-bit integer overflow on 19 January 2038. Modern systems use 64-bit values, which last for billions of years.",
    },
    {
      question: "Does it use my time zone?",
      answer: "The local line uses your device’s time zone, shown next to it. The ISO and UTC lines are always in UTC.",
    },
  ],
  related: ["jwt-decoder", "uuid-generator", "json-formatter"],
};

export const hashGenerator: WidgetToolDefinition = {
  workspace: "hash-generator",
  slug: "hash-generator",
  category: "developer-tools",
  name: "Hash Generator (MD5, SHA-256)",
  metaTitle: "Hash Generator – MD5, SHA-1, SHA-256 and SHA-512",
  description:
    "Generate MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or any file, and check a download against its published checksum. Runs in your browser.",
  overview: [
    "A hash function turns any amount of data into a short, fixed-length fingerprint. Change a single character or byte and the hash changes completely, so hashes are used to check that a downloaded file is intact, to detect duplicates, to build cache keys and to sign data.",
    "This tool computes the common algorithms at once for text or for a file. Paste the checksum a software vendor publishes and it tells you which algorithm matches, or warns you if nothing does, which can mean a corrupted or tampered download. SHA-256 and SHA-512 are the modern choices; MD5 and SHA-1 are still widely used for checksums but are no longer safe where an attacker could craft a collision. Files are read on your device and never uploaded, so this works for private documents too.",
  ],
  howTo: [
    "Choose Text and type or paste, or choose File and pick any file (up to 200 MB).",
    "Every hash appears at once. Turn on Uppercase if the system you are comparing with uses capital letters.",
    "To verify a download, paste the expected checksum into “Compare with a checksum”. The status bar says whether it matches and which algorithm it is.",
  ],
  examples: [
    { title: "The text “hello world”", input: "hello world", output: "MD5: 5eb63bbbe01eeed093cb22bb8f5acdc3\nSHA-1: 2aae6c35c94fcfb415dbe95f408b9ce91ee846ed\nSHA-256: b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9" },
  ],
  limitations: [
    "Text is hashed as UTF-8 exactly as typed, including spaces and line breaks. A trailing newline gives a different hash, as it does with command-line tools.",
    "MD5 and SHA-1 are broken for security purposes. Do not use them for passwords or signatures; use SHA-256 or stronger.",
    "Plain hashes are not suitable for storing passwords. Use a slow password hash such as bcrypt or Argon2 for that.",
  ],
  faq: [
    {
      question: "Can a hash be reversed?",
      answer:
        "No. Hashing is one-way. Short or common inputs can still be guessed by trying many candidates, which is why passwords need special slow hashes.",
    },
    {
      question: "How do I check a downloaded file?",
      answer:
        "Choose File, pick the download and paste the checksum from the publisher’s website. A match means the file is byte-for-byte what they published.",
    },
    {
      question: "Why does my hash differ from another tool’s?",
      answer:
        "Usually because of invisible differences: a trailing newline, Windows line endings, or a different text encoding. This tool uses UTF-8.",
    },
    filePrivacyFaq,
  ],
  related: ["base64", "password-generator", "uuid-generator"],
};
