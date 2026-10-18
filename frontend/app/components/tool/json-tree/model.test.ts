import { describe, expect, it } from "vitest";
import {
  PAGE_SIZE,
  ancestorIds,
  childIndex,
  formatPath,
  idsToDepth,
  nodeId,
  searchTree,
  visibleRows,
  type JsonValue,
} from "./model";

const sample: JsonValue = {
  context: { action: "on_search", "bap-id": "uat.example.com", ttl: 10 },
  items: [{ id: 1, active: true }, { id: 2, note: null }],
};

describe("json tree model", () => {
  it("formats JSONPath labels", () => {
    expect(formatPath([])).toBe("$");
    expect(formatPath(["context", "action"])).toBe("$.context.action");
    expect(formatPath(["context", "bap-id"])).toBe('$.context["bap-id"]');
    expect(formatPath(["items", 1, "id"])).toBe("$.items[1].id");
  });

  it("expands to a depth and flattens only open nodes", () => {
    const expanded = new Set(idsToDepth(sample, 0));
    const rows = visibleRows(sample, expanded, new Map());
    expect(rows.map((r) => r.name)).toEqual([undefined, "context", "items"]);
    expect(rows[1]).toMatchObject({ type: "object", childCount: 3, expanded: false });

    expanded.add(nodeId(["items"]));
    const more = visibleRows(sample, expanded, new Map());
    expect(more.map((r) => r.name)).toEqual([undefined, "context", "items", 0, 1]);
  });

  it("pages long arrays with a show-more row", () => {
    const big: JsonValue = { list: Array.from({ length: PAGE_SIZE + 5 }, (_, i) => i) };
    const expanded = new Set([nodeId([]), nodeId(["list"])]);
    const rows = visibleRows(big, expanded, new Map());
    expect(rows.at(-1)?.more).toEqual({ parentId: nodeId(["list"]), remaining: 5 });
    const all = visibleRows(big, expanded, new Map([[nodeId(["list"]), 2]]));
    expect(all.at(-1)?.more).toBeUndefined();
  });

  it("finds keys and primitive values case-insensitively", () => {
    expect(searchTree(sample, "SEARCH")).toEqual([["context", "action"]]);
    expect(searchTree(sample, "id")).toEqual([
      ["context", "bap-id"],
      ["items", 0, "id"],
      ["items", 1, "id"],
    ]);
    expect(searchTree(sample, "null")).toEqual([["items", 1, "note"]]);
    expect(searchTree(sample, "  ")).toEqual([]);
  });

  it("lists ancestors and child positions", () => {
    expect(ancestorIds(["items", 1, "id"])).toEqual([nodeId([]), nodeId(["items"]), nodeId(["items", 1])]);
    expect(childIndex(sample, ["context", "ttl"])).toBe(2);
    expect(childIndex(sample, ["items", 1])).toBe(1);
  });
});
