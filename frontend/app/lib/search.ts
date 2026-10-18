import type { Tool } from "~/data/tools";
import { categories } from "~/data/categories";

const categoryNames = new Map(categories.map((c) => [c.slug, c.name.toLowerCase()]));

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Ranks tools for a query. Every word must match somewhere (name,
 * keywords, description or category); name matches rank highest, and
 * word starts beat matches inside a word.
 */
export function searchTools(query: string, list: Tool[]): Tool[] {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return list;

  const scored: { tool: Tool; score: number }[] = [];
  for (const tool of list) {
    const fields: [string, number][] = [
      [normalise(tool.name), 10],
      [normalise((tool.keywords ?? []).join(" ")), 6],
      [normalise(tool.slug), 5],
      [normalise(categoryNames.get(tool.category) ?? ""), 3],
      [normalise(tool.description), 2],
    ];
    let total = 0;
    let matchedAll = true;
    for (const word of words) {
      let best = 0;
      for (const [text, weight] of fields) {
        const at = ` ${text}`.indexOf(` ${word}`);
        if (at >= 0) best = Math.max(best, weight * 2);
        else if (text.includes(word)) best = Math.max(best, weight);
      }
      if (best === 0) {
        matchedAll = false;
        break;
      }
      total += best;
    }
    if (!matchedAll) continue;
    if (normalise(tool.name) === words.join(" ")) total += 50;
    if (tool.status === "live") total += 1;
    scored.push({ tool, score: total });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.tool);
}
