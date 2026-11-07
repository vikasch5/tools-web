import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { SelectField, TextAreaField, TextField } from "~/components/ui/Field";
import { Button } from "~/components/ui/Button";
import { checkGstin, gstinState, invoiceGstRates, newId, stateLabel, states, units, type Party, type Product } from "~/tools/engine/invoice";
import { parseNumber } from "~/tools/engine/percent";
import { Panel, PanelSection, StatusMessage } from "../../Panel";
import type { InvoiceStore } from "./useInvoiceData";

function Row({ title, detail, onEdit, onDelete }: { title: string; detail: string; onEdit: () => void; onDelete: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fg">{title}</p>
        <p className="truncate text-sm text-fg-muted">{detail || "–"}</p>
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" icon={Pencil} onClick={onEdit}>
          Edit
        </Button>
        {asking ? (
          <>
            <Button size="sm" variant="danger" icon={Trash2} onClick={onDelete}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setAsking(true)}>
            Delete
          </Button>
        )}
      </div>
    </li>
  );
}

const blankParty = (): Party => ({ id: newId(), name: "", address: "", state: "", gstin: "", phone: "", email: "", updatedAt: 0 });
const blankProduct = (): Product => ({ id: newId(), name: "", hsn: "", unit: "Nos", rate: 0, gstRate: 18, updatedAt: 0 });

function PartyForm({ initial, onSave, onClose }: { initial: Party; onSave: (p: Party) => void; onClose: () => void }) {
  const [p, setP] = useState(initial);
  const set = (patch: Partial<Party>) => setP((x) => ({ ...x, ...patch }));
  const gstinError = p.gstin.trim() ? checkGstin(p.gstin) : null;
  return (
    <form
      className="space-y-4 border-b border-border bg-surface-2/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (p.name.trim() && !gstinError) onSave({ ...p, name: p.name.trim(), gstin: p.gstin.trim().toUpperCase(), updatedAt: Date.now() });
      }}
    >
      <TextField label="Customer name" value={p.name} onChange={(e) => set({ name: e.target.value })} required />
      <TextAreaField label="Address" rows={2} value={p.address} onChange={(e) => set({ address: e.target.value })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="GSTIN"
          hint="If registered"
          maxLength={15}
          spellCheck={false}
          autoCapitalize="characters"
          aria-invalid={!!gstinError || undefined}
          value={p.gstin}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            const code = gstinState(v);
            set(code ? { gstin: v, state: code } : { gstin: v });
          }}
        />
        <SelectField label="State" value={p.state} onChange={(e) => set({ state: e.target.value })}>
          <option value="">Choose…</option>
          {states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} ({s.code})
            </option>
          ))}
        </SelectField>
        <TextField label="Phone" type="tel" value={p.phone} onChange={(e) => set({ phone: e.target.value })} />
        <TextField label="Email" type="email" value={p.email} onChange={(e) => set({ email: e.target.value })} />
      </div>
      {gstinError && <StatusMessage tone="error">{gstinError}</StatusMessage>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" icon={Save} disabled={!p.name.trim() || !!gstinError}>
          Save customer
        </Button>
        <Button variant="ghost" icon={X} onClick={onClose}>
          Close
        </Button>
      </div>
    </form>
  );
}

function ProductForm({ initial, onSave, onClose }: { initial: Product; onSave: (p: Product) => void; onClose: () => void }) {
  const [p, setP] = useState(initial);
  const [rate, setRate] = useState(String(initial.rate));
  const [gst, setGst] = useState(String(initial.gstRate));
  const set = (patch: Partial<Product>) => setP((x) => ({ ...x, ...patch }));
  const rateN = rate.trim() ? parseNumber(rate) : 0;
  const gstN = gst.trim() ? parseNumber(gst) : 0;
  const ok = p.name.trim() && rateN >= 0 && gstN >= 0 && gstN <= 100;
  return (
    <form
      className="space-y-4 border-b border-border bg-surface-2/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSave({ ...p, name: p.name.trim(), rate: rateN, gstRate: gstN, updatedAt: Date.now() });
      }}
    >
      <datalist id="invoice-units">
        {units.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <datalist id="invoice-rates">
        {invoiceGstRates.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      <TextField label="Item or service name" value={p.name} onChange={(e) => set({ name: e.target.value })} required />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TextField label="HSN/SAC" inputMode="numeric" maxLength={8} value={p.hsn} onChange={(e) => set({ hsn: e.target.value.replace(/\s/g, "") })} />
        <TextField label="Unit" list="invoice-units" value={p.unit} onChange={(e) => set({ unit: e.target.value })} />
        <TextField
          label="Rate"
          suffix="₹"
          inputMode="decimal"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          aria-invalid={!(rateN >= 0) || undefined}
        />
        <TextField
          label="GST"
          suffix="%"
          inputMode="decimal"
          list="invoice-rates"
          value={gst}
          onChange={(e) => setGst(e.target.value)}
          aria-invalid={!(gstN >= 0 && gstN <= 100) || undefined}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" icon={Save} disabled={!ok}>
          Save item
        </Button>
        <Button variant="ghost" icon={X} onClick={onClose}>
          Close
        </Button>
      </div>
    </form>
  );
}

/** Saved customers, or saved items and services, with add, edit and delete. */
export function Directory({ store, kind }: { store: InvoiceStore; kind: "parties" | "products" }) {
  const [editing, setEditing] = useState<Party | Product | null>(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const isParty = kind === "parties";
  const list = (isParty ? store.data.parties : store.data.products) as (Party | Product)[];
  const shown = list.filter((x) => !q || JSON.stringify(x).toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  const noun = isParty ? "customer" : "item";

  return (
    <Panel
      label={isParty ? "Saved customers" : "Saved items"}
      status={<StatusMessage tone="idle">Saved on this device. Pick them while making an invoice to fill in the details.</StatusMessage>}
    >
      <PanelSection
        title={`${isParty ? "Customers" : "Items and services"} (${list.length})`}
        actions={
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing(isParty ? blankParty() : blankProduct())}>
            Add {noun}
          </Button>
        }
      >
        {editing &&
          (isParty ? (
            <PartyForm
              key={editing.id}
              initial={editing as Party}
              onClose={() => setEditing(null)}
              onSave={(p) => {
                void store.saveParties([p]);
                setEditing(null);
              }}
            />
          ) : (
            <ProductForm
              key={editing.id}
              initial={editing as Product}
              onClose={() => setEditing(null)}
              onSave={(p) => {
                void store.saveProducts([p]);
                setEditing(null);
              }}
            />
          ))}
        {list.length > 5 && (
          <div className="border-b border-border p-4">
            <TextField label={`Search ${isParty ? "customers" : "items"}`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        )}
        {list.length === 0 ? (
          <p className="px-4 py-10 text-center text-fg-muted">No {noun}s yet. They are added automatically when you save an invoice, or add one now.</p>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((x) => (
              <Row
                key={x.id}
                title={x.name}
                detail={
                  isParty
                    ? [(x as Party).gstin, stateLabel((x as Party).state), (x as Party).phone].filter(Boolean).join(" · ")
                    : [
                        `₹${(x as Product).rate.toLocaleString("en-IN")} / ${(x as Product).unit}`,
                        `GST ${(x as Product).gstRate}%`,
                        (x as Product).hsn && `HSN ${(x as Product).hsn}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                }
                onEdit={() => setEditing(x)}
                onDelete={() => void (isParty ? store.deleteParty(x.id) : store.deleteProduct(x.id))}
              />
            ))}
          </ul>
        )}
      </PanelSection>
    </Panel>
  );
}
