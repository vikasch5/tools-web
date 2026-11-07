import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "~/lib/cn";
import { accentHex, accents, invoiceTemplates, type Accent, type AccentId, type Template } from "~/tools/engine/invoice";

/** A small drawing of each template, so the choice can be seen before it is made. */
function Thumbnail({ template, colour }: { template: Template; colour: string }) {
  const bar = "h-0.5 rounded-full bg-neutral-300";
  const brand = template === "classic" ? "#1c1c21" : colour;
  return (
    <span aria-hidden className="flex h-20 w-full flex-col gap-1 overflow-hidden rounded-sm bg-white p-1.5 ring-1 ring-border">
      {template === "bold" && (
        <span className="-mx-1.5 -mt-1.5 mb-0.5 flex h-5 items-center justify-end px-1.5" style={{ background: brand }}>
          <span className="h-1 w-6 rounded-full bg-white" />
        </span>
      )}
      {template === "elegant" && (
        <>
          <span className="mx-auto h-1.5 w-8 rounded-full" style={{ background: brand }} />
          <span className="h-px w-full" style={{ background: brand }} />
        </>
      )}
      {template === "clean" && (
        <>
          <span className="ml-auto h-1.5 w-8 rounded-full" style={{ background: brand }} />
          <span className="h-3 w-full rounded-sm" style={{ background: `${brand}1f` }} />
        </>
      )}
      {template === "classic" && (
        <>
          <span className="ml-auto h-1.5 w-8 rounded-full" style={{ background: brand }} />
          <span className="h-3 w-full rounded-none border border-neutral-700" />
        </>
      )}
      <span className={cn(bar, "w-1/2")} />
      <span className={bar} />
      <span className={bar} />
      <span
        className={cn("mt-auto ml-auto h-2 w-1/2", template === "classic" ? "border border-neutral-700" : "rounded-sm")}
        style={template === "classic" ? undefined : { background: template === "bold" ? brand : `${brand}33` }}
      />
    </span>
  );
}

export function StylePicker({ template, accent, onChange }: { template: Template; accent: Accent; onChange: (style: { template: Template; accent: Accent }) => void }) {
  const name = useId();
  const hex = accentHex(accent);
  const isPreset = accent in accents;
  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-1.5 text-[0.8125rem] font-medium text-fg-muted">Template</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {invoiceTemplates.map((t) => (
            <label
              key={t.id}
              title={t.hint}
              className="relative cursor-pointer rounded-md border border-border bg-surface p-1.5 text-center text-xs font-medium text-fg-muted hover:border-border-strong has-checked:border-fg has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-ring"
            >
              <input type="radio" name={`${name}-template`} value={t.id} checked={template === t.id} onChange={() => onChange({ template: t.id, accent })} className="sr-only" />
              <Thumbnail template={t.id} colour={hex} />
              <span className="mt-1 flex items-center justify-center gap-1">
                {template === t.id && <Check aria-hidden size={12} strokeWidth={2.5} />}
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={template === "classic"} className="disabled:opacity-50">
        <legend className="mb-1.5 text-[0.8125rem] font-medium text-fg-muted">Colour{template === "classic" ? " (Classic prints in black)" : ""}</legend>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(accents) as AccentId[]).map((id) => (
            <label key={id} title={accents[id].label} className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-full has-checked:ring-2 has-checked:ring-fg has-checked:ring-offset-2 has-checked:ring-offset-surface has-focus-visible:outline-2 has-focus-visible:outline-ring pointer-coarse:size-11">
              <input type="radio" name={`${name}-accent`} value={id} checked={accent === id} onChange={() => onChange({ template, accent: id })} className="sr-only" />
              <span className="sr-only">{accents[id].label}</span>
              <span aria-hidden className="size-6 rounded-full" style={{ background: accentHex(id) }} />
              {accent === id && <Check aria-hidden size={13} strokeWidth={3} className="absolute text-white" />}
            </label>
          ))}
          <label className={cn("inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border bg-surface px-2 text-sm font-medium has-focus-visible:outline-2 has-focus-visible:outline-ring pointer-coarse:h-11", isPreset ? "border-border text-fg-muted" : "border-fg text-fg")}>
            <input type="color" value={hex} onChange={(e) => onChange({ template, accent: e.target.value as Accent })} className="size-5 cursor-pointer rounded-sm border-0 bg-transparent p-0" />
            Custom
          </label>
        </div>
      </fieldset>
    </div>
  );
}
