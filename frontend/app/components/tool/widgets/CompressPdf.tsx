import { useEffect, useState } from "react";
import { Download, Minimize2 } from "lucide-react";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import type { PdfFile } from "~/tools/engine/pdf";
import { compressLevels, sizeChange, type CompressLevel } from "~/tools/engine/pdf-compress";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { pdfBlob, toPdfFile } from "./pdf-shared";
import { FileSummary, PdfDropPanel, type Status } from "./PdfChrome";
import { StatGrid } from "./results";

const IDLE: Status = { tone: "idle", text: "Your PDF stays on your device." };

const levels: { value: CompressLevel; label: string; help: string }[] = [
  {
    value: "low",
    label: "Lossless",
    help: "Repacks the file without touching images or text. Nothing changes visually; savings are usually modest.",
  },
  {
    value: "medium",
    label: "Recommended",
    help: `Also re-encodes photos and scans as JPEG at ${compressLevels.medium!.quality}% quality and scales down images over ${compressLevels.medium!.maxEdge} px. Text stays sharp and selectable.`,
  },
  {
    value: "high",
    label: "Strong",
    help: `Images at ${compressLevels.high!.quality}% quality and at most ${compressLevels.high!.maxEdge} px: the smallest file, with softer photos. Text stays sharp and selectable.`,
  },
];

/** Savings under 1% are not worth a new file. */
const worthIt = (before: number, after: number) => before - after > before * 0.01;

type Result = { name: string; data: Uint8Array; before: number; after: number; reencoded: number; level: CompressLevel };

export function CompressPdf() {
  const [doc, setDoc] = useState<{ file: File; pdf: PdfFile } | null>(null);
  const [level, setLevel] = useState<CompressLevel>("medium");
  const [result, setResult] = useState<Result | null>(null);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);

  useEffect(() => warmUpWorker(), []);

  if (!doc)
    return (
      <PdfDropPanel
        status={status}
        onFile={async (file) => {
          setStatus(IDLE);
          setResult(null);
          setDoc({ file, pdf: await toPdfFile(file) });
        }}
        onReject={(text) => setStatus({ tone: "error", text })}
      />
    );

  const compress = async () => {
    setWorking(true);
    setResult(null);
    const r = await runTaskInWorker({ type: "pdf-compress", file: doc.pdf, level });
    setWorking(false);
    if (!r.ok) return setStatus({ tone: "error", text: r.message });
    setResult({ ...r.value, level });
    setStatus(
      worthIt(r.value.before, r.value.after)
        ? { tone: "success", text: `Compressed: ${formatBytes(r.value.before)} → ${formatBytes(r.value.after)} (${sizeChange(r.value.before, r.value.after)}).` }
        : {
            tone: "warning",
            text:
              level === "low"
                ? "This PDF is already packed tightly. Try Recommended to shrink its images."
                : "This PDF could not be made smaller; it is already well compressed.",
          },
    );
  };

  const help = levels.find((l) => l.value === level)!.help;
  const fresh = result && result.level === level;
  const saved = result ? result.before - result.after : 0;
  const useful = !!result && worthIt(result.before, result.after);

  return (
    <Panel
      action={
        fresh && useful ? (
          <PrimaryAction icon={Download} onClick={() => downloadBlob(pdfBlob(result.data), result.name)}>
            Download compressed PDF ({formatBytes(result.after)})
          </PrimaryAction>
        ) : (
          <PrimaryAction icon={Minimize2} busy={working} onClick={compress}>
            {working ? "Compressing…" : fresh ? "Compress again" : "Compress PDF"}
          </PrimaryAction>
        )
      }
      toolbar={
        <Segmented
          label="Level"
          value={level}
          onChange={(v) => setLevel(v as CompressLevel)}
          choices={levels.map(({ value, label }) => ({ value, label }))}
        />
      }
      status={
        working ? (
          <StatusMessage tone="working">Compressing… large scans can take a minute.</StatusMessage>
        ) : (
          <StatusMessage tone={status.tone}>{status === IDLE ? help : status.text}</StatusMessage>
        )
      }
    >
      <FileSummary
        file={doc.file}
        onRemove={() => {
          setDoc(null);
          setResult(null);
          setStatus(IDLE);
        }}
      />
      {result && useful && (
        <PanelSection
          title="Result"
          className="border-t border-border"
        >
          <StatGrid
            stats={[
              { label: "Before", value: formatBytes(result.before) },
              { label: "After", value: formatBytes(result.after) },
              { label: "Change", value: sizeChange(result.before, result.after) },
              { label: "Saved", value: formatBytes(saved) },
            ]}
          />
          {!fresh && (
            <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
              This result is from the {levels.find((l) => l.value === result.level)!.label} level. Press Compress PDF to try this one.
            </p>
          )}
        </PanelSection>
      )}
    </Panel>
  );
}
