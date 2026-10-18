import { Link } from "react-router";
import type { Route } from "./+types/about";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { ButtonLink } from "~/components/ui/Button";
import { categories, categoryPath } from "~/data/categories";
import { liveTools } from "~/data/tools";
import { buildMeta } from "~/lib/seo";
import { site } from "~/config/site";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `About ${site.name} – Private, Browser-Based Online Tools`,
    description: `${site.name} is a set of free online tools that run entirely in your browser. No sign-up, no uploads, no clutter.`,
    path: "/about",
  });
}

export default function About() {
  return (
    <ContentPage
      title={`About ${site.name}`}
      path="/about"
      intro={<p>Small, focused tools for everyday jobs: formatting code, merging PDFs, shrinking images, counting words. Each one does its job well and stays out of your way.</p>}
    >
      <ContentSection id="why" title="Why we built it">
        <p>
          Most free tool sites make you upload your files to someone else’s server, wait in a queue, and dodge pop-ups along the way. We wanted the opposite: open a page, drop in your file or text, get the result.
        </p>
      </ContentSection>
      <ContentSection id="privacy" title="Your files stay on your device">
        <p>
          Every tool here runs in your browser. When you merge a PDF, compress a photo or decode a token, the work happens on your own computer or phone, in a background thread. Nothing you paste or open is sent to our servers or stored.
        </p>
        <p>
          That also means the tools keep working for confidential documents and that they are fast: there is no upload or download step.
        </p>
      </ContentSection>
      <ContentSection id="built-on" title="Built on trusted open-source engines">
        <p>
          We use well-tested libraries rather than reinventing them: Prettier for code formatting, Terser and csso for minifying, sql-formatter for SQL, and pdf-lib for PDFs. Image tools use your browser’s own image engine.
        </p>
      </ContentSection>
      <ContentSection id="tools" title={`${liveTools.length} tools and counting`}>
        <ul>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link to={categoryPath(c.slug)}>{c.name}</Link>: {c.description}
            </li>
          ))}
        </ul>
        <p>
          Missing something? <Link to="/contact">Tell us what you need</Link>.
        </p>
      </ContentSection>
      <ButtonLink to="/tools" variant="primary">
        Browse all tools
      </ButtonLink>
    </ContentPage>
  );
}
