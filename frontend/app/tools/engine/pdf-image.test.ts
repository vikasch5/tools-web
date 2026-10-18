import { describe, expect, it } from "vitest";
import { MAX_PAGE_PIXELS, pageImageName, pageImageSize } from "./pdf-image";

describe("pageImageSize", () => {
  it("scales points to pixels at the chosen DPI", () => {
    expect(pageImageSize(612, 792, 72)).toMatchObject({ width: 612, height: 792, reduced: false });
  });

  it("caps huge pages below the pixel limit", () => {
    const size = pageImageSize(2384, 3370, 300); // A0 poster
    expect(size.reduced).toBe(true);
    expect(size.width * size.height).toBeLessThanOrEqual(MAX_PAGE_PIXELS * 1.001);
  });
});

describe("pageImageName", () => {
  it("pads page numbers to the page count width", () => {
    expect(pageImageName("Scan.PDF", 7, 120, "jpg")).toBe("Scan-page-007.jpg");
    expect(pageImageName(".pdf", 1, 1, "png")).toBe("document-page-1.png");
  });
});
