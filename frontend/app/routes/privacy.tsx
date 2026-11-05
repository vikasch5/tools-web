import type { Route } from "./+types/privacy";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { buildMeta } from "~/lib/seo";
import { ads, site } from "~/config/site";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Privacy Policy – ${site.name}`,
    description: `Learn how ${site.name} handles tool inputs, analytics, cookies, advertising and privacy choices.`,
    path: "/privacy",
  });
}

const lastUpdated = "31 October 2026";

export default function Privacy() {
  return (
    <ContentPage
      title="Privacy policy"
      path="/privacy"
      intro={<p>This policy explains what information may be processed when you visit {site.name} and use its browser-based tools.</p>}
    >
      <ContentSection id="files" title="Files and text you use in the tools">
        <p>
          The tools are designed to process supported text and files in your browser. For these client-side tools, the content you
          enter or the files you select are processed on your device and are not intentionally uploaded to our application servers.
          Your browser still makes ordinary requests to load the website and may send technical information described below.
        </p>
        <p>
          Results may exist temporarily in the current page or browser memory. Do not rely on this site as the only copy of an
          important file or result; keep your own original and verify important outputs before using them.
        </p>
      </ContentSection>
      <ContentSection id="device" title="Preferences stored on your device">
        <p>
          Some tool preferences, such as editor settings, may be saved in your browser's local storage so they remain available
          when you return. These values remain in your browser unless you clear them through your browser settings.
        </p>
      </ContentSection>
      <ContentSection id="analytics" title="Analytics and technical logs">
        <p>
          We use Google Analytics to understand how visitors use the website, such as which pages are visited and general
          interactions with the site. Google Analytics may process information such as online identifiers, browser and device
          details, approximate location, referral information and usage events. Google processes this information under its own
          terms and policies. Learn more in{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>
          {" "}and{" "}
          <a href="https://support.google.com/analytics/answer/6004245" target="_blank" rel="noopener noreferrer">Google Analytics safeguards and data practices</a>.
        </p>
        <p>
          Our hosting provider may also process standard server logs, which can include an IP address, requested URL, timestamp
          and technical details, for delivery, reliability, abuse prevention and security.
        </p>
      </ContentSection>
      <ContentSection id="advertising" title="Advertising and cookies">
        {ads.enabled ? (
          <>
            <p>
              This site shows ads from Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on your
              prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to
              serve ads to you based on your visits to this site and/or other sites on the internet. These cookies and similar
              technologies are also used to measure ads, limit how often you see them and prevent fraud. Ads do not use the text or
              files you process inside a tool; those stay in your browser.
            </p>
            <p>
              You can opt out of personalised advertising by visiting{" "}
              <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>
              {" "}(also called My Ad Center). You can also opt out of some third-party vendors' use of cookies for personalised
              advertising at{" "}
              <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>
              {" "}and{" "}
              <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">www.youronlinechoices.eu</a>.
              Read{" "}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">how Google uses information from sites and apps that use its services</a>.
            </p>
            <p>
              Visitors in the European Economic Area, the UK and Switzerland are asked for consent through a Google-certified
              consent message before advertising cookies are used. You can change your choice at any time with the "Privacy and
              cookie settings" link at the bottom of every page.
            </p>
          </>
        ) : (
          <p>
            Google AdSense is not enabled in this build. If advertising is introduced, this policy will be updated to describe the
            relevant advertising services, cookies and privacy choices before ads are served.
          </p>
        )}
      </ContentSection>
      <ContentSection id="third-parties" title="Service providers and external links">
        <p>
          The website uses third-party services described in this policy, including Google Analytics and, when enabled, Google
          advertising services. External links open websites operated by others; their own terms and privacy policies apply.
        </p>
      </ContentSection>
      <ContentSection id="children" title="Children">
        <p>
          This website is a general-purpose utility site and is not directed at children under 13. We do not knowingly ask children
          to provide personal information.
        </p>
      </ContentSection>
      <ContentSection id="retention" title="Retention and security">
        <p>
          We do not intentionally store the contents of files or text processed by the browser-based tools on our application
          servers. Analytics providers and hosting providers may retain their own data under their policies and settings. No
          internet service can guarantee absolute security, so avoid sharing sensitive information unnecessarily.
        </p>
      </ContentSection>
      <ContentSection id="changes" title="Changes to this policy">
        <p>
          We may update this policy when the site, its service providers or applicable requirements change. The date below shows
          when this page was last revised.
        </p>
        <p>Last updated: {lastUpdated}.</p>
      </ContentSection>
      <ContentSection id="contact" title="Contact">
        <p>
          For privacy questions, contact us at{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a> or use the <a href="/contact">contact page</a>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
