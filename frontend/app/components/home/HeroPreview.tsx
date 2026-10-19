import { CircleCheck, Copy, Download, WrapText } from "lucide-react";

const K = ({ children }: { children: string }) => (
  <span className="text-code-key">{children}</span>
);
const S = ({ children }: { children: string }) => (
  <span className="text-code-string">{children}</span>
);
const N = ({ children }: { children: string }) => (
  <span className="text-code-number">{children}</span>
);
const P = ({ children }: { children: string }) => (
  <span className="text-code-punct">{children}</span>
);

const rawInput = `{"id":42,"name":"Ada","roles":["admin","dev"],"active":true}`;

/**
 * Static illustration of the tool workspace for the hero. Decorative: it is
 * hidden from assistive tech.
 */
export function HeroPreview() {
  return (
    <div aria-hidden className="relative">
      {/* Soft brand glow behind the window. */}
      <div className="absolute -inset-8 rounded-full bg-brand opacity-25 blur-3xl" />
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border-strong/40" />
            <span className="size-2.5 rounded-full bg-border-strong/40" />
            <span className="size-2.5 rounded-full bg-border-strong/40" />
          </span>
          <span className="text-xs font-medium text-fg-muted">JSON Formatter</span>
          <span className="ml-auto flex items-center gap-3 text-fg-subtle">
            <WrapText size={15} strokeWidth={1.75} />
            <Copy size={15} strokeWidth={1.75} />
            <Download size={15} strokeWidth={1.75} />
          </span>
        </div>

        <div className="border-b border-border px-4 py-3">
          <p className="text-[0.6875rem] font-medium tracking-wide text-fg-subtle uppercase">Input</p>
          <p className="mt-1.5 truncate font-mono text-[0.8125rem] text-fg-muted">{rawInput}</p>
        </div>

        <div className="px-4 py-3">
          <p className="text-[0.6875rem] font-medium tracking-wide text-fg-subtle uppercase">Output</p>
          <pre className="mt-1.5 font-mono text-[0.8125rem] leading-6">
            <code>
              <P>{"{"}</P>
              {"\n  "}<K>"id"</K><P>: </P><N>42</N><P>,</P>
              {"\n  "}<K>"name"</K><P>: </P><S>"Ada"</S><P>,</P>
              {"\n  "}<K>"roles"</K><P>: [</P><S>"admin"</S><P>, </P><S>"dev"</S><P>],</P>
              {"\n  "}<K>"active"</K><P>: </P><N>true</N>
              {"\n"}<P>{"}"}</P>
            </code>
          </pre>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
            <CircleCheck size={13} strokeWidth={2.25} />
            Valid JSON
          </span>
          <span className="font-mono text-[0.6875rem] text-fg-subtle">6 lines · 2 spaces</span>
        </div>
      </div>
    </div>
  );
}
