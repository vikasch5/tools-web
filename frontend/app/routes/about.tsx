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
    description: `Who builds ${site.name}, how the tools are tested and kept accurate, and why everything runs in your browser with no sign-up and no uploads.`,
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
      <ContentSection id="who" title="Who runs AllToolsDesk">
        <p>
          {site.name} is built and maintained by {site.owner}, based in {site.country}. It focuses on everyday jobs that free tool
          sites often handle badly: fixing a JSON file, getting a photo under an exam form’s 50 KB limit, comparing tax regimes,
          checking an EMI before signing a loan. Each tool is written, tested and kept up to date by hand.
        </p>
        <p>
          Write to <a href={`mailto:${site.email}`}>{site.email}</a> with bugs, corrections or ideas for new tools.
        </p>
      </ContentSection>
      <ContentSection id="accuracy" title="How we keep the tools accurate">
        <ul>
          <li>
            <strong>Calculators follow published rules.</strong> Tax slabs, GST rates, PPF and gratuity limits and HRA cities live in
            dated configuration files, checked against official sources and reviewed every year after the Union Budget.
          </li>
          <li>
            <strong>Results are tested.</strong> Each calculator and file engine has automated tests, and calculator results are
            checked by hand against bank or government calculators before release. The examples on each page come from the
            real tool output.
          </li>
          <li>
            <strong>Form specifications are sourced.</strong> Photo and signature sizes for exam forms are taken from recruitment
            notifications. They change from year to year, so each page asks you to confirm against your own notice.
          </li>
          <li>
            <strong>Corrections are welcome.</strong> If a rule has changed or a result looks wrong, <Link to="/contact">tell us</Link>{" "}
            and we will correct it.
          </li>
        </ul>
        <p>
          Our <Link to="/guides">guides</Link> explain the rules behind the tools in more depth, with worked examples.
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
