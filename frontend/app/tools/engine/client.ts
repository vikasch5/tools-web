import type { EngineRequest, EngineResult } from "./types";
import type { Task, TaskResult } from "./tasks";

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, (result: unknown) => void>();

const LOAD_ERROR =
  "The processing engine failed to load. Please reload the page.";

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./engine.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<{ id: number; result: unknown }>) => {
      pending.get(event.data.id)?.(event.data.result);
      pending.delete(event.data.id);
    };
    worker.onerror = () => {
      for (const resolve of pending.values()) {
        // Shaped to satisfy both EngineResult and TaskResult failures.
        resolve({ ok: false, error: { message: LOAD_ERROR }, message: LOAD_ERROR });
      }
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

function post<R>(message: object, transfer: Transferable[] = []): Promise<R> {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve as (result: unknown) => void);
    getWorker().postMessage({ id, ...message }, transfer);
  });
}

/** Runs a request in the shared background worker (browser only). */
export function runInWorker(request: EngineRequest): Promise<EngineResult> {
  return post<EngineResult>({ request });
}

/**
 * Runs a file or structured task in the worker. Image work falls back to
 * the main thread where workers cannot draw (no OffscreenCanvas).
 */
export async function runTaskInWorker<T extends Task>(task: T): Promise<TaskResult<T["type"]>> {
  if (task.type === "image" && typeof OffscreenCanvas === "undefined") {
    const { runTask } = await import("./tasks");
    return runTask(task);
  }
  return post<TaskResult<T["type"]>>({ task });
}

/** Starts the worker early so the first click feels instant. */
export function warmUpWorker() {
  getWorker();
}
