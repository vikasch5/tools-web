import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMeta } from "./seo";

async function loadWith(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  const site = await import("~/config/site");
  const adsTxt = await import("~/routes/ads-txt");
  return { ads: site.ads, adsTxt: () => adsTxt.loader().text() };
}

afterEach(() => vi.unstubAllEnvs());

describe("AdSense configuration", () => {
  it("is off, with an empty ads.txt, until a publisher ID is set", async () => {
    const { ads, adsTxt } = await loadWith({ VITE_ADSENSE_CLIENT: "", VITE_ADSENSE_SLOT: "123" });
    expect(ads.enabled).toBe(false);
    expect(ads.slot).toBeUndefined();
    expect(await adsTxt()).toBe("# No advertising sellers are authorised yet.\n");
  });

  it("authorises Google as a direct seller in ads.txt", async () => {
    const { ads, adsTxt } = await loadWith({ VITE_ADSENSE_CLIENT: "ca-pub-1234567890123456", VITE_ADSENSE_SLOT: "9876543210" });
    expect(ads).toMatchObject({ enabled: true, publisherId: "pub-1234567890123456", slot: "9876543210" });
    expect(await adsTxt()).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
  });

  it("rejects a malformed publisher ID instead of publishing a broken ads.txt", async () => {
    await expect(loadWith({ VITE_ADSENSE_CLIENT: "pub-123" })).rejects.toThrow(/ca-pub-/);
  });
});

describe("social share tags", () => {
  it("include a large Open Graph and Twitter image with an absolute URL", () => {
    const meta = buildMeta({ title: "T", description: "D", path: "/x" });
    const find = (key: string) =>
      meta.find((m) => ("property" in m && m.property === key) || ("name" in m && m.name === key)) as
        | { content: string }
        | undefined;
    expect(find("og:image")?.content).toMatch(/^https?:\/\/.+\/og-image\.png$/);
    expect(find("og:image:width")?.content).toBe("1200");
    expect(find("twitter:card")?.content).toBe("summary_large_image");
    expect(find("twitter:image")?.content).toBe(find("og:image")?.content);
  });
});
