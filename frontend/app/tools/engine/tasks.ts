import type { DiffOptions, DiffResult } from "./diff";
import type { ImageJob } from "./image";
import type { PdfFile, SplitMode } from "./pdf";
import type { ImagesPdfOptions, PdfImage } from "./images-pdf";
import type { HashAlgorithm } from "./hash";

/** Binary and structured jobs for the engine worker (files in, files out). */
export type Task =
  | { type: "diff"; original: string; changed: string; options: DiffOptions }
  | { type: "pdf-count"; file: PdfFile }
  | { type: "pdf-merge"; files: PdfFile[] }
  | { type: "pdf-split"; file: PdfFile; mode: SplitMode; ranges: string }
  | { type: "pdf-rotate"; file: PdfFile; turns: number[] }
  | { type: "images-pdf"; images: PdfImage[]; options: ImagesPdfOptions }
  | { type: "hash"; data: Uint8Array }
  | { type: "image"; job: ImageJob };

export type TaskOutputs = {
  diff: DiffResult;
  "pdf-count": number;
  "pdf-merge": { data: Uint8Array; pageCount: number };
  "pdf-split": { name: string; data: Uint8Array; files: number; type: string };
  "pdf-rotate": { name: string; data: Uint8Array; rotations: number[] };
  "images-pdf": { data: Uint8Array; pageCount: number };
  hash: Record<HashAlgorithm, string>;
  image: Blob;
};

export type TaskResult<T extends Task["type"]> =
  | { ok: true; value: TaskOutputs[T] }
  | { ok: false; message: string };

export async function runTask<T extends Task>(task: T): Promise<TaskResult<T["type"]>> {
  try {
    const value = await dispatch(task);
    return { ok: true, value: value as TaskOutputs[T["type"]] };
  } catch (error) {
    return { ok: false, message: String((error as Error)?.message ?? error) };
  }
}

async function dispatch(task: Task) {
  switch (task.type) {
    case "diff": {
      const { diffLines } = await import("./diff");
      return diffLines(task.original, task.changed, task.options);
    }
    case "pdf-count":
      return (await import("./pdf")).pdfPageCount(task.file);
    case "pdf-merge":
      return (await import("./pdf")).mergePdfs(task.files);
    case "pdf-split":
      return (await import("./pdf")).splitPdf(task.file, task.mode, task.ranges);
    case "pdf-rotate":
      return (await import("./pdf")).rotatePdf(task.file, task.turns);
    case "images-pdf":
      return (await import("./images-pdf")).imagesToPdf(task.images, task.options);
    case "hash":
      return (await import("./hash")).hashAll(task.data);
    case "image":
      return (await import("./image")).renderImage(task.job);
  }
}
