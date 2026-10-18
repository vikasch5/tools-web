const WORDS = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et " +
  "dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea " +
  "commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur " +
  "excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est " +
  "laborum at vero eos accusamus iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti " +
  "atque corrupti quos dolores quas molestias excepturi obcaecati cupiditate similique mollitia animi " +
  "dolorum fuga harum quidem rerum facilis expedita distinctio nam libero tempore cum soluta nobis eligendi " +
  "optio cumque nihil impedit quo minus quod maxime placeat facere possimus omnis voluptas assumenda " +
  "repellendus temporibus autem quibusdam officiis debitis aut necessitatibus saepe eveniet voluptates " +
  "repudiandae recusandae itaque earum hic tenetur sapiente delectus reiciendis maiores alias perferendis " +
  "doloribus asperiores repellat"
).split(" ");

const OPENING = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";

export type LoremUnit = "paragraphs" | "sentences" | "words";
export type LoremOptions = { unit: LoremUnit; count: number; startWithLorem: boolean; html: boolean };

/** Small seedable PRNG (mulberry32), so examples and tests are repeatable. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateLorem(options: LoremOptions, random: () => number = Math.random) {
  const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const word = () => WORDS[Math.floor(random() * WORDS.length)];
  let opened = !options.startWithLorem;

  const sentence = () => {
    if (!opened) {
      opened = true;
      return `${OPENING}.`;
    }
    const words = Array.from({ length: between(6, 14) }, word);
    // An occasional comma reads more naturally.
    if (words.length > 8) words[between(3, words.length - 4)] += ",";
    const text = words.join(" ");
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
  };
  const paragraph = () => Array.from({ length: between(4, 7) }, sentence).join(" ");

  const count = Math.max(1, Math.min(options.count, options.unit === "words" ? 5000 : 500));
  if (options.unit === "words") {
    const words = options.startWithLorem ? OPENING.replace(",", "").toLowerCase().split(" ") : [];
    while (words.length < count) words.push(word());
    const text = words.slice(0, count).join(" ");
    const out = `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
    return options.html ? `<p>${out}</p>` : out;
  }
  if (options.unit === "sentences") {
    const out = Array.from({ length: count }, sentence).join(" ");
    return options.html ? `<p>${out}</p>` : out;
  }
  const paragraphs = Array.from({ length: count }, paragraph);
  return options.html ? paragraphs.map((p) => `<p>${p}</p>`).join("\n") : paragraphs.join("\n\n");
}
