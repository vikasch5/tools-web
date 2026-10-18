export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export const hashAlgorithms: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// Per-round shift amounts and constants (RFC 1321).
const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

/** MD5 (RFC 1321). Browsers' Web Crypto has no MD5, so it is implemented here. */
export function md5(data: Uint8Array) {
  const length = data.length;
  const padded = new Uint8Array((((length + 8) >> 6) + 1) << 6);
  padded.set(data);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, (length * 8) >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(length / 0x20000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const M = new Uint32Array(16);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(offset + i * 4, true);
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const sum = (a + f + K[i] + M[g]) >>> 0;
      const shift = S[(i >> 4) * 4 + (i % 4)];
      a = d;
      d = c;
      c = b;
      b = (b + ((sum << shift) | (sum >>> (32 - shift)))) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }
  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  [a0, b0, c0, d0].forEach((word, i) => outView.setUint32(i * 4, word, true));
  return hex(out);
}

/** Hex digest of bytes with the chosen algorithm (SHA family via Web Crypto). */
export async function digest(algorithm: HashAlgorithm, data: Uint8Array) {
  if (algorithm === "MD5") return md5(data);
  const buffer = await crypto.subtle.digest(algorithm, data as Uint8Array<ArrayBuffer>);
  return hex(new Uint8Array(buffer));
}

export async function hashAll(data: Uint8Array) {
  const entries = await Promise.all(hashAlgorithms.map(async (a) => [a, await digest(a, data)] as const));
  return Object.fromEntries(entries) as Record<HashAlgorithm, string>;
}

export const utf8 = (text: string) => new TextEncoder().encode(text);

/** Which algorithm, if any, produced an expected checksum (case and spaces ignored). */
export function matchChecksum(expected: string, hashes: Partial<Record<HashAlgorithm, string>>) {
  const clean = expected.trim().toLowerCase().replace(/\s+/g, "");
  if (!clean) return null;
  return (Object.entries(hashes).find(([, value]) => value === clean)?.[0] as HashAlgorithm | undefined) ?? false;
}

/** Summary used by the published examples. */
export async function describeHash(text: string) {
  const all = await hashAll(utf8(text));
  return (["MD5", "SHA-1", "SHA-256"] as const).map((a) => `${a}: ${all[a]}`).join("\n");
}
