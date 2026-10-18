export type UuidVersion = "v4" | "v7";
export type UuidFormat = { uppercase?: boolean; hyphens?: boolean; braces?: boolean };

type RandomFill = (bytes: Uint8Array) => Uint8Array;
const cryptoFill: RandomFill = (bytes) => crypto.getRandomValues(bytes);

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hyphenate(h: string) {
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** RFC 9562 version 4: 122 random bits. */
export function uuidV4(fill: RandomFill = cryptoFill) {
  const b = fill(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return hyphenate(hex(b));
}

/** RFC 9562 version 7: 48-bit Unix milliseconds then random bits; sorts by time. */
export function uuidV7(now = Date.now(), fill: RandomFill = cryptoFill) {
  const b = fill(new Uint8Array(16));
  let ms = now;
  for (let i = 5; i >= 0; i--) {
    b[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return hyphenate(hex(b));
}

/**
 * Generates `count` UUIDs. v7 values created in the same millisecond get
 * increasing timestamps so the list stays in creation order.
 */
export function generateUuids(
  count: number,
  version: UuidVersion,
  format: UuidFormat = {},
  now = Date.now(),
  fill: RandomFill = cryptoFill,
) {
  const n = Math.min(Math.max(Math.floor(count) || 1, 1), 1000);
  return Array.from({ length: n }, (_, i) =>
    formatUuid(version === "v7" ? uuidV7(now + i, fill) : uuidV4(fill), format),
  );
}

export function formatUuid(uuid: string, { uppercase, hyphens = true, braces }: UuidFormat) {
  let s = hyphens ? uuid : uuid.replace(/-/g, "");
  if (uppercase) s = s.toUpperCase();
  return braces ? `{${s}}` : s;
}

export type UuidInfo =
  | { valid: false; message: string }
  | {
      valid: true;
      canonical: string;
      version: number;
      variant: string;
      /** Creation time for time-based versions (1, 6, 7). */
      timestamp?: string;
      special?: "nil" | "max";
    };

/** Explains a UUID: version, variant and the embedded time where there is one. */
export function inspectUuid(input: string): UuidInfo {
  const compact = input.trim().replace(/^(urn:uuid:|\{)/i, "").replace(/\}$/, "").replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(compact))
    return { valid: false, message: "Not a UUID: expected 32 hexadecimal digits, optionally with hyphens." };
  const canonical = hyphenate(compact);
  if (/^0+$/.test(compact)) return { valid: true, canonical, version: 0, variant: "Nil UUID", special: "nil" };
  if (/^f+$/.test(compact)) return { valid: true, canonical, version: 15, variant: "Max UUID", special: "max" };

  const version = parseInt(compact[12], 16);
  const v = parseInt(compact[16], 16);
  const variant =
    v < 8 ? "NCS (reserved)" : v < 12 ? "RFC 9562" : v < 14 ? "Microsoft (reserved)" : "Future (reserved)";
  let ms: number | undefined;
  if (version === 7) ms = parseInt(compact.slice(0, 12), 16);
  else if (version === 1 || version === 6) {
    const hexTime =
      version === 1
        ? compact.slice(13, 16) + compact.slice(8, 12) + compact.slice(0, 8)
        : compact.slice(0, 12) + compact.slice(13, 16);
    // 100-ns intervals since 1582-10-15.
    ms = Number(BigInt(`0x${hexTime}`) / 10000n) - 12219292800000;
  }
  return {
    valid: true,
    canonical,
    version,
    variant,
    ...(ms !== undefined ? { timestamp: new Date(ms).toISOString() } : {}),
  };
}

/** One-line description used by the published examples. */
export function describeUuid(input: string) {
  const info = inspectUuid(input);
  if (!info.valid) return info.message;
  if (info.special) return `${info.variant} (all bits ${info.special === "nil" ? "0" : "1"})`;
  return [`Version ${info.version}`, `variant ${info.variant}`, info.timestamp && `created ${info.timestamp}`]
    .filter(Boolean)
    .join(", ");
}
