import { useState, type ReactNode } from "react";
import { ImageUp, Save, Trash2 } from "lucide-react";
import { SelectField, TextAreaField, TextField } from "~/components/ui/Field";
import { Button } from "~/components/ui/Button";
import { checkGstin, gstinState, kindLabel, normalTemplate, states, type Business, type DocKind } from "~/tools/engine/invoice";
import { Switch } from "../../OptionControls";
import { StatusMessage } from "../../Panel";
import { imageToDataUrl } from "./images";
import { StylePicker } from "./StylePicker";

export function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-border p-4 first:border-t-0 sm:p-5">
      <legend className="float-left mb-4 w-full label-mono text-fg">{legend}</legend>
      {/* clear-both: without it the first field sits beside the floated legend and is pushed out of view. */}
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}

function ImagePicker({ label, value, onChange, hint }: { label: string; value?: string; onChange: (v?: string) => void; hint: string }) {
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-[0.8125rem] font-medium text-fg-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img src={value} alt={`${label} preview`} className="h-14 max-w-40 rounded-md border border-border bg-white object-contain p-1" />
        ) : (
          <span className="flex h-14 w-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-fg-subtle">None</span>
        )}
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-fg shadow-sm hover:border-border-strong has-focus-visible:outline-2 has-focus-visible:outline-ring pointer-coarse:h-11">
          <ImageUp aria-hidden size={16} strokeWidth={1.75} />
          {value ? "Change" : "Upload"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                setError("");
                onChange(await imageToDataUrl(file));
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          />
        </label>
        {value && (
          <Button variant="ghost" icon={Trash2} onClick={() => onChange(undefined)}>
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-fg-subtle">{hint}</p>
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
    </div>
  );
}

export function BusinessForm({ initial, onSave }: { initial: Business; onSave: (b: Business) => void }) {
  const [b, setB] = useState(initial);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Business>(key: K, value: Business[K]) => {
    setSaved(false);
    setB((x) => ({ ...x, [key]: value }));
  };
  const gstinError = b.gstRegistered && b.gstin.trim() ? checkGstin(b.gstin) : null;
  const missing = !b.name.trim()
    ? "Enter your business name."
    : b.gstRegistered && !b.gstin.trim()
      ? "Enter your GSTIN, or turn off “Registered for GST”."
      : gstinError
        ? `GSTIN: ${gstinError}`
        : b.gstRegistered && !b.state
          ? "Choose your state."
          : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (missing) return;
        onSave({ ...b, gstin: b.gstin.trim().toUpperCase(), pan: b.pan.trim().toUpperCase(), ifsc: b.ifsc.trim().toUpperCase() });
        setSaved(true);
      }}
    >
      <Fieldset legend="Your business">
        <TextField label="Business name" autoComplete="organization" value={b.name} onChange={(e) => set("name", e.target.value)} required />
        <TextAreaField label="Address" rows={3} value={b.address} onChange={(e) => set("address", e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone" type="tel" autoComplete="tel" value={b.phone} onChange={(e) => set("phone", e.target.value)} />
          <TextField label="Email" type="email" autoComplete="email" value={b.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </Fieldset>

      <Fieldset legend="GST">
        <Switch label="Registered for GST" checked={b.gstRegistered} onChange={(v) => set("gstRegistered", v)} />
        {!b.gstRegistered && <p className="text-sm text-fg-muted">Your documents will be titled “Invoice” and will not charge GST.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {b.gstRegistered && (
            <TextField
              label="GSTIN"
              hint="15 characters"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={15}
              value={b.gstin}
              aria-invalid={!!gstinError || undefined}
              onChange={(e) => {
                const v = e.target.value.toUpperCase();
                set("gstin", v);
                const code = gstinState(v);
                if (code) {
                  set("state", code);
                  if (!b.pan) set("pan", v.slice(2, 12));
                }
              }}
            />
          )}
          <SelectField
            label="State"
            hint={b.gstRegistered ? "Filled from the GSTIN" : undefined}
            value={b.state}
            onChange={(e) => set("state", e.target.value)}
          >
            <option value="">Choose…</option>
            {states.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </SelectField>
          <TextField
            label="PAN"
            hint="Optional"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={10}
            value={b.pan}
            onChange={(e) => set("pan", e.target.value.toUpperCase())}
          />
        </div>
        {gstinError && <StatusMessage tone="error">{gstinError}</StatusMessage>}
      </Fieldset>

      <Fieldset legend="Payment details (printed on invoices)">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Bank name" value={b.bankName} onChange={(e) => set("bankName", e.target.value)} />
          <TextField label="Account holder name" value={b.accountName} onChange={(e) => set("accountName", e.target.value)} />
          <TextField label="Account number" inputMode="numeric" value={b.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} />
          <TextField
            label="IFSC"
            autoCapitalize="characters"
            maxLength={11}
            spellCheck={false}
            value={b.ifsc}
            onChange={(e) => set("ifsc", e.target.value.toUpperCase())}
          />
          <TextField
            label="UPI ID"
            hint="Adds a pay-by-UPI QR code"
            placeholder="yourshop@okaxis"
            spellCheck={false}
            value={b.upiId}
            onChange={(e) => set("upiId", e.target.value.trim())}
          />
        </div>
      </Fieldset>

      <Fieldset legend="Look">
        <ImagePicker label="Logo" value={b.logo} onChange={(v) => set("logo", v)} hint="PNG or JPG. Shown at the top left of every document." />
        <ImagePicker
          label="Signature or stamp"
          value={b.signature}
          onChange={(v) => set("signature", v)}
          hint="Optional. A photo of your signature on white paper works; it is printed above “Authorised signatory”."
        />
        <StylePicker
          template={normalTemplate(b.template)}
          accent={b.accent}
          onChange={(style) => {
            setSaved(false);
            setB((x) => ({ ...x, ...style }));
          }}
        />
        <p className="text-xs text-fg-subtle">This is your default. You can pick a different look for any one document in the editor.</p>
      </Fieldset>

      <Fieldset legend="Numbering and terms">
        <p className="text-sm text-fg-muted">
          Numbers follow PREFIX/YY-YY/001 and restart each financial year, e.g. {b.prefixes.invoice || "INV"}/26-27/001. You can still edit any number.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(kindLabel) as DocKind[]).map((k) => (
            <TextField
              key={k}
              label={`${kindLabel[k]} prefix`}
              maxLength={6}
              autoCapitalize="characters"
              spellCheck={false}
              value={b.prefixes[k]}
              onChange={(e) => set("prefixes", { ...b.prefixes, [k]: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })}
            />
          ))}
        </div>
        <TextAreaField label="Default terms and conditions" rows={3} value={b.terms} onChange={(e) => set("terms", e.target.value)} />
      </Fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface-2/50 p-4 sm:p-5">
        <Button type="submit" variant="primary" icon={Save} disabled={!!missing}>
          Save business profile
        </Button>
        {missing ? (
          <StatusMessage tone="idle">{missing}</StatusMessage>
        ) : saved ? (
          <StatusMessage tone="success">Saved on this device. New documents will use these details.</StatusMessage>
        ) : null}
      </div>
    </form>
  );
}
