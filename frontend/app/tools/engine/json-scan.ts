/**
 * Minimal JSON scanner used only to find *where* parsing fails. Some V8
 * versions report errors such as "Unexpected token 'x' ... is not valid
 * JSON" without a position, so we locate the offset ourselves.
 * Returns the 0-based offset of the first error, or -1 if the text is valid.
 */
export function findJsonErrorOffset(text: string): number {
  let i = 0;

  const fail = (): never => {
    throw i;
  };
  const ws = () => {
    while (i < text.length && " \t\n\r".includes(text[i])) i++;
  };
  const literal = (word: string) => {
    for (const ch of word) {
      if (text[i] !== ch) fail();
      i++;
    }
  };
  const string = () => {
    i++; // opening quote
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"') return void i++;
      if (ch === "\\") {
        i++;
        if (text[i] === "u") {
          for (let k = 1; k <= 4; k++)
            if (!/[0-9a-f]/i.test(text[i + k] ?? "")) fail();
          i += 5;
        } else if ('"\\/bfnrt'.includes(text[i] ?? "")) i++;
        else fail();
      } else if (ch < " ") fail();
      else i++;
    }
    fail();
  };
  const number = () => {
    const match = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!match) fail();
    i += match![0].length;
  };
  const value = (): void => {
    ws();
    const ch = text[i];
    if (ch === "{") {
      i++;
      ws();
      if (text[i] === "}") return void i++;
      for (;;) {
        ws();
        if (text[i] !== '"') fail();
        string();
        ws();
        if (text[i] !== ":") fail();
        i++;
        value();
        ws();
        if (text[i] === ",") i++;
        else if (text[i] === "}") return void i++;
        else fail();
      }
    }
    if (ch === "[") {
      i++;
      ws();
      if (text[i] === "]") return void i++;
      for (;;) {
        value();
        ws();
        if (text[i] === ",") i++;
        else if (text[i] === "]") return void i++;
        else fail();
      }
    }
    if (ch === '"') return string();
    if (ch === "t") return literal("true");
    if (ch === "f") return literal("false");
    if (ch === "n") return literal("null");
    if (ch === "-" || (ch >= "0" && ch <= "9")) return number();
    fail();
  };

  try {
    value();
    ws();
    if (i < text.length) fail();
    return -1;
  } catch (offset) {
    if (typeof offset !== "number") throw offset;
    return Math.min(Math.max(offset, 0), text.length);
  }
}
