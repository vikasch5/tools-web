import type { Route } from "./+types/terms";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { buildMeta } from "~/lib/seo";
import { site } from "~/config/site";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Terms of Use – ${site.name}`,
    description: `Terms for accessing and using ${site.name}'s free browser-based online tools.`,
    path: "/terms",
  });
}

export default function Terms() {
  return (
    <ContentPage
      title="Terms of use"
      path="/terms"
      intro={<p>These terms explain the basic rules for using {site.name} and its online tools.</p>}
    >
      <ContentSection id="use" title="Using the tools">
        <p>
          The tools are provided free of charge for lawful personal or commercial use, subject to these terms. You are responsible
          for the content and files you choose to process and must have the rights and permissions needed to use them.
        </p>
      </ContentSection>
      <ContentSection id="results" title="Accuracy and responsibility">
        <p>
          We aim to make the tools useful and reliable, but outputs may contain errors or differ because of browser support,
          file structure, input quality or tool limitations. The tools are provided on an “as is” and “as available” basis to the
          extent permitted by law, without guarantees that they will be uninterrupted, error-free or suitable for a particular purpose.
        </p>
        <p>
          You are responsible for checking results before relying on them, especially for financial calculations, code, converted
          data, identity or passport photos, and other important uses. Keep a copy of your original files.
        </p>
      </ContentSection>
      <ContentSection id="acceptable-use" title="Acceptable use">
        <p>
          Do not use the site unlawfully, attempt to gain unauthorised access, interfere with its operation, introduce malicious
          code, abuse automated requests, or infringe another person's rights. We may restrict access where reasonably necessary
          to protect the service, visitors or infrastructure.
        </p>
      </ContentSection>
      <ContentSection id="privacy" title="Privacy">
        <p>
          Your use of the site is also covered by our <a href="/privacy">Privacy Policy</a>, which explains browser-side tool
          processing, analytics, technical logs and advertising technologies when enabled.
        </p>
      </ContentSection>
      <ContentSection id="ads-links" title="Advertising and external links">
        <p>
          The site may display third-party advertisements and link to external websites. Advertisers and external website
          operators are responsible for their own content, services and privacy practices. An advertisement or link does not
          necessarily mean that {site.name} endorses the advertised product or linked website.
        </p>
      </ContentSection>
      <ContentSection id="intellectual-property" title="Intellectual property">
        <p>
          The site's branding, design and original site content belong to their respective rights holders. The tools may use
          open-source libraries and other third-party components, each governed by its own licence. These terms do not replace
          those licences or transfer ownership of content you provide or generate.
        </p>
      </ContentSection>
      <ContentSection id="availability" title="Changes and availability">
        <p>
          We may change, suspend or discontinue a tool or part of the site to maintain or improve the service. We may update these
          terms from time to time; the current version will be published on this page.
        </p>
      </ContentSection>
      <ContentSection id="contact" title="Contact">
        <p>
          Questions about these terms can be sent to <a href={`mailto:${site.email}`}>{site.email}</a> or through our{" "}
          <a href="/contact">contact page</a>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
