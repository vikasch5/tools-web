export type TextStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  /** Minutes at 238 words per minute (average adult silent reading). */
  readingMinutes: number;
  /** Minutes at 150 words per minute (typical presentation pace). */
  speakingMinutes: number;
  keywords: { word: string; count: number }[];
};

const STOP_WORDS = new Set(
  (
    "a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves " +
    "it's don't i'm you're that's isn't aren't wasn't can't won't"
  ).split(" "),
);

const hasSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl;

function wordList(text: string): string[] {
  if (hasSegmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
    const words: string[] = [];
    for (const s of segmenter.segment(text)) if (s.isWordLike) words.push(s.segment);
    return words;
  }
  return text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
}

function graphemes(text: string) {
  if (!hasSegmenter) return [...text].length;
  let count = 0;
  for (const _ of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text))
    count++;
  return count;
}

function sentenceCount(text: string) {
  if (hasSegmenter) {
    let count = 0;
    for (const s of new Intl.Segmenter(undefined, { granularity: "sentence" }).segment(text))
      if (/[\p{L}\p{N}]/u.test(s.segment)) count++;
    return count;
  }
  return text.split(/[.!?]+(?:\s|$)/).filter((s) => /[\p{L}\p{N}]/u.test(s)).length;
}

export function textStats(text: string): TextStats {
  const words = wordList(text);
  const frequency = new Map<string, number>();
  for (const word of words) {
    const key = word.toLowerCase().replace(/’/g, "'");
    if (key.length < 3 || STOP_WORDS.has(key) || /^\d+$/.test(key)) continue;
    frequency.set(key, (frequency.get(key) ?? 0) + 1);
  }
  const keywords = [...frequency]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  return {
    words: words.length,
    characters: graphemes(text),
    charactersNoSpaces: graphemes(text.replace(/\s+/g, "")),
    sentences: sentenceCount(text),
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    lines: text ? text.split("\n").length : 0,
    readingMinutes: words.length / 238,
    speakingMinutes: words.length / 150,
    keywords,
  };
}

/** "45 sec", "3 min", "1 hr 5 min". */
export function formatDuration(minutes: number) {
  const seconds = Math.round(minutes * 60);
  if (seconds === 0) return "0 sec";
  if (seconds < 60) return `${seconds} sec`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
}

/** One-line summary used by the published examples. */
export function statsSummary(s: TextStats) {
  const plural = (n: number, word: string) =>
    `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;
  return [
    plural(s.words, "word"),
    plural(s.characters, "character"),
    plural(s.sentences, "sentence"),
    plural(s.paragraphs, "paragraph"),
    `${formatDuration(s.readingMinutes)} read`,
  ].join(" · ");
}
