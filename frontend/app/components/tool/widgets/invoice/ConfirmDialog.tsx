import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "~/components/ui/Button";

/** A modal question. The native dialog handles focus, Escape and the backdrop. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Keep",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-full max-w-md rounded-xl border border-border bg-surface p-5 text-fg shadow-lg backdrop:bg-fg/40"
    >
      <h2 id="confirm-title" className="text-base font-semibold">
        {title}
      </h2>
      <div className="mt-2 text-sm text-fg-muted">{children}</div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
