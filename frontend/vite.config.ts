import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

/**
 * pdf.js loads font, character-map, colour-profile and image-decoder data
 * at runtime. Serve them same-origin under /pdfjs/ (from node_modules in
 * dev, copied into the client build), so PDF rendering needs no CDN.
 */
function pdfjsAssets(): Plugin {
  const root = "node_modules/pdfjs-dist";
  const dirs = ["cmaps", "standard_fonts", "wasm", "iccs"];
  return {
    name: "pdfjs-assets",
    configureServer(server) {
      server.middlewares.use("/pdfjs/", (req, res, next) => {
        const [dir, file] = (req.url ?? "").split("?")[0].replace(/^\//, "").split("/");
        if (!dirs.includes(dir) || !file || file.includes("..")) return next();
        try {
          res.end(readFileSync(join(root, dir, decodeURIComponent(file))));
        } catch {
          next();
        }
      });
    },
    generateBundle() {
      if (this.environment.name !== "client") return;
      for (const dir of dirs)
        for (const file of readdirSync(join(root, dir)))
          this.emitFile({ type: "asset", fileName: `pdfjs/${dir}/${file}`, source: readFileSync(join(root, dir, file)) });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), pdfjsAssets()],
  // ES-module workers allow code splitting, so each engine loads on demand.
  worker: { format: "es" },
  resolve: {
    tsconfigPaths: true,
  },
});
