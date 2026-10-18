import type { Route } from "./+types/privacy";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { buildMeta } from "~/lib/seo";
import { site } from "~/config/site";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Privacy Policy – ${site.name}`,
    description: `How ${site.name} handles your data: tools run in your browser and your files are never uploaded.`,
    path: "/privacy",
  });
}

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
          <li>Your theme choice (light, dark or system).</li>
          <li>Tool preferences, such as indent size or editor height.</li>
        </ul>
        <p>
          These are kept in your browser’s local storage, never sent to us, and you can clear them at any time in your browser
          settings. We do not use advertising or tracking cookies.
        </p>
      </ContentSection>
      <ContentSection id="third-parties" title="Third parties">
        <p>
          Fonts, scripts and the data used to display PDFs are all served from our own site. Your browser makes no requests to
          font services, analytics or advertising networks.
        </p>
        <p>Like any website, our hosting provider may keep standard server logs (IP address, page requested, time) for security.</p>
      </ContentSection>
      <ContentSection id="contact" title="Questions">
        <p>Contact us through the contact page with any privacy question.</p>
      </ContentSection>
    </ContentPage>
  );
}
