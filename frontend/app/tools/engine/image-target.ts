/**
 * Fitting an image under a target file size ("compress to 50 KB").
 *
 * The search is written against an `encode(scale, quality)` callback so it
 * can be tested without a canvas: the worker passes a real encoder, tests
 * pass a fake whose size grows with scale and quality.
 */

/** Bytes per KB for targets. Upload forms differ (1000 or 1024), so the stricter one is used. */
export const KB = 1000;

export const targetPresetsKb = [10, 20, 30, 50, 100, 150, 200, 300, 500, 1000, 2000] as const;

export const MIN_TARGET_KB = 5;
export const MAX_TARGET_KB = 20000;

export const targetBytes = (kb: number) => Math.round(kb * KB);

export function targetLabel(kb: number) {
  return kb >= 1000 && kb % 1000 === 0 ? `${kb / 1000} MB` : `${kb} KB`;
}

export type TargetEncode = (scale: number, quality: number) => Promise<Blob>;

export type TargetSearch = {
  /** Bytes the result must not exceed. */
  target: number;
  minQuality?: number;
  maxQuality?: number;
  /** Quality kept while the image can still be made smaller instead. */
  preferredQuality?: number;
  /** Halving steps of the quality search once a scale fits. */
  qualitySteps?: number;
  /** Halving steps when narrowing down the largest scale that fits. */
  scaleSteps?: number;
  /** Rounds of guessing a smaller scale before giving up. */
  maxRounds?: number;
  /** Never scale below this fraction of the starting size. */
  minScale?: number;
};

export type TargetResult = {
  blob: Blob;
  quality: number;
  /** Fraction of the starting dimensions (1 = unchanged). */
  scale: number;
  /** False when even the smallest attempt stayed above the target. */
  reached: boolean;
};

/**
 * Finds a good-looking encoding at or under the target. Photos for forms
 * look better large at a moderate quality than tiny at top quality, so the
 * image keeps its size while quality stays at or above `preferredQuality`,
 * and is scaled down only when that is not enough. Quality drops below the
 * preferred level only once the image cannot get any smaller.
 */
export async function findTargetEncoding(encode: TargetEncode, search: TargetSearch): Promise<TargetResult> {
  const {
    target,
    minQuality = 0.3,
    maxQuality = 0.92,
    preferredQuality = 0.7,
    qualitySteps = 5,
    scaleSteps = 6,
    maxRounds = 8,
    minScale = 0.02,
  } = search;

  /** Highest quality in [lo, hi] that fits, given that `lo` fits. */
  const searchQuality = async (scale: number, lo: number, fit: Blob, hi: number): Promise<TargetResult> => {
    let best: TargetResult = { blob: fit, quality: lo, scale, reached: true };
    for (let step = 0; step < qualitySteps; step++) {
      const mid = (lo + hi) / 2;
      const blob = await encode(scale, mid);
      if (blob.size <= target) {
        best = { blob, quality: mid, scale, reached: true };
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return best;
  };

  const top = await encode(1, maxQuality);
  if (top.size <= target) return { blob: top, quality: maxQuality, scale: 1, reached: true };
  const full = await encode(1, preferredQuality);
  if (full.size <= target) return searchQuality(1, preferredQuality, full, maxQuality);

  // Bracket the largest scale that fits at the preferred quality: `tooBig`
  // does not fit, `fits` does. File size grows roughly with the pixel
  // count (scale²), which gives the first guesses.
  let tooBig = 1;
  let tooBigSize = full.size;
  let fits: { scale: number; blob: Blob } | null = null;
  for (let round = 0; round < maxRounds && !fits; round++) {
    const guess = Math.max(minScale, tooBig * Math.sqrt(target / tooBigSize) * 0.9);
    const blob = await encode(guess, preferredQuality);
    if (blob.size <= target) fits = { scale: guess, blob };
    else if (guess <= minScale) break;
    else {
      tooBig = guess;
      tooBigSize = blob.size;
    }
  }

  if (!fits) {
    // Cannot shrink further: lower quality below the preferred level.
    const scale = minScale;
    const lowest = await encode(scale, minQuality);
    if (lowest.size > target) return { blob: lowest, quality: minQuality, scale, reached: false };
    return searchQuality(scale, minQuality, lowest, preferredQuality);
  }

  // Narrow down to the largest scale that still fits, then raise quality.
  for (let step = 0; step < scaleSteps; step++) {
    const mid = (fits.scale + tooBig) / 2;
    const blob = await encode(mid, preferredQuality);
    if (blob.size <= target) fits = { scale: mid, blob };
    else tooBig = mid;
  }
  return searchQuality(fits.scale, preferredQuality, fits.blob, maxQuality);
}

export const scaledSize = (size: { width: number; height: number }, scale: number) => ({
  width: Math.max(1, Math.round(size.width * scale)),
  height: Math.max(1, Math.round(size.height * scale)),
});

/** Plain-language summary of a target result, as shown next to each image. */
export function describeTarget(
  start: { width: number; height: number },
  result: { size: number; quality: number; scale: number; reached: boolean },
  kb: number,
) {
  const out = scaledSize(start, result.scale);
  const kbText = `${(result.size / KB).toFixed(1)} KB`;
  if (!result.reached) return `${kbText}, still over ${targetLabel(kb)} at ${out.width} × ${out.height} px`;
  const resized = result.scale < 1 ? `, resized to ${out.width} × ${out.height} px` : "";
  return `${kbText} (under ${targetLabel(kb)}) at ${Math.round(result.quality * 100)}% quality${resized}`;
}
