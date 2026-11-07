import { useState } from "react";
import { ArchiveRestore, DatabaseBackup } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { makeBackup, parseBackup, type Business } from "~/tools/engine/invoice";
import { StatusMessage, downloadBlob, type StatusTone } from "../../Panel";
import { todayIso } from "./Editor";
import type { InvoiceStore } from "./useInvoiceData";

export function Backup({ store, business }: { store: InvoiceStore; business: Business }) {
  const { documents, parties, products } = store.data;
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);

  const backup = () => {
    const data = makeBackup({ business, parties, products, documents });
    downloadBlob(new Blob([JSON.stringify(data)], { type: "application/json" }), `invoices-backup-${todayIso()}.json`);
    setMessage({
      tone: "success",
      text: `Backup saved: ${documents.length} documents, ${parties.length} customers, ${products.length} items. Keep it somewhere safe, such as Google Drive.`,
    });
  };

  const restore = async (file: File) => {
    try {
      const changed = await store.restore(parseBackup(await file.text()), store.data);
      setMessage({ tone: "success", text: changed ? `Restored ${changed} records from ${file.name}.` : "Everything in this backup is already here." });
    } catch (e) {
      setMessage({ tone: "error", text: (e as Error).message });
    }
  };

  return (
    <section aria-labelledby="backup-title" className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-md sm:p-5">
      <h2 id="backup-title" className="label-mono font-sans text-fg">
        Backup and restore
      </h2>
      <p className="text-sm text-fg-muted">
        Everything here is saved in this browser only. Clearing browser data deletes it, so download a backup regularly. Restore it on another phone or computer to carry on
        there.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button icon={DatabaseBackup} onClick={backup}>
          Download backup
        </Button>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-fg shadow-sm hover:border-border-strong has-focus-visible:outline-2 has-focus-visible:outline-ring pointer-coarse:h-11">
          <ArchiveRestore aria-hidden size={16} strokeWidth={1.75} />
          Restore backup
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void restore(f);
            }}
          />
        </label>
      </div>
      {message && <StatusMessage tone={message.tone}>{message.text}</StatusMessage>}
    </section>
  );
}
