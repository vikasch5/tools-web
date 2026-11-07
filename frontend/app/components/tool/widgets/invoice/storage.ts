/**
 * Invoice data saved in the browser (IndexedDB), so history survives a
 * reload without an account. Every record has an `id` and `updatedAt`, so
 * it can later be synced to a server when sign-in is added.
 */

const DB_NAME = "alltoolsdesk-invoices";
const VERSION = 1;

export type StoreName = "documents" | "parties" | "products" | "settings";

let opening: Promise<IDBDatabase> | null = null;

function openDb() {
  opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("This browser cannot save data."));
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of ["documents", "parties", "products"]) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open saved invoices."));
    req.onblocked = () => reject(new Error("Close other tabs of this tool and reload."));
  }).catch((e) => {
    opening = null;
    throw e;
  });
  return opening;
}

async function run<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req ? req.result : (undefined as T));
    tx.onerror = () => reject(tx.error ?? new Error("Could not save."));
    tx.onabort = () => reject(tx.error ?? new Error("Saving was stopped. Your device may be out of space."));
  });
}

export const getAll = <T>(store: StoreName) => run<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);

export const put = <T>(store: StoreName, value: T) => run(store, "readwrite", (s) => void s.put(value));

export const putMany = <T>(store: StoreName, values: T[]) =>
  values.length ? run(store, "readwrite", (s) => void values.forEach((v) => s.put(v))) : Promise.resolve();

export const remove = (store: StoreName, id: string) => run(store, "readwrite", (s) => void s.delete(id));

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const row = await run<{ key: string; value: T } | undefined>("settings", "readonly", (s) => s.get(key));
  return row?.value;
}

export const putSetting = <T>(key: string, value: T) => put("settings", { key, value });

/** Asks the browser not to clear this site's data when space runs low. */
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return false;
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}
