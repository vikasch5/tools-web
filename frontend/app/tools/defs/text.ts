import type { WidgetToolDefinition } from "../types";
import { textPrivacyFaq } from "./shared";

export const wordCounter: WidgetToolDefinition = {
  workspace: "word-counter",
  slug: "word-counter",
  category: "text-tools",
  name: "Word Counter",
  metaTitle: "Word Counter – Count Words, Characters and Reading Time",
  description:
    "Count words, characters, sentences and paragraphs as you type, with reading and speaking time and your most used words.",
  overview: [
    "Word and character limits are everywhere: essays and applications, meta descriptions, social posts, ad copy, abstracts and translation quotes. A live count lets you edit to the limit without guessing.",
    "Beyond words and characters, the counter shows sentences, paragraphs and lines, plus estimated reading and speaking time, which helps when planning a blog post, newsletter, presentation or video script. The list of most used words highlights repetition, so you can vary your wording or check that a key term appears often enough. Your text stays in your browser and is not saved.",
  ],
  howTo: [
    "Type or paste your text into the box. Every count updates as you type.",
    "Read words, characters (with and without spaces), sentences, paragraphs and lines on the right.",
    "Use reading time to judge a blog post or email, and speaking time to plan a talk or video script.",
    "Check “Most used words” to spot repetition. Common words like “the” and “and” are left out.",
  ],
  examples: [
    {
      title: "A short paragraph",
      input: "Keep it simple. Short sentences are easier to read, and easier to translate.",
      output: "13 words · 76 characters · 2 sentences · 1 paragraph · 3 sec read",
    },
    {
      title: "Two paragraphs",
      input: "Draft first.\n\nEdit later, when the draft is done.",
      output: "9 words · 49 characters · 2 sentences · 2 paragraphs · 2 sec read",
    },
  ],
  limitations: [
    "Words are split using your browser’s language rules, which work for most languages. For Chinese, Japanese and Thai, word counts are estimates.",
    "Characters count what you see: an emoji or an accented letter counts as one, even when it is stored as several code units.",
    "Reading time assumes 238 words per minute and speaking time 150, the commonly cited averages for adults. Technical text reads slower.",
  ],
  faq: [
    {
      question: "Do hyphenated words and numbers count as words?",
      answer:
        "Numbers count as words. Hyphenated words like “well-known” count as two, the way most word processors count them.",
    },
    {
      question: "Why is my count different from Microsoft Word or Google Docs?",
      answer:
        "Tools disagree on edge cases such as dashes, URLs and numbers with punctuation. Differences are usually a few words in a long document.",
    },
    {
      question: "Is there a length limit?",
      answer:
        "No fixed limit. Counting runs in your browser and stays quick for book-length text.",
    },
    textPrivacyFaq,
  ],
  related: ["diff-checker", "csv-to-json", "percentage-calculator"],
};

export const diffChecker: WidgetToolDefinition = {
  workspace: "diff-checker",
  slug: "diff-checker",
  category: "text-tools",
  name: "Diff Checker",
  metaTitle: "Diff Checker – Compare Two Texts and Find Differences",
  description:
    "Compare two versions of a text or code line by line. See added and removed lines side by side, and ignore whitespace or case if you like.",
  overview: [
    "When two versions of a document, configuration file or piece of code look almost the same, finding what changed by eye is slow and error-prone. A diff lines them up and marks exactly which lines were added, removed or kept.",
    "This is useful for checking edits to a contract or article, comparing configuration between servers, reviewing code outside a version control system, or confirming that a tool's output matches what you expected. Options to ignore whitespace and case hide changes that do not matter, and the result can be copied as a standard unified diff.",
  ],
  howTo: [
    "Paste the original text on the left and the changed version on the right, or load the sample.",
    "Press Compare (or Ctrl+Enter). Removed lines are marked with a minus and added lines with a plus.",
    "Switch between Side by side and Unified views. Turn on Ignore whitespace or Ignore case to hide changes that do not matter.",
    "Copy the result as a unified diff to paste into a ticket or code review.",
  ],
  examples: [
    {
      title: "One line changed, one added (original above the --- line, changed below)",
      input: "Orders ship in 2 days.\nReturns within 14 days.\n---\nOrders ship in 1 day.\nReturns within 14 days.\nExchanges are free.",
      output: "- Orders ship in 2 days.\n+ Orders ship in 1 day.\n  Returns within 14 days.\n+ Exchanges are free.",
    },
  ],
  limitations: [
    "Differences are shown per line. A one-character change marks the whole line as changed.",
    "Files are compared as plain text: Word, PDF and spreadsheet files need to be copied as text first.",
    "Line endings (Windows CRLF or Unix LF) are treated as the same.",
  ],
  faq: [
    {
      question: "How does the comparison work?",
      answer:
        "It uses the Myers diff algorithm, the same approach as git, to find the smallest set of added and removed lines that turns the original into the changed text.",
    },
    {
      question: "Can I compare code?",
      answer:
        "Yes. Paste any code or config file. Turn on Ignore whitespace to skip indentation-only changes after reformatting.",
    },
    {
      question: "What does “unified” view mean?",
      answer:
        "All lines in one column, with removed lines marked − and added lines marked +, the format used by git diff and patch files.",
    },
    textPrivacyFaq,
  ],
  related: ["word-counter", "json-formatter", "csv-to-json"],
};

export const caseConverter: WidgetToolDefinition = {
  workspace: "case-converter",
  slug: "case-converter",
  category: "text-tools",
  name: "Case Converter",
  metaTitle: "Case Converter – UPPER, lower, Title, camelCase and More",
  description:
    "Convert text to UPPER, lower, Title or Sentence case, or to camelCase, snake_case, kebab-case and other code styles. Every result at once, ready to copy.",
  overview: [
    "Text often arrives in the wrong case: headings typed in capitals, product names in lower case, or a list of labels that needs to become variable names. Retyping is slow and easy to get wrong.",
    "This converter shows every common case at once. Title Case follows common style-guide rules for short words, and Sentence case suits headings and UI copy. For code, it produces camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case and dot.case, splitting words and acronyms sensibly, and converts each line separately so you can process a whole list of names in one go.",
  ],
  howTo: [
    "Type or paste your text. Every case is shown at once and updates as you type.",
    "Press the copy button next to the case you need.",
    "Code cases (camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case, dot.case) convert each line separately, so you can convert a list of names in one go.",
  ],
  examples: [
    { title: "Headline to Title Case", input: "Title Case: the lord of the rings: the return of the king", output: "The Lord of the Rings: The Return of the King" },
    { title: "Shouting to Sentence case", input: "Sentence case: PLEASE READ THIS. i MEAN IT!", output: "Please read this. I mean it!" },
    { title: "Phrase to a variable name", input: "camelCase: user account id", output: "userAccountId" },
    { title: "Acronyms are split sensibly", input: "snake_case: parseHTTPResponse", output: "parse_http_response" },
  ],
  limitations: [
    "Title Case keeps short words such as “of”, “the” and “and” lower case unless they start the title, follow a colon or end it. Names and acronyms (NASA, iPhone) may need fixing by hand.",
    "Sentence case lowers everything except the first letter of each sentence and the word “I”, so names lose their capitals.",
    "Code cases drop punctuation but keep accented letters, so check names meant for systems that only allow ASCII.",
  ],
  faq: [
    {
      question: "What is the difference between camelCase and PascalCase?",
      answer:
        "camelCase starts with a lower-case letter (userName), PascalCase with a capital (UserName). JavaScript variables usually use camelCase; classes and React components use PascalCase.",
    },
    {
      question: "When should I use snake_case or kebab-case?",
      answer:
        "snake_case is common for Python names and database columns; kebab-case for URLs, CSS classes and file names. CONSTANT_CASE is used for constants and environment variables.",
    },
    textPrivacyFaq,
  ],
  related: ["word-counter", "diff-checker", "lorem-ipsum"],
};
