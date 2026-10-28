import type { PageWord, RenderedPage } from "~/tools/engine/docx-pdf";

/** CSS pixels to PDF points. */
const PT = 72 / 96;

const sectionsOf = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(".docx-wrapper > section.docx")];

/** Height in pixels of a CSS length such as "792.00pt", measured in place. */
function lengthPx(parent: HTMLElement, length: string) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;height:${length}`;
  parent.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
}

/**
 * True when every page box is no taller than its page size, i.e. the file
 * carries Word's own page breaks. Otherwise the content has to be split.
 */
export function hasSavedPageBreaks(host: HTMLElement) {
  return sectionsOf(host).every(
    (s) => s.getBoundingClientRect().height <= lengthPx(s.parentElement!, s.style.minHeight || "11in") + 2,
  );
}

/**
 * Splits each section into page-sized boxes at paragraph and table-row
 * boundaries, repeating the section's header and footer on every page.
 * The boxes are built inside `stage`, which must be in the document
 * (off-screen) so they can be measured.
 */
export function paginate(host: HTMLElement, stage: HTMLElement) {
  const wrapper = document.createElement("div");
  wrapper.className = "docx-wrapper";
  stage.replaceChildren(wrapper);
  const pages: HTMLElement[] = [];

  for (const section of sectionsOf(host)) {
    const pageHeight = lengthPx(wrapper, section.style.minHeight || "11in");
    const article = section.querySelector(":scope > article");
    const header = section.querySelector(":scope > header");
    const footer = section.querySelector(":scope > footer");

    const newPage = () => {
      const page = section.cloneNode(false) as HTMLElement;
      page.style.height = `${pageHeight}px`;
      page.style.minHeight = "";
      if (header) page.appendChild(header.cloneNode(true));
      const body = (article?.cloneNode(false) as HTMLElement) ?? document.createElement("article");
      page.appendChild(body);
      if (footer) page.appendChild(footer.cloneNode(true));
      wrapper.appendChild(page);
      pages.push(page);
      return body;
    };
    // The body overflows once the page's content is taller than the page.
    const overflows = (body: HTMLElement) => body.parentElement!.scrollHeight > pageHeight + 1;

    let body = newPage();
    const place = (node: Node) => {
      body.appendChild(node);
      if (!overflows(body) || body.childNodes.length === 1) return;
      // A table that does not fit is split between rows, repeating nothing.
      if (node instanceof HTMLTableElement && node.rows.length > 1) {
        node.remove();
        splitTable(node);
        return;
      }
      node.parentNode!.removeChild(node);
      body = newPage();
      body.appendChild(node);
    };
    const splitTable = (table: HTMLTableElement) => {
      const shell = () => {
        const t = table.cloneNode(false) as HTMLTableElement;
        for (const child of table.children) if (!(child instanceof HTMLTableSectionElement)) t.appendChild(child.cloneNode(true));
        const tbody = document.createElement("tbody");
        t.appendChild(tbody);
        return { t, tbody };
      };
      let part = shell();
      body.appendChild(part.t);
      for (const row of [...table.rows]) {
        part.tbody.appendChild(row);
        if (overflows(body) && part.tbody.rows.length > 1) {
          row.remove();
          body = newPage();
          part = shell();
          body.appendChild(part.t);
          part.tbody.appendChild(row);
        }
      }
    };
    for (const child of [...(article?.childNodes ?? [])]) place(child.cloneNode(true));
  }
  return pages;
}

/** Each word's box on the page, in points from its top-left corner. */
function pageWords(page: HTMLElement): PageWord[] {
  const origin = page.getBoundingClientRect();
  const words: PageWord[] = [];
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    for (const m of text.matchAll(/\S+/g)) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom <= origin.top || r.top >= origin.bottom) continue;
      words.push({
        text: m[0],
        x: (r.left - origin.left) * PT,
        y: (r.top - origin.top) * PT,
        width: r.width * PT,
        height: r.height * PT,
      });
    }
  }
  return words;
}

/** Draws each page at `scale` × 96 DPI and records its words. */
export async function renderPages(pages: HTMLElement[], scale: number, onPage: (n: number) => void) {
  const { domToCanvas } = await import("modern-screenshot");
  const out: RenderedPage[] = [];
  for (const [i, page] of pages.entries()) {
    onPage(i + 1);
    const { width, height } = page.getBoundingClientRect();
    const canvas = await domToCanvas(page, { scale, backgroundColor: "white", width, height });
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("A page could not be drawn."))), "image/jpeg", 0.88),
    );
    out.push({
      jpeg: new Uint8Array(await blob.arrayBuffer()),
      width: width * PT,
      height: height * PT,
      words: pageWords(page),
    });
  }
  return out;
}
