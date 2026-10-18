import { describe, expect, it } from "vitest";
import { convertCase, splitWords } from "./case";

describe("convertCase", () => {
  it("splits identifiers, acronyms and digits", () => {
    expect(splitWords("parseHTTPResponse_v2-final")).toEqual(["parse", "http", "response", "v2", "final"]);
  });

  it("converts identifier cases line by line", () => {
    const input = "user id\nHTTPServerError";
    expect(convertCase(input, "camel")).toBe("userId\nhttpServerError");
    expect(convertCase(input, "constant")).toBe("USER_ID\nHTTP_SERVER_ERROR");
    expect(convertCase(input, "kebab")).toBe("user-id\nhttp-server-error");
  });

  it("title-cases with minor words", () => {
    expect(convertCase("the lord of the rings: the return of the king", "title")).toBe(
      "The Lord of the Rings: The Return of the King",
    );
    expect(convertCase("what are you looking at", "title")).toBe("What Are You Looking At");
  });

  it("sentence-cases and keeps I", () => {
    expect(convertCase("HELLO THERE. i THINK so!\nnew line", "sentence")).toBe("Hello there. I think so!\nNew line");
  });

  it("swaps case and handles accents", () => {
    expect(convertCase("Ärger iST", "swap")).toBe("äRGER Ist");
    expect(convertCase("crème brûlée", "pascal")).toBe("CrèmeBrûlée");
  });
});
