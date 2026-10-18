import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { ads } from "~/config/site";
import { cn } from "~/lib/cn";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One responsive AdSense display unit, kept clear of tool controls.
 * Renders nothing until a publisher ID and ad unit ID are configured, so no
 * empty boxes or mock ads appear before launch. The space is reserved up front
 * to avoid layout shift.
 */
export function AdSlot({ className }: { className?: string }) {
  const { pathname } = useLocation();
  if (!ads.client || !ads.slot) return null;
  // A fresh <ins> per page, since AdSense fills each element only once.
  return <AdUnit key={pathname} client={ads.client} slot={ads.slot} className={className} />;
}

function AdUnit({ client, slot, className }: { client: string; slot: string; className?: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (ref.current?.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // Blocked by an ad blocker or already filled; the reserved space stays empty.
    }
  }, []);

  return (
    <aside aria-label="Advertisement" className={cn("mx-auto w-full max-w-4xl", className)}>
      <p className="label-mono text-center text-fg-subtle">Advertisement</p>
      <ins
        ref={ref}
        className="adsbygoogle ad-slot mt-2 block"
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
