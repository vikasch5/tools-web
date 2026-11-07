import { useCallback, useEffect, useState } from "react";
import { mergeRecords, type Backup, type Business, type InvoiceDoc, type Party, type Product } from "~/tools/engine/invoice";
import * as db from "./storage";

export type InvoiceData = {
  ready: boolean;
  /** Set when the browser cannot save (private mode, storage blocked); data then lasts until the tab closes. */
  storageError: string;
  business: Business | null;
  documents: InvoiceDoc[];
  parties: Party[];
  products: Product[];
};

type Collection = "documents" | "parties" | "products";

const upsert = <T extends { id: string }>(list: T[], items: T[]) => {
  const ids = new Set(items.map((i) => i.id));
  return [...items, ...list.filter((i) => !ids.has(i.id))];
};

/** Loads saved invoices, customers, items and the business profile, and saves changes. */
export function useInvoiceData() {
  const [data, setData] = useState<InvoiceData>({ ready: false, storageError: "", business: null, documents: [], parties: [], products: [] });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [business, documents, parties, products] = await Promise.all([
          db.getSetting<Business>("business"),
          db.getAll<InvoiceDoc>("documents"),
          db.getAll<Party>("parties"),
          db.getAll<Product>("products"),
        ]);
        if (live) setData({ ready: true, storageError: "", business: business ?? null, documents, parties, products });
        void db.requestPersistence();
      } catch (e) {
        if (live)
          setData((d) => ({
            ...d,
            ready: true,
            storageError: `${(e as Error).message || "This browser cannot save data."} Invoices will be lost when you close this tab, so download each PDF.`,
          }));
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  /** Updates memory first, then the browser's storage; storage errors are reported, not thrown. */
  const persist = useCallback(async (job: () => Promise<unknown>) => {
    try {
      await job();
    } catch (e) {
      setData((d) => ({ ...d, storageError: `Could not save: ${(e as Error).message}` }));
    }
  }, []);

  const save = useCallback(
    <T extends { id: string }>(collection: Collection, items: T[]) => {
      setData((d) => ({ ...d, [collection]: upsert(d[collection] as unknown as T[], items) }));
      return persist(() => db.putMany(collection, items));
    },
    [persist],
  );

  const removeItem = useCallback(
    (collection: Collection, id: string) => {
      setData((d) => ({ ...d, [collection]: (d[collection] as { id: string }[]).filter((x) => x.id !== id) }));
      return persist(() => db.remove(collection, id));
    },
    [persist],
  );

  const saveBusiness = useCallback(
    (business: Business) => {
      setData((d) => ({ ...d, business }));
      return persist(() => db.putSetting("business", business));
    },
    [persist],
  );

  /** Adds a backup's records; for the same record, the copy edited last wins. Returns how many records changed. */
  const restore = useCallback(
    async (backup: Backup, current: InvoiceData) => {
      const docs = mergeRecords(current.documents, backup.documents);
      const parties = mergeRecords(current.parties, backup.parties);
      const products = mergeRecords(current.products, backup.products);
      await save("documents", docs);
      await save("parties", parties);
      await save("products", products);
      if (backup.business && !current.business?.name) await saveBusiness(backup.business);
      return docs.length + parties.length + products.length;
    },
    [save, saveBusiness],
  );

  return {
    data,
    saveDocs: (docs: InvoiceDoc[]) => save("documents", docs),
    deleteDoc: (id: string) => removeItem("documents", id),
    saveParties: (parties: Party[]) => save("parties", parties),
    deleteParty: (id: string) => removeItem("parties", id),
    saveProducts: (products: Product[]) => save("products", products),
    deleteProduct: (id: string) => removeItem("products", id),
    saveBusiness,
    restore,
  };
}

export type InvoiceStore = ReturnType<typeof useInvoiceData>;
