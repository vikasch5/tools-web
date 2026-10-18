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
