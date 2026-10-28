import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { TextField } from "~/components/ui/Field";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import type { PdfFile } from "~/tools/engine/pdf";
import { MIN_PASSWORD_LENGTH } from "~/tools/engine/qpdf";
import { Panel, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { pdfBlob, toPdfFile } from "./pdf-shared";
import { FileSummary, PdfDropPanel, type Status } from "./PdfChrome";

const IDLE: Status = { tone: "idle", text: "Your PDF and password stay on your device." };

function PasswordField({
  label,
  value,
  onChange,
  shown,
  onToggle,
  autoComplete,
  invalid,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  shown: boolean;
  onToggle?: () => void;
  autoComplete: string;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-end gap-1.5">
      <TextField
        label={label}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        spellCheck={false}
        autoCapitalize="off"
        aria-invalid={invalid ? true : undefined}
        autoFocus={autoFocus}
        className="w-full max-w-sm"
      />
      {onToggle && (
        <IconButton
          icon={shown ? EyeOff : Eye}
          label={shown ? "Hide password" : "Show password"}
          variant="secondary"
          onClick={onToggle}
          aria-pressed={shown}
        />
      )}
    </div>
  );
}

function useSinglePdf() {
  const [doc, setDoc] = useState<{ file: File; pdf: PdfFile } | null>(null);
  const [status, setStatus] = useState<Status>(IDLE);
  const [working, setWorking] = useState(false);
  useEffect(() => warmUpWorker(), []);
  return { doc, setDoc, status, setStatus, working, setWorking };
}

export function ProtectPdf() {
  const { doc, setDoc, status, setStatus, working, setWorking } = useSinglePdf();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [shown, setShown] = useState(false);

  if (!doc)
    return (
      <PdfDropPanel
        status={status}
        onFile={async (file) => {
          setStatus(IDLE);
          setDoc({ file, pdf: await toPdfFile(file) });
        }}
        onReject={(text) => setStatus({ tone: "error", text })}
      />
    );

  const problem =
    password.length < MIN_PASSWORD_LENGTH
      ? `Use at least ${MIN_PASSWORD_LENGTH} characters; 12 or more is much harder to guess.`
      : confirm !== password
        ? "The two passwords do not match yet."
        : "";

  const protect = async (event: FormEvent) => {
    event.preventDefault();
    if (problem) return;
    setWorking(true);
    const r = await runTaskInWorker({ type: "pdf-protect", file: doc.pdf, password });
    setWorking(false);
    if (!r.ok) return setStatus({ tone: "error", text: r.message });
    downloadBlob(pdfBlob(r.value.data), r.value.name);
    setStatus({
      tone: "success",
      text: `Saved ${r.value.name} (${formatBytes(r.value.data.length)}). Keep the password safe: it cannot be recovered.`,
    });
  };

  return (
    <Panel
      status={
        working ? (
          <StatusMessage tone="working">Encrypting…</StatusMessage>
        ) : status !== IDLE ? (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">{problem || "Ready. The PDF will be encrypted with AES-256."}</StatusMessage>
        )
      }
    >
      <FileSummary
        file={doc.file}
        onRemove={() => {
          setDoc(null);
          setStatus(IDLE);
        }}
      />
      <form onSubmit={protect} className="space-y-4 border-t border-border p-4">
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          shown={shown}
          onToggle={() => setShown((s) => !s)}
          autoComplete="new-password"
          autoFocus
        />
        <PasswordField
          label="Repeat password"
          value={confirm}
          onChange={setConfirm}
          shown={shown}
          autoComplete="new-password"
          invalid={confirm.length > 0 && confirm !== password}
        />
        <p className="max-w-prose text-sm text-fg-muted">
          Anyone opening the PDF will need this password. It is not stored anywhere, so if it is lost the file cannot be
          opened again. Keep an unprotected copy if you might need one.
        </p>
        <Button type="submit" variant="primary" size="sm" disabled={working || !!problem}>
          {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
          Protect and download
        </Button>
      </form>
    </Panel>
  );
}

export function UnlockPdf() {
  const { doc, setDoc, status, setStatus, working, setWorking } = useSinglePdf();
  const [kind, setKind] = useState<"password" | "restricted" | null>(null);
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [opening, setOpening] = useState(false);

  if (!doc || !kind)
    return (
      <PdfDropPanel
        status={status}
        opening={opening}
        onFile={async (file) => {
          setOpening(true);
          setStatus(IDLE);
          const pdf = await toPdfFile(file);
          const r = await runTaskInWorker({ type: "pdf-encryption", file: pdf });
          setOpening(false);
          if (!r.ok) return setStatus({ tone: "error", text: r.message });
          if (r.value === "none")
            return setStatus({ tone: "warning", text: `“${file.name}” has no password or restrictions, so it is already unlocked.` });
          setPassword("");
          setKind(r.value);
          setDoc({ file, pdf });
        }}
        onReject={(text) => setStatus({ tone: "error", text })}
      />
    );

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    setWorking(true);
    const r = await runTaskInWorker({ type: "pdf-unlock", file: doc.pdf, password: kind === "restricted" ? "" : password });
    setWorking(false);
    if (!r.ok) return setStatus({ tone: "error", text: r.message });
    downloadBlob(pdfBlob(r.value.data), r.value.name);
    setStatus({ tone: "success", text: `Saved ${r.value.name} (${formatBytes(r.value.data.length)}) without a password.` });
  };

  return (
    <Panel
      status={
        working ? (
          <StatusMessage tone="working">Unlocking…</StatusMessage>
        ) : status !== IDLE ? (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            {kind === "restricted"
              ? "This PDF opens without a password but limits printing, copying or editing."
              : "This PDF needs a password to open."}
          </StatusMessage>
        )
      }
    >
      <FileSummary
        file={doc.file}
        detail={kind === "restricted" ? "Restricted" : "Password-protected"}
        onRemove={() => {
          setDoc(null);
          setKind(null);
          setStatus(IDLE);
        }}
      />
      <form onSubmit={unlock} className="space-y-4 border-t border-border p-4">
        {kind === "password" ? (
          <>
            <PasswordField
              label="PDF password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (status.tone === "error") setStatus(IDLE);
              }}
              shown={shown}
              onToggle={() => setShown((s) => !s)}
              autoComplete="current-password"
              invalid={status.tone === "error"}
              autoFocus
            />
            <p className="max-w-prose text-sm text-fg-muted">
              Type the password you use to open this file. The tool removes it so the PDF opens without one; it cannot
              find or guess a password you do not know.
            </p>
          </>
        ) : (
          <p className="max-w-prose text-sm text-fg-muted">
            No password is needed. Unlocking saves a copy without the print, copy and edit limits. Only do this for
            documents you have the right to change.
          </p>
        )}
        <Button type="submit" variant="primary" size="sm" disabled={working || (kind === "password" && !password)}>
          {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
          {kind === "password" ? "Unlock and download" : "Remove restrictions and download"}
        </Button>
      </form>
    </Panel>
  );
}
