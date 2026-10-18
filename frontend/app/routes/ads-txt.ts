import { ads } from "~/config/site";

// f08c47fec0942fa0 is Google's fixed certification authority ID.
export function loader() {
  const body = ads.publisherId
    ? `google.com, ${ads.publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# No advertising sellers are authorised yet.\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
