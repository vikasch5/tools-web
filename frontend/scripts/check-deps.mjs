// Runs before every `npm run build` (the "prebuild" script).
//
// A build that starts without its dependencies fails half-way, after it
// has already deleted the old build/, which takes the live site down.
// This check stops first, with a clear message, while the old site is
// still in place.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));

const problems = [];
for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
  const installed = join(root, "node_modules", name, "package.json");
  const wanted = lock.packages?.[`node_modules/${name}`]?.version;
  if (!existsSync(installed)) {
    problems.push(`${name} is not installed`);
    continue;
  }
  const version = JSON.parse(readFileSync(installed, "utf8")).version;
  if (wanted && version !== wanted) problems.push(`${name} is ${version}, package-lock.json wants ${wanted}`);
}

if (problems.length) {
  console.error(
    [
      "",
      "Build stopped: dependencies are missing or out of date.",
      ...problems.slice(0, 10).map((p) => `  - ${p}`),
      ...(problems.length > 10 ? [`  - …and ${problems.length - 10} more`] : []),
      "",
      "Run this first, then build again:",
      "  npm ci",
      "",
      "Nothing was changed: the current build/ is still in place.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
