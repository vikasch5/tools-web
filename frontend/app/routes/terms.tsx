import type { Route } from "./+types/terms";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { buildMeta } from "~/lib/seo";
import { site } from "~/config/site";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Terms of Use – ${site.name}`,
    description: `The terms for using ${site.name}'s free online tools.`,
    path: "/terms",
  });
}

export default function Terms() {
  return (
    <ContentPage
      title="Terms of use"
      path="/terms"
      intro={<p>Plain-language terms for using the tools on this site.</p>}
      notice={
        <>
          <strong>Draft.</strong> These terms have not been reviewed by a lawyer and will be finalised, with the operator’s
          legal details, before launch.
        </>
      }
    >
      <ContentSection id="use" title="Using the tools">
        <p>
          The tools are free for personal and commercial use. You are responsible for the files and content you process, and for
          having the right to use them.
        </p>
      </ContentSection>
      <ContentSection id="results" title="No guarantees">
        <p>
          We work hard to make the tools accurate, but they are provided “as is”, without warranty. Check important results,
          such as converted data, formatted code or passport photos, before relying on them. Keep a copy of your original files.
        </p>
      </ContentSection>
      <ContentSection id="fair-use" title="Fair use">
        <p>Do not try to disrupt the site, overload it with automated requests, or use it for anything unlawful.</p>
      </ContentSection>
      <ContentSection id="open-source" title="Open-source software">
        <p>
          The tools are built on open-source libraries, including Prettier, Terser, csso, sql-formatter and pdf-lib, each under
          its own licence.
        </p>
      </ContentSection>
      <ContentSection id="changes" title="Changes">
        <p>We may update these terms. The current version is always on this page.</p>
      </ContentSection>
    </ContentPage>
  );
}
