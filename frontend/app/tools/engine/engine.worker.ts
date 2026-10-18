/// <reference lib="webworker" />
import { runEngine } from "./run";
import { runTask, type Task } from "./tasks";
import type { EngineRequest } from "./types";

type Message =
  | { id: number; request: EngineRequest }
  | { id: number; task: Task };

self.onmessage = async (event: MessageEvent<Message>) => {
  const message = event.data;
  const result =
    "task" in message ? await runTask(message.task) : await runEngine(message.request);
  self.postMessage({ id: message.id, result });
};
