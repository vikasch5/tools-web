import type { WidgetToolDefinition } from "../types";

export const uuidGenerator: WidgetToolDefinition = {
  workspace: "uuid-generator",
  slug: "uuid-generator",
  category: "generators",
  name: "UUID Generator",
  metaTitle: "UUID Generator – Create v4 and v7 UUIDs in Bulk",
  description:
    "Generate random v4 or time-ordered v7 UUIDs, up to 1,000 at a time, and check any UUID’s version and creation time.",
  overview: [
    "A UUID (universally unique identifier) is a 128-bit value used to label records, files, messages and requests without a central counter. Two systems can create IDs independently with practically no chance of a collision.",
    "Version 4 UUIDs are completely random and are the usual default. Version 7 UUIDs start with a timestamp, so they sort in creation order, which keeps database indexes efficient and makes them a good choice for primary keys. Both are created with your browser's secure random number generator, and the checker tells you the version of any UUID and, for time-based versions, when it was made.",
  ],
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

export const passwordGenerator: WidgetToolDefinition = {
  workspace: "password-generator",
  slug: "password-generator",
  category: "generators",
  name: "Password Generator",
  metaTitle: "Password Generator – Strong, Random and Private",
  description:
    "Create strong random passwords up to 128 characters with your browser’s secure generator. Choose the characters, avoid look-alikes and see the strength.",
  overview: [
    "Weak and reused passwords are behind most account takeovers. The strongest practical defence is a long, random, unique password for each account, kept in a password manager.",
    "This generator uses your browser's cryptographically secure random number generator and avoids the subtle biases that make some generators less random than they look. You choose the length and character types to fit a site's rules, and the strength meter estimates how long an offline attack would take. Passwords are created on your device and never sent or stored anywhere.",
  ],
  howTo: [
    "Set the length. 16 characters or more is a good default for accounts; use your password manager’s limit if it has one.",
    "Choose which characters to use. Turn on “Avoid look-alikes” if the password will be read or typed by hand.",
    "Copy a password. Press Generate for a fresh set; each one is created on your device.",
  ],
  examples: [
    { title: "Default settings", input: "16 characters, all four sets", output: "Very strong · 103 bits" },
    { title: "Easy to read aloud", input: "12 characters, all four sets, avoiding look-alikes", output: "Strong · 76 bits" },
    { title: "Short PIN-style password", input: "8 characters, lower case and digits", output: "Fair · 41 bits" },
  ],
  limitations: [
    "Strength is calculated from the length and the characters allowed, assuming the password is random, which it is here. The time estimate assumes an attacker who can try 10 billion guesses a second offline.",
    "Each chosen character type appears at least once, as many sites require.",
    "Passwords are not saved anywhere. Store them in a password manager.",
  ],
  faq: [
    {
      question: "Are these passwords really random?",
      answer:
        "Yes. They come from crypto.getRandomValues, the browser’s cryptographically secure random generator, without modulo bias. They are never sent over the network.",
    },
    {
      question: "How long should my password be?",
      answer:
        "At least 16 characters for important accounts. Length adds more strength than symbols do, so a longer password with only letters and digits is better than a short one with everything.",
    },
    {
      question: "Is my password stored or logged?",
      answer: "No. It is generated in your browser and exists only on this page until you close or refresh it.",
    },
  ],
  related: ["uuid-generator", "qr-code-generator", "base64"],
};

export const qrCodeGenerator: WidgetToolDefinition = {
  workspace: "qr-code-generator",
  slug: "qr-code-generator",
  category: "generators",
  name: "QR Code Generator",
  metaTitle: "QR Code Generator – Links and Wi-Fi, PNG or SVG",
  description:
    "Make QR codes for links, text or Wi-Fi logins. Choose error correction and colours, and download a crisp PNG or SVG. Free, no sign-up, no tracking.",
  overview: [
    "QR codes bridge print and the web: menus, posters, business cards, packaging, event tickets and shared Wi-Fi details can all be opened with a phone camera in a second.",
    "The codes made here are static, meaning the content is stored in the pattern itself rather than behind a redirect service, so they never expire, cannot be switched to a different link later and do not track who scans them. Higher error correction keeps a code readable when it is printed small, smudged or partly covered. SVG output scales to any print size without blurring.",
  ],
  howTo: [
    "Choose Link or text, or Wi-Fi to let guests join your network by scanning.",
    "Enter the content. The code updates as you type.",
    "Pick an error correction level: higher levels survive smudges and logos but make the code denser.",
    "Download a PNG for documents and screens, or an SVG for print at any size. Scan it with your phone to test before printing.",
  ],
  examples: [
    { title: "A website link", input: "https://example.com at level M", output: "Version 2 · 25 × 25 modules" },
    { title: "Higher error correction makes a denser code", input: "https://example.com at level H", output: "Version 3 · 29 × 29 modules" },
    { title: "Wi-Fi login", input: "Wi-Fi: network Cafe Guest, password coffee123, WPA", output: "WIFI:T:WPA;S:Cafe Guest;P:coffee123;;" },
  ],
  limitations: [
    "Codes are static: the content is stored in the code itself, so they never expire and cannot be changed or tracked after printing.",
    "A QR code holds up to about 2,900 bytes at the lowest error correction. Long text makes the code hard to scan, so keep links short.",
    "Wi-Fi codes work with the built-in camera on current iPhone and Android phones. The password is visible to anyone who decodes the image.",
    "Light codes on dark backgrounds, and low-contrast colours, do not scan reliably. You will see a warning.",
  ],
  faq: [
    {
      question: "Do these QR codes expire?",
      answer: "No. The link or text is encoded directly in the image, with no redirect service in between, so the code works as long as the link does.",
    },
    {
      question: "Which error correction level should I choose?",
      answer:
        "M (15%) suits most uses. Choose Q or H if the code will be printed small, on a rough surface, or with a logo over it; choose L for the simplest code when it will only be shown on screens.",
    },
    {
      question: "Is my content uploaded?",
      answer: "No. The code is generated in your browser, so links and Wi-Fi passwords never leave your device.",
    },
  ],
  related: ["password-generator", "url-encoder", "uuid-generator"],
};

export const loremIpsum: WidgetToolDefinition = {
  workspace: "lorem-ipsum",
  slug: "lorem-ipsum",
  category: "generators",
  name: "Lorem Ipsum Generator",
  metaTitle: "Lorem Ipsum Generator – Paragraphs, Sentences, Words",
  description:
    "Generate lorem ipsum placeholder text by paragraphs, sentences or words, as plain text or HTML paragraphs. Copy or download it in one click.",
  overview: [
    "Lorem ipsum is placeholder text that designers, developers and publishers have used for decades to fill layouts before the real copy is ready. Its Latin-like words have a natural rhythm of word and sentence lengths, so a design can be judged without readers being distracted by meaningful text.",
    "You can generate as many paragraphs, sentences or words as a mockup needs, with or without the classic opening line, and wrap paragraphs in HTML tags for templates and prototypes. Remember to replace placeholder text before anything goes live.",
  ],
  howTo: [
    "Choose paragraphs, sentences or words, and how many.",
    "Keep “Start with Lorem ipsum” on for the classic opening, or turn it off for fully random text.",
    "Turn on HTML <p> tags to paste straight into markup.",
    "Copy the text or download it. Press Generate for a new variation.",
  ],
  examples: [
    { title: "The classic opening", input: "8 words", output: "Lorem ipsum dolor sit amet consectetur adipiscing elit." },
    { title: "A short label", input: "3 words", output: "Lorem ipsum dolor." },
  ],
  limitations: [
    "The text is pseudo-Latin built from the traditional lorem ipsum vocabulary. It has no meaning and is not grammatically correct Latin.",
    "Up to 500 paragraphs or sentences, or 5,000 words, at a time.",
    "The output is not marked as placeholder text, so remember to replace it before publishing.",
  ],
  faq: [
    {
      question: "Why use lorem ipsum instead of real text?",
      answer:
        "It looks like natural text in length and rhythm, so a layout can be judged without readers getting distracted by the words. Replace it with real content before launch.",
    },
    {
      question: "Where does lorem ipsum come from?",
      answer:
        "It is a scrambled passage from Cicero’s “De finibus bonorum et malorum” (45 BC). It became the standard filler text through Letraset transfer sheets in the 1960s and, later, desktop publishing software.",
    },
    {
      question: "Can I use the generated text in commercial projects?",
      answer:
        "Yes. The words come from a 2,000-year-old public domain text and are generated on your device, so there is nothing to credit or license.",
    },
  ],
  related: ["word-counter", "case-converter", "uuid-generator"],
};
