// csso's package root pulls in Node-only modules; the browser build has no types.
declare module "csso/dist/csso.esm" {
  export function minify(
    source: string,
    options?: {
      restructure?: boolean;
      comments?: boolean | "exclamation" | "first-exclamation";
    },
  ): { css: string };
}
