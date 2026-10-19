import { Link } from "react-router";
import { Plus } from "lucide-react";
import type { Route } from "./+types/help";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { buildMeta } from "~/lib/seo";
import { site } from "~/config/site";

const faqs = [
  {
    q: "Are my files uploaded?",
    a: "No. Every tool runs in your browser, so files and text never leave your device. You can even disconnect from the internet after a tool page has loaded and it keeps working.",
  },
  {
    q: "Is it free? Do I need an account?",
    a: "Yes, it is free, and there is no account or sign-up.",
  },
  {
    q: "What are the file size limits?",
    a: "Text tools accept files up to 5 MB, images up to 25 MB each and PDFs up to 100 MB. Because the work happens on your device, very large files can be slow on older phones.",
  },
  {
    q: "A tool shows an error. What should I do?",
    a: "Read the message in the status bar under the tool: it says what went wrong and, for code, the line and column. For PDFs, password-protected files are the most common cause. If it still fails, contact us with the steps to reproduce it (please do not send confidential files).",
  },
  {
    q: "Which browsers are supported?",
    a: "Current versions of Chrome, Edge, Firefox and Safari on desktop and mobile. Safari cannot save WebP images; the image tools tell you when they fall back to another format.",
  },
  {
    q: "Does the site remember anything?",
    a: "Only your tool preferences, such as indent size and editor height, stored in your browser. Your input text and files are never stored.",
  },
];

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Help Center – ${site.name}`,
    description: "Answers about privacy, file limits and supported browsers for every tool.",
    path: "/help",
  });
}

export default function Help() {
  return (
    <ContentPage
      title="Help center"
      path="/help"
      intro={
        <p>
          Quick answers that apply to every tool. Each tool page also has its own how-to, examples and FAQ below the tool.
        </p>
      }
    >
      <ContentSection id="faq" title="Common questions">
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-fg [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus aria-hidden size={18} strokeWidth={1.5} className="shrink-0 text-fg-subtle transition-transform group-open:rotate-45" />
              </summary>
              <p className="pb-5">{item.a}</p>
            </details>
          ))}
        </div>
      </ContentSection>
      <ContentSection id="more" title="Still stuck?">
        <p>
          <Link to="/contact">Contact us</Link> and describe what you tried. Browse <Link to="/tools">all tools</Link> if you are looking for something specific.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
