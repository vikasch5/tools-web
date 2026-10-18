import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  // ES-module workers allow code splitting, so each engine loads on demand.
  worker: { format: "es" },
  resolve: {
    tsconfigPaths: true,
  },
});
