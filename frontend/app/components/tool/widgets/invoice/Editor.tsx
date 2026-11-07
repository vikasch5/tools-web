import { useEffect, useId, useState } from "react";
import { useBlocker } from "react-router";
import { Download, FilePlus2, Plus, Save, Share2, Trash2 } from "lucide-react";
import { SelectField, TextAreaField, TextField } from "~/components/ui/Field";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { parseNumber } from "~/tools/engine/percent";
import {
  addDays,
  checkGstin,
  emptyBuyer,
  emptyItem,
  gstinState,
  invoiceGstRates,
  invoiceTotals,
  invoiceWarnings,
  kindLabel,
  newId,
  nextNumber,
  normalTemplate,
  sellerSnapshot,
  stateLabel,
  states,
  units,
  validateInvoice,
  type Business,
  type DocKind,
  type InvoiceDoc,
  type LineItem,
  type Party,
  type Product,
} from "~/tools/engine/invoice";
import { Segmented, Switch } from "../../OptionControls";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob, type StatusTone } from "../../Panel";
import { Fieldset } from "./BusinessForm";
import { ConfirmDialog } from "./ConfirmDialog";
import { InvoicePreview, makePdf } from "./Preview";
import { StylePicker } from "./StylePicker";
import type { InvoiceStore } from "./useInvoiceData";

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const dueDays: Record<DocKind, number> = { invoice: 15, quotation: 30, proforma: 7 };

export function newDraft(kind: DocKind, business: Business, documents: InvoiceDoc[]): InvoiceDoc {
  const today = todayIso();
  const now = Date.now();
  return {
    id: newId(),
    kind,
    number: nextNumber(
      business.prefixes[kind],
      today,
      documents.filter((d) => d.kind === kind).map((d) => d.number),
    ),
    date: today,
    dueDate: addDays(today, dueDays[kind]),
    seller: sellerSnapshot(business),
    buyer: emptyBuyer(),
    placeOfSupply: business.state,
    items: [emptyItem()],
    roundOff: true,
    notes: "",
    terms: business.terms,
    amountPaid: 0,
    cancelled: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const pdfName = (doc: InvoiceDoc) => `${doc.number.replace(/[/\\]/g, "-") || kindLabel[doc.kind]}.pdf`;

export { makePdf };

/** A number input that keeps what is typed ("1.", "") while the model holds a number. */
function NumField({
  value,
  onValue,
  label,
  ...rest
}: { value: number; onValue: (n: number) => void; label: string } & Omit<Parameters<typeof TextField>[0], "value" | "onChange" | "label">) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    const parsed = text.trim() ? parseNumber(text) : 0;
    if (parsed !== value && !(Number.isNaN(parsed) && Number.isNaN(value))) setText(String(value));
  }, [value]);
  return (
    <TextField
      label={label}
      inputMode="decimal"
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value);
        onValue(e.target.value.trim() ? parseNumber(e.target.value) : 0);
      }}
      {...rest}
    />
  );
}

function ItemRow({
  item,
  index,
  gst,
  total,
  products,
  listId,
  onChange,
  onRemove,
}: {
  item: LineItem;
  index: number;
  gst: boolean;
  total: number;
  products: Product[];
  listId: string;
  onChange: (item: LineItem) => void;
  onRemove?: () => void;
}) {
  const set = <K extends keyof LineItem>(key: K, value: LineItem[K]) => onChange({ ...item, [key]: value });
  return (
    <li className="rounded-lg border border-border bg-bg p-3">
      <div className="flex items-end gap-2">
        <TextField
          className="flex-1"
          label={`Item ${index + 1}`}
          placeholder="What you are selling"
          list={`${listId}-products`}
          value={item.name}
          onChange={(e) => {
            const name = e.target.value;
            const p = products.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
            onChange(p ? { ...item, name: p.name, hsn: p.hsn, unit: p.unit, rate: p.rate, gstRate: p.gstRate } : { ...item, name });
          }}
        />
        {onRemove && <IconButton icon={Trash2} label={`Remove item ${index + 1}`} variant="secondary" onClick={onRemove} />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <TextField
          label="HSN/SAC"
          inputMode="numeric"
          spellCheck={false}
          maxLength={8}
          value={item.hsn}
          onChange={(e) => set("hsn", e.target.value.replace(/\s/g, ""))}
        />
        <NumField label="Qty" value={item.qty} onValue={(n) => set("qty", n)} />
        <TextField label="Unit" list={`${listId}-units`} value={item.unit} onChange={(e) => set("unit", e.target.value)} />
        <NumField label="Rate" suffix="₹" value={item.rate} onValue={(n) => set("rate", n)} />
        <NumField label="Discount" suffix="%" value={item.discount} onValue={(n) => set("discount", n)} />
        {gst && <NumField label="GST" suffix="%" list={`${listId}-rates`} value={item.gstRate} onValue={(n) => set("gstRate", n)} />}
      </div>
      <p className="mt-2 text-right text-sm text-fg-muted">
        {gst ? "Taxable value" : "Amount"}:{" "}
        <span className="font-semibold text-fg tabular-nums">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </p>
    </li>
  );
}

export function Editor({
  store,
  business,
  initial,
  isNew,
  onSaved,
  onNew,
}: {
  store: InvoiceStore;
  business: Business;
  initial: InvoiceDoc;
  isNew: boolean;
  onSaved: (doc: InvoiceDoc) => void;
  onNew: (kind: DocKind) => void;
}) {
  const { documents, parties, products } = store.data;
  const listId = useId();
  const [doc, setDoc] = useState(initial);
  const [numberEdited, setNumberEdited] = useState(!isNew);
  const [rememberCustomer, setRememberCustomer] = useState(true);
  const [rememberItems, setRememberItems] = useState(true);
  const [busy, setBusy] = useState<"" | "pdf" | "share">("");
  const [status, setStatus] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [view, setView] = useState("edit");
  const [shipping, setShipping] = useState(!!initial.shipTo?.trim());
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));

  // Unsaved work: ask before any move away, from the side menu, Back or a link.
  const dirty = JSON.stringify(doc) !== baseline;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.search !== nextLocation.search && new URLSearchParams(nextLocation.search).get("edit") !== doc.id,
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // New documents always print the current business profile.
  const current: InvoiceDoc = isNew ? { ...doc, seller: sellerSnapshot(business) } : doc;
  const totals = invoiceTotals(current);
  const gst = totals.supply !== "none";
  const problems = validateInvoice(current);
  const warnings = invoiceWarnings(current);
  const template = normalTemplate(doc.template ?? business.template);
  const accent = doc.accent ?? business.accent;
  const styleIsCustom = template !== normalTemplate(business.template) || accent !== business.accent;

  const update = (patch: Partial<InvoiceDoc>) => {
    setStatus(null);
    setDoc((d) => {
      const next = { ...d, ...patch };
      if (!numberEdited && (patch.kind || patch.date)) {
        const others = documents.filter((x) => x.kind === next.kind && x.id !== next.id).map((x) => x.number);
        next.number = nextNumber(business.prefixes[next.kind], next.date, others);
      }
      if (patch.kind && isNew) next.dueDate = addDays(next.date, dueDays[next.kind]);
      return next;
    });
  };
  const setBuyer = (patch: Partial<InvoiceDoc["buyer"]>) => {
    setStatus(null);
    setDoc((d) => {
      const buyer = { ...d.buyer, ...patch };
      return { ...d, buyer, placeOfSupply: patch.state !== undefined ? patch.state || business.state : d.placeOfSupply };
    });
  };
  const setItem = (i: number, item: LineItem) => update({ items: doc.items.map((x, k) => (k === i ? item : x)) });

  const duplicateNumber = documents.some((d) => d.id !== doc.id && d.kind === doc.kind && d.number.trim().toLowerCase() === doc.number.trim().toLowerCase());
  const buyerGstinError = doc.buyer.gstin.trim() ? checkGstin(doc.buyer.gstin) : null;

  /** Saves the document (and new customers and items); returns it, or null if something is missing. */
  const commit = async () => {
    if (problems.length) {
      setStatus({ tone: "error", text: problems[0].message });
      return null;
    }
    if (duplicateNumber) {
      setStatus({ tone: "error", text: `${doc.number} is already used. Each ${kindLabel[doc.kind].toLowerCase()} needs its own number.` });
      return null;
    }
    const now = Date.now();
    const saved: InvoiceDoc = {
      ...current,
      number: current.number.trim(),
      buyer: { ...current.buyer, gstin: current.buyer.gstin.trim().toUpperCase() },
      updatedAt: now,
    };
    await store.saveDocs([saved]);
    if (rememberCustomer && saved.buyer.name.trim()) {
      const match = parties.find((p) => p.name.trim().toLowerCase() === saved.buyer.name.trim().toLowerCase());
      const party: Party = { id: match?.id ?? newId(), ...saved.buyer, updatedAt: now };
      await store.saveParties([party]);
    }
    if (rememberItems) {
      const known = new Set(products.map((p) => p.name.trim().toLowerCase()));
      const fresh = saved.items
        .filter((i) => i.name.trim() && !known.has(i.name.trim().toLowerCase()))
        .map((i): Product => ({ id: newId(), name: i.name.trim(), hsn: i.hsn, unit: i.unit, rate: i.rate, gstRate: i.gstRate, updatedAt: now }));
      if (fresh.length) await store.saveProducts(fresh);
    }
    setDoc(saved);
    setBaseline(JSON.stringify(saved));
    setNumberEdited(true);
    onSaved(saved);
    return saved;
  };

  const save = async () => {
    const saved = await commit();
    if (saved) setStatus({ tone: "success", text: `Saved ${saved.number}. Find it any time in your list.` });
  };

  const download = async () => {
    const saved = await commit();
    if (!saved) return;
    setBusy("pdf");
    try {
      downloadBlob(await makePdf(saved, business), pdfName(saved));
      setStatus({ tone: "success", text: `Saved ${saved.number} and downloaded ${pdfName(saved)}.` });
    } catch (e) {
      setStatus({ tone: "error", text: (e as Error).message });
    }
    setBusy("");
  };

  const share = async () => {
    const saved = await commit();
    if (!saved) return;
    setBusy("share");
    const t = invoiceTotals(saved);
    const message = `${kindLabel[saved.kind]} ${saved.number} from ${saved.seller.name}: ₹${t.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}${saved.dueDate && saved.kind === "invoice" ? `, due ${saved.dueDate}` : ""}.`;
    try {
      const file = new File([await makePdf(saved, business)], pdfName(saved), { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${kindLabel[saved.kind]} ${saved.number}`, text: message });
        setStatus({ tone: "success", text: `Saved ${saved.number} and opened sharing.` });
      } else {
        downloadBlob(file, pdfName(saved));
        window.open(`https://wa.me/?text=${encodeURIComponent(`${message} PDF attached.`)}`, "_blank", "noopener");
        setStatus({
          tone: "success",
          text: `This browser cannot share files directly, so the PDF was downloaded. Attach it in the WhatsApp chat that opened.`,
        });
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setStatus({ tone: "error", text: (e as Error).message });
    }
    setBusy("");
  };

  return (
    <Panel
      label="Invoice editor"
      action={
        <>
          <PrimaryAction icon={Download} busy={busy === "pdf"} onClick={download}>
            Save and download PDF
          </PrimaryAction>
          <Button icon={Save} onClick={save}>
            Save
          </Button>
          <Button icon={Share2} onClick={share} disabled={busy === "share"} aria-busy={busy === "share" || undefined}>
            Share
          </Button>
          <Button variant="ghost" icon={FilePlus2} onClick={() => onNew(doc.kind)}>
            New
          </Button>
        </>
      }
      status={
        status ? (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        ) : problems.length ? (
          <StatusMessage tone="idle">To finish: {problems[0].message}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">Saved on this device only; nothing you enter is uploaded.</StatusMessage>
        )
      }
    >
      <datalist id={`${listId}-products`}>
        {products.map((p) => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>
      <datalist id={`${listId}-units`}>
        {units.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <datalist id={`${listId}-rates`}>
        {invoiceGstRates.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        danger
        title="Leave without saving?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Your changes to this {kindLabel[doc.kind].toLowerCase()} have not been saved.
      </ConfirmDialog>
      <div className="border-b border-border bg-surface-2/50 px-3 py-2 lg:hidden">
        <Segmented
          label="Show"
          value={view}
          onChange={setView}
          choices={[
            { value: "edit", label: "Edit" },
            { value: "preview", label: "Preview" },
          ]}
        />
      </div>
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className={view === "edit" ? "flex min-w-0" : "hidden min-w-0 lg:flex"}>
          <PanelSection className="w-full" title="Details">
            <Fieldset legend="Document">
              <Segmented
                label="Type"
                value={doc.kind}
                onChange={(v) => update({ kind: v as DocKind })}
                choices={(Object.keys(kindLabel) as DocKind[]).map((k) => ({ value: k, label: k === "proforma" ? "Proforma" : kindLabel[k] }))}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  label="Number"
                  spellCheck={false}
                  maxLength={16}
                  value={doc.number}
                  aria-invalid={duplicateNumber || undefined}
                  hint={duplicateNumber ? "Already used" : undefined}
                  onChange={(e) => {
                    setNumberEdited(true);
                    update({ number: e.target.value.replace(/\s/g, "") });
                  }}
                />
                <TextField label="Date" type="date" value={doc.date} onChange={(e) => update({ date: e.target.value })} />
                <TextField
                  label={doc.kind === "invoice" ? "Due date" : "Valid until"}
                  type="date"
                  value={doc.dueDate}
                  onChange={(e) => update({ dueDate: e.target.value })}
                />
              </div>
              <TextField label="PO number" hint="Optional, if your customer gave one" spellCheck={false} value={doc.poNumber ?? ""} onChange={(e) => update({ poNumber: e.target.value })} />
            </Fieldset>

            <Fieldset legend="Customer">
              {parties.length > 0 && (
                <SelectField
                  label="Saved customer"
                  value=""
                  onChange={(e) => {
                    const p = parties.find((x) => x.id === e.target.value);
                    if (p) setBuyer({ name: p.name, address: p.address, state: p.state, gstin: p.gstin, phone: p.phone, email: p.email });
                  }}
                >
                  <option value="">Choose to fill in…</option>
                  {[...parties]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.gstin ? ` · ${p.gstin}` : ""}
                      </option>
                    ))}
                </SelectField>
              )}
              <TextField label="Customer name" value={doc.buyer.name} onChange={(e) => setBuyer({ name: e.target.value })} />
              <TextAreaField label="Address" rows={2} value={doc.buyer.address} onChange={(e) => setBuyer({ address: e.target.value })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Customer GSTIN"
                  hint="If registered"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={15}
                  aria-invalid={!!buyerGstinError || undefined}
                  value={doc.buyer.gstin}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    const code = gstinState(v);
                    setBuyer(code ? { gstin: v, state: code } : { gstin: v });
                  }}
                />
                <SelectField label="Customer's state" value={doc.buyer.state} onChange={(e) => setBuyer({ state: e.target.value })}>
                  <option value="">Choose…</option>
                  {states.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </SelectField>
                <TextField label="Phone" type="tel" value={doc.buyer.phone} onChange={(e) => setBuyer({ phone: e.target.value })} />
                <TextField label="Email" type="email" value={doc.buyer.email} onChange={(e) => setBuyer({ email: e.target.value })} />
              </div>
              {buyerGstinError && <StatusMessage tone="error">{buyerGstinError}</StatusMessage>}
              {gst && (
                <div className="space-y-1.5">
                  <SelectField
                    label="Place of supply"
                    hint="Usually where the goods are delivered"
                    value={doc.placeOfSupply}
                    onChange={(e) => update({ placeOfSupply: e.target.value })}
                  >
                    <option value="">Choose…</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </SelectField>
                  <p className="text-sm text-fg-muted">
                    {totals.supply === "inter"
                      ? `${stateLabel(doc.placeOfSupply)} is outside your state, so IGST is charged.`
                      : `Same state as your business, so GST is split into CGST + ${totals.stateTaxName}.`}
                  </p>
                </div>
              )}
              <Switch
                label="Ship to a different address"
                checked={shipping}
                onChange={(on) => {
                  setShipping(on);
                  if (!on) update({ shipTo: "" });
                }}
              />
              {shipping && (
                <TextAreaField
                  label="Ship to"
                  hint="Name on the first line, then the address"
                  rows={3}
                  value={doc.shipTo ?? ""}
                  onChange={(e) => update({ shipTo: e.target.value })}
                />
              )}
              <Switch label="Save to my customers" checked={rememberCustomer} onChange={setRememberCustomer} />
            </Fieldset>

            <Fieldset legend="Items">
              <ul className="space-y-3">
                {doc.items.map((item, i) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    index={i}
                    gst={gst}
                    total={totals.lines[i]?.taxable ?? 0}
                    products={products}
                    listId={listId}
                    onChange={(it) => setItem(i, it)}
                    onRemove={doc.items.length > 1 ? () => update({ items: doc.items.filter((_, k) => k !== i) }) : undefined}
                  />
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  icon={Plus}
                  onClick={() => {
                    const last = doc.items.at(-1);
                    update({ items: [...doc.items, { ...emptyItem(), gstRate: last?.gstRate ?? 18 }] });
                  }}
                >
                  Add item
                </Button>
                <Switch label="Save new items to my list" checked={rememberItems} onChange={setRememberItems} />
              </div>
              {warnings.length > 0 && (
                <ul className="space-y-1 rounded-lg border border-border bg-warning-soft/40 p-3 text-sm">
                  {warnings.map((w) => (
                    <li key={w}>
                      <StatusMessage tone="warning">{w}</StatusMessage>
                    </li>
                  ))}
                </ul>
              )}
            </Fieldset>

            <Fieldset legend="Totals and notes">
              <Switch label="Round off to the nearest rupee" checked={doc.roundOff} onChange={(v) => update({ roundOff: v })} />
              {doc.kind === "invoice" && (
                <NumField
                  label="Amount received so far"
                  hint="For part payments and advances"
                  suffix="₹"
                  value={doc.amountPaid}
                  onValue={(n) => update({ amountPaid: n })}
                />
              )}
              <TextAreaField label="Notes" hint="Printed on the document" rows={2} value={doc.notes} onChange={(e) => update({ notes: e.target.value })} />
              <TextAreaField label="Terms and conditions" rows={3} value={doc.terms} onChange={(e) => update({ terms: e.target.value })} />
            </Fieldset>
          </PanelSection>
        </div>

        <div className={view === "preview" ? "flex min-w-0" : "hidden min-w-0 lg:flex"}>
          <PanelSection className="w-full" title="Preview">
            <div className="flex-1 bg-bg bg-dots p-3 sm:p-5">
              <div className="mx-auto max-w-2xl space-y-4 lg:sticky lg:top-18 lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <StylePicker template={template} accent={accent} onChange={(style) => update(style)} />
                  {styleIsCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        void store.saveBusiness({ ...business, template, accent });
                        setStatus({ tone: "success", text: "New documents will use this template and colour." });
                      }}
                      className="mt-2 text-sm font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      Use this look for all new documents
                    </button>
                  )}
                </div>
                <InvoicePreview doc={current} business={business} />
              </div>
            </div>
          </PanelSection>
        </div>
      </div>
    </Panel>
  );
}
