import { pdfBaseName, type PdfFile } from "./pdf";

/**
 * qpdf (Apache-2.0) compiled to WebAssembly, for the jobs pdf-lib cannot
 * do: encryption, decryption and stream recompression. About 1.3 MB,
 * loaded only by the tools that need it.
 */
type QpdfInstance = {
  callMain(args: string[]): number;
  FS: { writeFile(path: string, data: Uint8Array): void; readFile(path: string): Uint8Array; unlink(path: string): void };
};

let wasmLocation: string | undefined;
let instance: Promise<QpdfInstance> | undefined;

/** Tests run in Node, where the wasm file is read from disk. */
export function setQpdfWasmLocation(location: string) {
  wasmLocation = location;
}

function qpdf() {
  instance ??= (async () => {
    const [{ default: createModule }, location] = await Promise.all([
      import("@neslinesli93/qpdf-wasm"),
      wasmLocation ?? import("@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url").then((m) => m.default),
    ]);
    // This build binds console.log and console.error when it starts and
    // ignores print/printErr, so give it quiet stand-ins for its expected
    // messages ("invalid password" and the like).
    const { log, error } = console;
    console.log = () => {};
    console.error = () => {};
    let ready: Promise<QpdfInstance>;
    try {
      ready = (createModule as unknown as (arg: object) => Promise<QpdfInstance>)({ locateFile: () => location });
    } finally {
      console.log = log;
      console.error = error;
    }
    return ready;
  })().catch((error) => {
    instance = undefined;
    throw error;
  });
  return instance;
}

let run = 0;

/**
 * Runs qpdf on one input file and returns the output, or the exit code
 * when it fails (2 = error, 3 = succeeded with warnings, still usable).
 */
async function runQpdf(input: Uint8Array, args: (inPath: string, outPath: string) => string[]) {
  const q = await qpdf();
  const id = run++;
  const inPath = `/in-${id}.pdf`;
  const outPath = `/out-${id}.pdf`;
  q.FS.writeFile(inPath, input);
  try {
    let code: number;
    try {
      code = q.callMain(args(inPath, outPath));
    } catch {
      code = 2;
    }
    if (code !== 0 && code !== 3) return { ok: false as const, code };
    return { ok: true as const, data: q.FS.readFile(outPath) };
  } finally {
    for (const path of [inPath, outPath])
      try {
        q.FS.unlink(path);
      } catch {
        /* not created */
      }
  }
}

async function isEncrypted(file: PdfFile) {
  const { PDFDocument } = await import("pdf-lib");
  try {
    return (await PDFDocument.load(file.data, { ignoreEncryption: true, updateMetadata: false })).isEncrypted;
  } catch {
    throw new Error(`“${file.name}” could not be read as a PDF. It may be damaged.`);
  }
}

/**
 * none: not encrypted. restricted: opens without a password but has print,
 * copy or edit limits. password: a password is needed to open it.
 */
export async function encryptionStatus(file: PdfFile): Promise<"none" | "restricted" | "password"> {
  if (!(await isEncrypted(file))) return "none";
  const r = await runQpdf(file.data, (i, o) => ["--password=", "--decrypt", i, o]);
  return r.ok ? "restricted" : "password";
}

export const MIN_PASSWORD_LENGTH = 4;

/** Encrypts with AES-256: the password is needed to open the file. */
export async function protectPdf(file: PdfFile, password: string) {
  if (password.length < MIN_PASSWORD_LENGTH)
    throw new Error(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (await isEncrypted(file))
    throw new Error(`“${file.name}” already has a password. Unlock it first to set a new one.`);
  const r = await runQpdf(file.data, (i, o) => [
    "--encrypt",
    `--user-password=${password}`,
    `--owner-password=${password}`,
    "--bits=256",
    "--",
    i,
    o,
  ]);
  if (!r.ok) throw new Error(`“${file.name}” could not be protected. It may be damaged.`);
  return { name: `${pdfBaseName(file.name)}-protected.pdf`, data: r.data };
}

/**
 * Removes the password and any print, copy or edit restrictions. Needs the
 * open password when there is one; this tool does not guess passwords.
 */
export async function unlockPdf(file: PdfFile, password: string) {
  if (!(await isEncrypted(file))) throw new Error(`“${file.name}” is not password-protected, so there is nothing to unlock.`);
  const r = await runQpdf(file.data, (i, o) => [`--password=${password}`, "--decrypt", i, o]);
  if (!r.ok)
    throw new Error(
      password ? "That password is not correct. Check it and try again." : "This PDF needs its password to open. Type it and try again.",
    );
  return { name: `${pdfBaseName(file.name)}-unlocked.pdf`, data: r.data };
}

/**
 * Lossless repack: recompresses every stream at the highest Flate level
 * and packs objects into compressed object streams. With `jpegQuality`,
 * images that are not JPEG already are re-encoded as JPEG when smaller.
 */
export async function optimizePdf(data: Uint8Array, jpegQuality?: number) {
  const r = await runQpdf(data, (i, o) => [
    "--object-streams=generate",
    "--compress-streams=y",
    "--recompress-flate",
    "--compression-level=9",
    ...(jpegQuality ? ["--optimize-images", `--jpeg-quality=${jpegQuality}`] : []),
    i,
    o,
  ]);
  return r.ok ? r.data : null;
}
