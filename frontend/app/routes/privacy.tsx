import type { Route } from "./+types/privacy";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { buildMeta } from "~/lib/seo";
import { ads, site } from "~/config/site";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Privacy Policy – ${site.name}`,
    description: `How ${site.name} handles your data: tools run in your browser, your files are never uploaded, and how ads and cookies work.`,
    path: "/privacy",
  });
}

const lastUpdated = "18 October 2026";

export default function Privacy() {
  return (
    <ContentPage
      title="Privacy policy"
      path="/privacy"
      intro={<p>The short version: your files and text never leave your device.</p>}
      notice={
        <>
          <strong>Draft.</strong> This policy describes how the site works today. It has not been reviewed by a lawyer and
          will be finalised, with the operator’s legal details, before launch.
        </>
      }
    >
      <ContentSection id="files" title="Files and text you use in the tools">
        <p>
          Every tool processes your input inside your browser. Files you open and text you paste are <strong>not uploaded</strong>{" "}
          to our servers, not stored and not shared. When you close or reload the page, they are gone.
        </p>
      </ContentSection>
      <ContentSection id="device" title="What is stored on your device">
        <ul>
          <li>Tool preferences, such as indent size or editor height.</li>
        </ul>
        <p>
          These are kept in your browser’s local storage, never sent to us, and you can clear them at any time in your browser
          settings. We use Google Analytics to understand visits to the site, including pages viewed and basic browser/device
          information. Google may use cookies or similar technologies to measure usage.
        </p>
      </ContentSection>
      <ContentSection id="advertising" title="Advertising and cookies">
        {ads.enabled ? (
          <>
            <p>
              The site is free because it shows ads served by Google AdSense. Ads appear around the tools, never inside them, and
              ad services never see the files or text you use in a tool.
            </p>
            <ul>
              <li>
                Google and its partners, as third-party vendors, use cookies and similar technologies to serve ads based on your
                visits to this and other websites.
              </li>
              <li>
                Google’s advertising cookies let it and its partners serve ads to you based on those visits, and to measure and
                limit how often you see an ad. Read{" "}
                <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
                  how Google uses information from sites that use its services
                </a>
                .
              </li>
              <li>
                You can turn off personalised ads in{" "}
                <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">
                  Google’s My Ad Center
                </a>
                , or opt out of other vendors’ personalised ads at{" "}
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
                  aboutads.info
                </a>
                .
              </li>
            </ul>
            <p>
              If you are in the European Economic Area, the UK or Switzerland, we ask for your consent before personalised ads or
              non-essential cookies are used, through a consent message provided by Google. Without consent you may still see
              non-personalised ads. You can change or withdraw your choice at any time with the “Privacy and cookie settings”
              link at the bottom of every page.
            </p>
          </>
        ) : (
          <p>The site does not show ads today. If that changes, this section will explain what ad partners collect and how to opt out, before any ad appears.</p>
        )}
      </ContentSection>
      <ContentSection id="third-parties" title="Third parties">
        <p>
          Fonts, scripts and the data used to display PDFs are all served from our own site.{" "}
          {ads.enabled
            ? "Third-party requests include Google Analytics and Google’s ad and consent scripts described above."
            : "Your browser also sends page-view information to Google Analytics; it does not request fonts or advertising scripts from third parties."}
        </p>
        <p>Like any website, our hosting provider may keep standard server logs (IP address, page requested, time) for security.</p>
      </ContentSection>
      <ContentSection id="children" title="Children">
        <p>The site is not directed at children under 13, and we do not knowingly collect personal information from them.</p>
      </ContentSection>
      <ContentSection id="changes" title="Changes to this policy">
        <p>We will update this page when the way the site works changes. The date below shows the latest revision.</p>
        <p>Last updated: {lastUpdated}.</p>
      </ContentSection>
      <ContentSection id="contact" title="Questions">
        <p>Contact us through the contact page with any privacy question.</p>
      </ContentSection>
    </ContentPage>
  );
}
