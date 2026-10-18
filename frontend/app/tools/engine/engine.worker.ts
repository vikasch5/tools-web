/// <reference lib="webworker" />
import { runEngine } from "./run";
import type { EngineRequest } from "./types";

self.onmessage = async (
  event: MessageEvent<{ id: number; request: EngineRequest }>,
) => {
  const { id, request } = event.data;
  const result = await runEngine(request);
  self.postMessage({ id, result });
};
