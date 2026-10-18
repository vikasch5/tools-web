export type PasswordOptions = {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  /** Leave out characters that are easy to confuse: I l 1 O 0 o. */
  avoidAmbiguous: boolean;
};

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
} as const;
const AMBIGUOUS = /[Il1O0o]/g;

type RandomInt = (max: number) => number;

/** Uniform integer in [0, max) from the platform CSPRNG, without modulo bias. */
export const secureRandomInt: RandomInt = (max) => {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
};

export function passwordSets(options: PasswordOptions) {
  return (Object.keys(SETS) as (keyof typeof SETS)[])
    .filter((k) => options[k])
    .map((k) => (options.avoidAmbiguous ? SETS[k].replace(AMBIGUOUS, "") : SETS[k]));
}

/**
 * A password with at least one character from every chosen set, placed
 * at random positions (Fisher–Yates shuffle).
 */
export function generatePassword(options: PasswordOptions, random: RandomInt = secureRandomInt) {
  const sets = passwordSets(options);
  if (!sets.length) throw new Error("Choose at least one type of character.");
  const length = Math.max(options.length, sets.length);
  const pool = sets.join("");
  const chars = sets.map((set) => set[random(set.length)]);
  while (chars.length < length) chars.push(pool[random(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/** Bits of entropy for a random password of this length over these sets. */
export function passwordEntropy(options: PasswordOptions) {
  const pool = passwordSets(options).join("").length;
  return pool ? Math.round(options.length * Math.log2(pool)) : 0;
}

export function strengthLabel(bits: number) {
  if (bits < 40) return "Weak";
  if (bits < 60) return "Fair";
  if (bits < 80) return "Strong";
  return "Very strong";
}

/**
 * Rough offline cracking time, assuming 10 billion guesses a second
 * against a fast hash, and that half the space is searched on average.
 */
export function crackTime(bits: number) {
  const seconds = 2 ** bits / 2 / 1e10;
  const units: [number, string][] = [
    [60 * 60 * 24 * 365 * 1e6, "million years"],
    [60 * 60 * 24 * 365, "years"],
    [60 * 60 * 24, "days"],
    [60 * 60, "hours"],
    [60, "minutes"],
  ];
  if (seconds >= 60 * 60 * 24 * 365 * 1e12) return "longer than the age of the universe";
  for (const [size, name] of units)
    if (seconds >= size) return `about ${Math.round(seconds / size).toLocaleString("en")} ${name}`;
  return "less than a minute";
}
