#!/usr/bin/env node
// Tells IndexNow search engines (Bing, Yandex, Naver, Seznam…) which pages
// are new or changed, so they crawl them within minutes instead of weeks.
// Google does not use IndexNow; it reads the sitemap instead.
//
//   node scripts/indexnow.mjs          # pages new or changed since build-previous/
//   node scripts/indexnow.mjs --all    # every page in the sitemap
//
// Run by deploy.sh after the new build is live. It never fails a deploy:
// problems are printed and the script exits 0.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const endpoint = process.env.INDEXNOW_ENDPOINT ?? "https://api.indexnow.org/indexnow";
const live = join(root, "build", "client");
const previous = join(root, "build-previous", "client");
const all = process.argv.includes("--all");

function main() {
  const keyFile = readdirSync(live).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!keyFile) return console.log("IndexNow: no key file in build/client, skipped.");
  const key = readFileSync(join(live, keyFile), "utf8").trim();

  const sitemap = readFileSync(join(live, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) return console.log("IndexNow: sitemap has no URLs, skipped.");
  const host = new URL(urls[0]).host;

  // A page counts as changed when its prerendered HTML differs from the
  // previous build (or the previous build does not have it).
  const page = (dir, url) => {
    const path = new URL(url).pathname.replace(/^\/|\/$/g, "");
    const file = join(dir, path, "index.html");
    return existsSync(file) ? readFileSync(file, "utf8") : null;
  };
  const changed = all || !existsSync(previous) ? urls : urls.filter((u) => page(live, u) !== page(previous, u));
  if (!changed.length) return console.log("IndexNow: no pages changed, nothing to send.");

  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: `https://${host}/${keyFile}`, urlList: changed.slice(0, 10000) }),
    signal: AbortSignal.timeout(20000),
  }).then((r) =>
    console.log(
      r.ok
        ? `IndexNow: sent ${changed.length} page${changed.length === 1 ? "" : "s"} (HTTP ${r.status}).`
        : `IndexNow: the server answered HTTP ${r.status}; pages will still be found through the sitemap.`,
    ),
  );
}

Promise.resolve()
  .then(main)
  .catch((error) => console.log(`IndexNow: not sent (${error.message}); pages will still be found through the sitemap.`));
