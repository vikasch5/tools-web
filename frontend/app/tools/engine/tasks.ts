import type { DiffOptions, DiffResult } from "./diff";
import type { FormImageJob, FormImageResult, ImageJob, TargetImageJob, TargetImageResult } from "./image";
import type { PdfFile, SplitMode } from "./pdf";
import type { ImagesPdfOptions, PdfImage } from "./images-pdf";
import type { HashAlgorithm } from "./hash";
import type { PageNumberOptions, PagePlan, WatermarkImage, WatermarkOptions } from "./pdf-pages";
import type { CompressLevel } from "./pdf-compress";
import type { WordPage } from "./pdf-word";
import type { RenderedPage } from "./docx-pdf";

/** Binary and structured jobs for the engine worker (files in, files out). */
export type Task =
  | { type: "diff"; original: string; changed: string; options: DiffOptions }
  | { type: "pdf-count"; file: PdfFile }
  | { type: "pdf-merge"; files: PdfFile[] }
  | { type: "pdf-split"; file: PdfFile; mode: SplitMode; ranges: string }
  | { type: "pdf-rotate"; file: PdfFile; turns: number[] }
  | { type: "images-pdf"; images: PdfImage[]; options: ImagesPdfOptions }
  | { type: "pdf-arrange"; file: PdfFile; plan: PagePlan[]; suffix: string }
  | { type: "pdf-page-numbers"; file: PdfFile; options: PageNumberOptions }
  | { type: "pdf-watermark"; file: PdfFile; image: WatermarkImage; options: WatermarkOptions }
  | { type: "pdf-compress"; file: PdfFile; level: CompressLevel }
  | { type: "pdf-protect"; file: PdfFile; password: string }
  | { type: "pdf-unlock"; file: PdfFile; password: string }
  | { type: "pdf-encryption"; file: PdfFile }
  | { type: "docx-build"; pages: WordPage[]; bodySize: number }
  | { type: "docx-pdf"; pages: RenderedPage[]; name: string }
  | { type: "hash"; data: Uint8Array }
  | { type: "image"; job: ImageJob }
  | { type: "image-target"; job: TargetImageJob }
  | { type: "image-form"; job: FormImageJob };

export type TaskOutputs = {
  diff: DiffResult;
  "pdf-count": number;
  "pdf-merge": { data: Uint8Array; pageCount: number };
  "pdf-split": { name: string; data: Uint8Array; files: number; type: string };
  "pdf-rotate": { name: string; data: Uint8Array; rotations: number[] };
  "images-pdf": { data: Uint8Array; pageCount: number };
  "pdf-arrange": { name: string; data: Uint8Array; pageCount: number };
  "pdf-page-numbers": { name: string; data: Uint8Array; numbered: number };
  "pdf-watermark": { name: string; data: Uint8Array; marked: number };
  "pdf-compress": { name: string; data: Uint8Array; before: number; after: number; reencoded: number };
  "pdf-protect": { name: string; data: Uint8Array };
  "pdf-unlock": { name: string; data: Uint8Array };
  "pdf-encryption": "none" | "restricted" | "password";
  "docx-build": Uint8Array;
  "docx-pdf": { name: string; data: Uint8Array; pageCount: number; searchable: number };
  hash: Record<HashAlgorithm, string>;
  image: Blob;
  "image-target": TargetImageResult;
  "image-form": FormImageResult;
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
    case "pdf-arrange":
      return (await import("./pdf-pages")).arrangePdf(task.file, task.plan, task.suffix);
    case "pdf-page-numbers":
      return (await import("./pdf-pages")).addPageNumbers(task.file, task.options);
    case "pdf-watermark":
      return (await import("./pdf-pages")).addWatermark(task.file, task.image, task.options);
    case "pdf-compress":
      return (await import("./pdf-compress")).compressPdf(task.file, task.level);
    case "pdf-protect":
      return (await import("./qpdf")).protectPdf(task.file, task.password);
    case "pdf-unlock":
      return (await import("./qpdf")).unlockPdf(task.file, task.password);
    case "pdf-encryption":
      return (await import("./qpdf")).encryptionStatus(task.file);
    case "docx-build":
      return (await import("./pdf-word")).buildDocx(task.pages, task.bodySize);
    case "docx-pdf":
      return (await import("./docx-pdf")).pagesToPdf(task.pages, task.name);
    case "hash":
      return (await import("./hash")).hashAll(task.data);
    case "image":
      return (await import("./image")).renderImage(task.job);
    case "image-target":
      return (await import("./image")).compressImageToTarget(task.job);
    case "image-form":
      return (await import("./image")).fitFormImage(task.job);
  }
}
