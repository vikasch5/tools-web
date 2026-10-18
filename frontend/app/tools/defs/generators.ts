import type { WidgetToolDefinition } from "../types";

export const uuidGenerator: WidgetToolDefinition = {
  workspace: "uuid-generator",
  slug: "uuid-generator",
  category: "generators",
  name: "UUID Generator",
  metaTitle: "UUID Generator – Create v4 and v7 UUIDs in Bulk",
  description:
    "Generate random v4 or time-ordered v7 UUIDs, up to 1,000 at a time, and check any UUID’s version and creation time.",
  howTo: [
    "Choose v4 for fully random IDs, or v7 for IDs that sort by creation time (better for database keys).",
    "Set how many you need, from 1 to 1,000, and press Generate.",
    "Turn on Uppercase, turn off Hyphens, or add Braces to match the format your system expects.",
    "Copy a single UUID, copy the whole list, or download it as a text file.",
    "Paste an existing UUID under “Check a UUID” to see its version, variant and, for v1, v6 and v7, when it was created.",
  ],
  examples: [
    { title: "Check a version 7 UUID", input: "01920e68-7a00-7c3d-9e4f-0123456789ab", output: "Version 7, variant RFC 9562, created 2024-09-20T07:49:40.992Z" },
    { title: "Check a version 4 UUID", input: "9f1c2e4b-3a5d-4b8e-a1f0-6c7d8e9f0a1b", output: "Version 4, variant RFC 9562" },
  ],
  limitations: [
    "UUIDs are generated with your browser’s cryptographically secure random generator (crypto.getRandomValues).",
    "v7 UUIDs embed the current time from your device clock, accurate to the millisecond, so they reveal roughly when they were made.",
    "Up to 1,000 per batch; generate again for more.",
  ],
  faq: [
    {
      question: "Should I use v4 or v7?",
      answer:
        "Use v7 for database primary keys: because they start with a timestamp, new rows land at the end of the index, which keeps inserts fast. Use v4 when an ID must not reveal when it was created.",
    },
    {
      question: "Can two UUIDs ever be the same?",
      answer:
        "In practice, no. A v4 UUID has 122 random bits; you would need to generate billions per second for many years before a collision became likely.",
    },
    {
      question: "Is a GUID the same as a UUID?",
      answer:
        "Yes. GUID is Microsoft’s name for the same 128-bit identifier. Turn on Uppercase and Braces for the {XXXXXXXX-…} style some Windows tools use.",
    },
    {
      question: "Are the UUIDs stored or sent anywhere?",
      answer: "No. They are created in your browser and disappear when you leave the page.",
    },
  ],
  related: ["base64", "jwt-decoder", "gradient-generator"],
};
