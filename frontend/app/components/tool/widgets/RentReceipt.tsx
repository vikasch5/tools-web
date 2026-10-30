import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { SelectField, TextAreaField, TextField } from "~/components/ui/Field";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { monthLabel, monthsBetween, paidBy, needsPan, rupeesInWords, validateRentReceipt, type RentReceiptInput } from "~/tools/engine/rent-receipt";
import { inr } from "~/tools/engine/finance";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
import { pdfBlob } from "./pdf-shared";
import { num } from "./finance-shared";

/** The current financial year (April to March). */
function financialYear() {
  const d = new Date();
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return { from: `${start}-04`, to: `${start + 1}-03` };
}

export function RentReceipt() {
  const fy = financialYear();
  const [tenant, setTenant] = useState("");
  const [landlord, setLandlord] = useState("");
  const [pan, setPan] = useState("");
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("15,000");
  const [from, setFrom] = useState(fy.from);
  const [to, setTo] = useState(fy.to);
  const [mode, setMode] = useState<RentReceiptInput["mode"]>("UPI");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => warmUpWorker(), []);

  const input: RentReceiptInput = { tenant, landlord, landlordPan: pan, address, rent: num(rent), from, to, mode };
  const error = validateRentReceipt(input);
  const months = monthsBetween(from, to);
  const panWarning = !pan.trim() && needsPan(input);

  const save = async () => {
    setWorking(true);
    const r = await runTaskInWorker({ type: "rent-receipts", input });
    setWorking(false);
    if (!r.ok) return setDone(r.message);
    const name = `rent-receipts-${from}-to-${to}.pdf`;
    downloadBlob(pdfBlob(r.value), name);
    setDone(`Saved ${name}: ${months.length} receipts on ${Math.ceil(months.length / 2)} pages. Sign each one before handing it to your employer.`);
  };

  const first = months[0];

  return (
    <Panel
      action={
        <PrimaryAction icon={Download} busy={working} onClick={save} disabled={!!error} hint={error ?? undefined}>
          Download {months.length || ""} rent receipts (PDF)
        </PrimaryAction>
      }
      status={
        done ? (
          <StatusMessage tone="success">{done}</StatusMessage>
        ) : panWarning ? (
          <StatusMessage tone="warning">
            Rent is over ₹1 lakh a year ({inr(num(rent) * 12, true)}), so your employer will need the landlord's PAN to allow HRA.
          </StatusMessage>
        ) : (
          <StatusMessage tone="idle">Receipts are made on your device; nothing you enter is uploaded.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(17rem,1fr)_minmax(0,1.4fr)]">
        <PanelSection title="Details">
          <div className="space-y-4 p-4">
            <TextField label="Tenant's name" autoComplete="name" value={tenant} onChange={(e) => setTenant(e.target.value)} />
            <TextField label="Landlord's name" value={landlord} onChange={(e) => setLandlord(e.target.value)} />
            <TextField
              label="Landlord's PAN"
              hint={needsPan(input) ? "Needed above ₹1 lakh a year" : "Optional"}
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={10}
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
            />
            <TextAreaField label="Address of the rented home" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
            <TextField label="Monthly rent" suffix="₹" inputMode="decimal" value={rent} onChange={(e) => setRent(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="From month" type="month" value={from} onChange={(e) => setFrom(e.target.value)} />
              <TextField label="To month" type="month" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <SelectField label="Paid by" value={mode} onChange={(e) => setMode(e.target.value as RentReceiptInput["mode"])}>
              <option>UPI</option>
              <option>Bank transfer</option>
              <option>Cheque</option>
              <option>Cash</option>
            </SelectField>
          </div>
        </PanelSection>
        <PanelSection title="Preview">
          <div className="bg-bg bg-dots p-4 sm:p-6">
            <article aria-label="Preview of the first receipt" className="mx-auto max-w-lg rounded-md border border-border bg-white p-5 text-[0.8125rem] leading-relaxed text-neutral-900 shadow-md">
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-bold tracking-wide">RENT RECEIPT</h3>
                <span className="font-semibold">{first ? monthLabel(first) : "–"}</span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">Receipt no. 1 of {months.length || 0}</p>
              <p className="mt-4">
                Received a sum of <b>Rs. {num(rent).toLocaleString("en-IN")}</b> (Rupees {rupeesInWords(num(rent) || 0)} Only) from{" "}
                <b>{tenant || "[tenant]"}</b> towards the rent of the property at {address.replace(/\s*\n\s*/g, ", ") || "[address]"} for
                the month of {first ? monthLabel(first) : "[month]"}, paid by {paidBy(mode)}.
              </p>
              <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-1">
                <dt className="text-neutral-500">Landlord</dt>
                <dd className="font-semibold">{landlord || "[landlord]"}</dd>
                <dt className="text-neutral-500">Landlord's PAN</dt>
                <dd className="font-semibold">{pan || "Not provided"}</dd>
              </dl>
              <div className="mt-8 flex items-end justify-end gap-4">
                {mode === "Cash" && num(rent) > 5000 && (
                  <span className="flex h-14 w-12 items-center justify-center border border-dashed border-neutral-400 text-center text-[0.625rem] text-neutral-500">Revenue stamp</span>
                )}
                <span className="w-40 border-t border-neutral-800 pt-1 text-xs text-neutral-500">Landlord's signature</span>
              </div>
            </article>
            <p className="mx-auto mt-3 max-w-lg text-xs text-fg-muted">
              Two receipts per A4 page with a cut line. For cash rent over ₹5,000 a month, stick a revenue stamp and have the landlord
              sign across it.
            </p>
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
