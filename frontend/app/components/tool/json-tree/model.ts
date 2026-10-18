/**
 * Pure helpers for the JSON tree viewer: node identity, JSONPath labels,
 * visible-row flattening and search. Kept free of React so they are easy
 * to test.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type PathSegment = string | number;
export type NodeType = "object" | "array" | "string" | "number" | "boolean" | "null";

export type Row = {
  id: string;
  path: PathSegment[];
  /** Property name or array index; undefined for the root. */
  name?: PathSegment;
  value: JsonValue;
  type: NodeType;
  depth: number;
  childCount: number;
  expanded: boolean;
  /** A "show more" placeholder for long containers. */
  more?: { parentId: string; remaining: number };
};

export const ROOT_ID = "$";
/** Children rendered per container before a "Show more" row. */
export const PAGE_SIZE = 200;

export function nodeId(path: PathSegment[]) {
  return path.length === 0 ? ROOT_ID : JSON.stringify(path);
}

export function typeOf(value: JsonValue): NodeType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as "object" | "string" | "number" | "boolean";
}

export function entries(value: JsonValue): [PathSegment, JsonValue][] {
  if (Array.isArray(value)) return value.map((v, i) => [i, v]);
  if (value && typeof value === "object") return Object.entries(value);
  return [];
}

function childCountOf(value: JsonValue) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Human-readable JSONPath, e.g. $.context.items[0]["content-type"]. */
export function formatPath(path: PathSegment[]) {
  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${segment}]`;
    return IDENTIFIER.test(segment) ? `${acc}.${segment}` : `${acc}[${JSON.stringify(segment)}]`;
  }, "$");
}

/** Ids of every ancestor of a path, root first. */
export function ancestorIds(path: PathSegment[]) {
  return path.map((_, i) => nodeId(path.slice(0, i)));
}

/** Ids of all containers up to a depth (root = depth 0). */
export function idsToDepth(root: JsonValue, maxDepth: number) {
  const ids: string[] = [];
  const walk = (value: JsonValue, path: PathSegment[]) => {
    if (childCountOf(value) === 0 || path.length > maxDepth) return;
    ids.push(nodeId(path));
    for (const [key, child] of entries(value)) walk(child, [...path, key]);
  };
  walk(root, []);
  return ids;
}

/** Flattens the expanded part of the tree into renderable rows. */
export function visibleRows(
  root: JsonValue,
  expanded: Set<string>,
  pages: Map<string, number>,
): Row[] {
  const rows: Row[] = [];
  const walk = (value: JsonValue, path: PathSegment[], name?: PathSegment) => {
    const id = nodeId(path);
    const childCount = childCountOf(value);
    const isOpen = childCount > 0 && expanded.has(id);
    rows.push({
      id,
      path,
      name,
      value,
      type: typeOf(value),
      depth: path.length,
      childCount,
      expanded: isOpen,
    });
    if (!isOpen) return;
    const limit = (pages.get(id) ?? 1) * PAGE_SIZE;
    const children = entries(value);
    for (const [key, child] of children.slice(0, limit)) {
      walk(child, [...path, key], key);
    }
    if (children.length > limit) {
      rows.push({
        id: `${id}::more`,
        path,
        value: null,
        type: "null",
        depth: path.length + 1,
        childCount: 0,
        expanded: false,
        more: { parentId: id, remaining: children.length - limit },
      });
    }
  };
  walk(root, []);
  return rows;
}

/** Paths whose key or primitive value contains the query (case-insensitive). */
export function searchTree(root: JsonValue, query: string, limit = 5000) {
  const needle = query.trim().toLowerCase();
  const matches: PathSegment[][] = [];
  if (!needle) return matches;
  const walk = (value: JsonValue, path: PathSegment[]) => {
    if (matches.length >= limit) return;
    const key = path[path.length - 1];
    const keyHit = typeof key === "string" && key.toLowerCase().includes(needle);
    const valueHit =
      typeOf(value) !== "object" &&
      typeOf(value) !== "array" &&
      String(value).toLowerCase().includes(needle);
    if (keyHit || valueHit) matches.push(path);
    for (const [k, child] of entries(value)) walk(child, [...path, k]);
  };
  walk(root, []);
  return matches;
}

/** Index of a child within its parent, used to page long containers. */
export function childIndex(root: JsonValue, path: PathSegment[]) {
  if (path.length === 0) return 0;
  let parent = root;
  for (const segment of path.slice(0, -1)) {
    parent = (parent as Record<string, JsonValue>)[segment as string];
  }
  const last = path[path.length - 1];
  return Array.isArray(parent) ? (last as number) : Object.keys(parent as object).indexOf(last as string);
}
