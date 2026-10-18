import type { ReactNode } from "react";
import { Container } from "./Container";
import { Breadcrumbs } from "./Breadcrumbs";

/** Header + body frame for text pages (About, Help, legal). */
export function ContentPage({
  title,
  path,
  intro,
  notice,
  children,
}: {
  title: string;
  path: string;
  intro: ReactNode;
  /** Short callout under the intro, e.g. "Draft". */
  notice?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article>
      <header className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]" />
        <Container className="relative pt-6 pb-10 sm:pt-8 sm:pb-14">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: title, path }]} />
          <h1 className="mt-6 text-h1 font-bold text-fg">{title}</h1>
          <div className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">{intro}</div>
          {notice && (
            <div className="mt-6 max-w-2xl rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-fg">
              {notice}
            </div>
          )}
        </Container>
      </header>
      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl space-y-12">{children}</div>
      </Container>
    </article>
  );
}

/** A titled block of body text inside a ContentPage. */
export function ContentSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2 id={id} className="text-2xl font-semibold tracking-tight text-fg">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-fg-muted [&_a]:font-medium [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:decoration-accent [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
