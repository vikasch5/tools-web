import type { Route } from "./+types/invoices";
import { InvoicePanel } from "~/components/tool/widgets/invoice/InvoicePanel";
import { buildMeta } from "~/lib/seo";
import { site } from "~/config/site";

export const handle = { bare: true };

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Invoice panel – ${site.name}`,
    description: "Your invoices, quotations, customers and items in one place. Saved in this browser on this device.",
    path: "/invoices",
    noindex: true,
  });
}

export default function Invoices() {
  return <InvoicePanel />;
}
