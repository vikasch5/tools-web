import { useEffect, useState } from "react";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { TextField } from "~/components/ui/Field";
import { generateLorem, type LoremOptions, type LoremUnit } from "~/tools/engine/lorem";
import { Segmented, Switch } from "../OptionControls";
import { Panel, PanelSection, StatusMessage, downloadBlob, useCopy } from "../Panel";

const limits: Record<LoremUnit, number> = { paragraphs: 500, sentences: 500, words: 5000 };

export function LoremIpsum() {
  const [options, setOptions] = useState<LoremOptions>({ unit: "paragraphs", count: 3, startWithLorem: true, html: false });
  const [countText, setCountText] = useState("3");
  // Generated after hydration, so server and client HTML match.
  const [text, setText] = useState("");
  const { copied, copy } = useCopy();

  const update = (next: Partial<LoremOptions>) => {
    const opts = { ...options, ...next };
    opts.count = Math.min(Math.max(opts.count || 1, 1), limits[opts.unit]);
    setOptions(opts);
    setText(generateLorem(opts));
  };

  useEffect(() => {
    setText(generateLorem(options));
  }, []);

  const words = text ? text.replace(/<\/?p>/g, " ").trim().split(/\s+/).length : 0;

  return (
    <Panel
      toolbar={
        <>
          <Button variant="primary" size="sm" icon={RefreshCw} onClick={() => update({})}>
            Generate
          </Button>
          <Segmented
            label="Unit"
            value={options.unit}
            onChange={(v) => update({ unit: v as LoremUnit })}
            choices={[
              { value: "paragraphs", label: "Paragraphs" },
              { value: "sentences", label: "Sentences" },
              { value: "words", label: "Words" },
            ]}
          />
          <Switch label="Start with “Lorem ipsum”" checked={options.startWithLorem} onChange={(v) => update({ startWithLorem: v })} />
          <Switch label="HTML <p> tags" checked={options.html} onChange={(v) => update({ html: v })} />
        </>
      }
      status={
        <StatusMessage tone={text ? "success" : "idle"}>
          {text ? `${words.toLocaleString("en")} words, ${text.length.toLocaleString("en")} characters.` : "Ready."}
          {copied && <span className="sr-only"> Copied to clipboard.</span>}
        </StatusMessage>
      }
    >
      <PanelSection
        title="Placeholder text"
        actions={
          <>
            <IconButton icon={copied ? Check : Copy} label={copied ? "Copied" : "Copy"} size="sm" disabled={!text} onClick={() => copy(text, "all")} />
            <IconButton
              icon={Download}
              label={options.html ? "Download as .html" : "Download as .txt"}
              size="sm"
              disabled={!text}
              onClick={() =>
                downloadBlob(
                  new Blob([`${text}\n`], { type: options.html ? "text/html" : "text/plain" }),
                  options.html ? "lorem-ipsum.html" : "lorem-ipsum.txt",
                )
              }
            />
          </>
        }
      >
        <div className="flex items-end gap-3 border-b border-border p-3 sm:px-4">
          <TextField
            label="How many"
            hint={`1–${limits[options.unit].toLocaleString("en")}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={limits[options.unit]}
            value={countText}
            onChange={(event) => {
              setCountText(event.target.value);
              if (Number(event.target.value) >= 1) update({ count: Number(event.target.value) });
            }}
            className="w-36"
          />
        </div>
        <div
          className="max-h-[min(60vh,32rem)] overflow-auto bg-surface p-4 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-fg sm:px-5"
          aria-live="polite"
        >
          {text}
        </div>
      </PanelSection>
    </Panel>
  );
}
