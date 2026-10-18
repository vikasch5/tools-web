import { offsetToLineColumn } from "./json";
import type { EngineAction, EngineOptions, EngineResult } from "./types";

type XmlNode =
  | { kind: "element"; name: string; attrs: string; children: XmlNode[]; selfClosing: boolean }
  | { kind: "text"; value: string }
  | { kind: "raw"; value: string; comment: boolean };

class XmlError extends Error {
  constructor(
    message: string,
    readonly offset: number,
  ) {
    super(message);
  }
}

const NAME = /[A-Za-z_:][\w.:-]*/y;
const ENTITY = /&(?:#\d+|#x[0-9a-fA-F]+|[A-Za-z_][\w.-]*);/y;

/**
 * Small well-formedness parser: balanced tags, one root element, quoted
 * and unique attributes, escaped "<" and "&". It does not read DTDs or
 * validate against a schema.
 */
export function parseXml(input: string): XmlNode[] {
  const root: XmlNode[] = [];
  const stack: { node: Extract<XmlNode, { kind: "element" }>; offset: number }[] = [];
  const children = () => (stack.length ? stack[stack.length - 1].node.children : root);
  let i = 0;

  const until = (end: string, what: string) => {
    const close = input.indexOf(end, i);
    if (close < 0) throw new XmlError(`${what} is never closed.`, i);
    const value = input.slice(i, close + end.length);
    i = close + end.length;
    return value;
  };

  while (i < input.length) {
    if (input[i] !== "<") {
      const next = input.indexOf("<", i);
      const end = next < 0 ? input.length : next;
      const text = input.slice(i, end);
      for (let a = text.indexOf("&"); a >= 0; a = text.indexOf("&", a + 1)) {
        ENTITY.lastIndex = a;
        if (!ENTITY.test(text)) throw new XmlError("“&” must be escaped as &amp;.", i + a);
      }
      if (!stack.length && text.trim()) throw new XmlError("Text is not allowed outside the root element.", i + text.search(/\S/));
      children().push({ kind: "text", value: text });
      i = end;
      continue;
    }
    if (input.startsWith("<!--", i)) children().push({ kind: "raw", value: until("-->", "A comment"), comment: true });
    else if (input.startsWith("<![CDATA[", i)) {
      if (!stack.length) throw new XmlError("CDATA is only allowed inside an element.", i);
      children().push({ kind: "raw", value: until("]]>", "A CDATA section"), comment: false });
    } else if (input.startsWith("<?", i)) children().push({ kind: "raw", value: until("?>", "A processing instruction"), comment: false });
    else if (/^<!DOCTYPE/i.test(input.slice(i, i + 9))) {
      const subset = input.indexOf("[", i);
      const close = input.indexOf(">", i);
      if (subset >= 0 && subset < close) {
        const end = input.indexOf("]", subset);
        const value = input.slice(i, end + 1);
        i = end + 1;
        children().push({ kind: "raw", value: value + until(">", "The DOCTYPE").trimStart(), comment: false });
      } else children().push({ kind: "raw", value: until(">", "The DOCTYPE"), comment: false });
    } else if (input[i + 1] === "/") {
      const start = i;
      NAME.lastIndex = i + 2;
      const name = NAME.exec(input)?.[0];
      const close = input.indexOf(">", i);
      if (!name || close < 0 || input.slice(i + 2 + name.length, close).trim())
        throw new XmlError("Malformed closing tag.", start);
      const open = stack.pop();
      if (!open) throw new XmlError(`Closing tag </${name}> has no matching opening tag.`, start);
      if (open.node.name !== name)
        throw new XmlError(`Expected </${open.node.name}> but found </${name}>.`, start);
      i = close + 1;
    } else {
      const start = i;
      NAME.lastIndex = i + 1;
      const name = NAME.exec(input)?.[0];
      if (!name) throw new XmlError("“<” must be escaped as &lt; or start a tag.", start);
      i += 1 + name.length;
      const attrs: string[] = [];
      const seen = new Set<string>();
      for (;;) {
        const space = /\s*/y;
        space.lastIndex = i;
        const gap = space.exec(input)![0];
        i += gap.length;
        if (input.startsWith("/>", i) || input[i] === ">") break;
        if (i >= input.length) throw new XmlError(`Tag <${name}> is never closed.`, start);
        if (!gap) throw new XmlError("Attributes must be separated by whitespace.", i);
        NAME.lastIndex = i;
        const attr = NAME.exec(input)?.[0];
        if (!attr) throw new XmlError(`Unexpected “${input[i]}” in tag <${name}>.`, i);
        if (seen.has(attr)) throw new XmlError(`Attribute “${attr}” is repeated.`, i);
        seen.add(attr);
        const value = /\s*=\s*("[^"<]*"|'[^'<]*')/y;
        value.lastIndex = i + attr.length;
        const match = value.exec(input);
        if (!match) throw new XmlError(`Attribute “${attr}” needs a quoted value.`, i);
        attrs.push(`${attr}=${match[1]}`);
        i = value.lastIndex;
      }
      if (!stack.length && root.some((n) => n.kind === "element"))
        throw new XmlError("A document can only have one root element.", start);
      const selfClosing = input[i] === "/";
      const node = { kind: "element" as const, name, attrs: attrs.map((a) => " " + a).join(""), children: [], selfClosing };
      children().push(node);
      if (!selfClosing) stack.push({ node, offset: start });
      i += selfClosing ? 2 : 1;
    }
  }
  if (stack.length) {
    const open = stack[stack.length - 1];
    throw new XmlError(`<${open.node.name}> is never closed.`, open.offset);
  }
  if (!root.some((n) => n.kind === "element")) throw new XmlError("No root element found.", 0);
  return root;
}

function serialize(nodes: XmlNode[], indent: string | null, keepComments: boolean): string {
  const lines: string[] = [];
  const write = (list: XmlNode[], depth: number) => {
    const pad = indent === null ? "" : indent.repeat(depth);
    for (const node of list) {
      if (node.kind === "text") {
        if (indent === null) {
          if (node.value.trim()) lines.push(node.value);
        } else if (node.value.trim()) lines.push(pad + node.value.trim());
        continue;
      }
      if (node.kind === "raw") {
        if (node.comment && !keepComments) continue;
        lines.push(pad + node.value);
        continue;
      }
      const open = `<${node.name}${node.attrs}`;
      if (node.selfClosing || !node.children.length) {
        lines.push(`${pad}${open}${node.selfClosing ? "/>" : `></${node.name}>`}`);
      } else if (indent !== null && node.children.every((c) => c.kind !== "element" && !(c.kind === "raw" && c.comment))) {
        // Text-only elements stay on one line.
        const body = node.children.map((c) => (c.kind === "text" ? c.value : c.value)).join("").trim();
        lines.push(`${pad}${open}>${body}</${node.name}>`);
      } else {
        lines.push(`${pad}${open}>`);
        write(node.children, depth + 1);
        lines.push(`${pad}</${node.name}>`);
      }
    }
  };
  write(nodes, 0);
  return lines.join(indent === null ? "" : "\n");
}

export function runXml(action: EngineAction, input: string, options: EngineOptions): EngineResult {
  let nodes: XmlNode[];
  try {
    nodes = parseXml(input);
  } catch (error) {
    if (error instanceof XmlError)
      return { ok: false, error: { message: error.message, ...offsetToLineColumn(input, error.offset) } };
    throw error;
  }
  switch (action) {
    case "validate":
      return { ok: true, output: null, message: "Well-formed XML" };
    case "minify":
      return { ok: true, output: serialize(nodes, null, options.keepComments === true), message: "Minified" };
    default: {
      const indent = options.indent === "tab" ? "\t" : " ".repeat(Number(options.indent ?? 2));
      return { ok: true, output: serialize(nodes, indent, true), message: "Formatted" };
    }
  }
}
