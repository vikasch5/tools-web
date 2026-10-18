import type { EngineRequest, EngineResult } from "./types";

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, (result: EngineResult) => void>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./engine.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (
      event: MessageEvent<{ id: number; result: EngineResult }>,
    ) => {
      pending.get(event.data.id)?.(event.data.result);
      pending.delete(event.data.id);
    };
    worker.onerror = () => {
      for (const resolve of pending.values()) {
        resolve({
          ok: false,
          error: {
            message:
              "The processing engine failed to load. Please reload the page.",
          },
        });
      }
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

/** Runs a request in the shared background worker (browser only). */
export function runInWorker(request: EngineRequest): Promise<EngineResult> {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    getWorker().postMessage({ id, request });
  });
}

/** Starts the worker early so the first click feels instant. */
export function warmUpWorker() {
  getWorker();
}
