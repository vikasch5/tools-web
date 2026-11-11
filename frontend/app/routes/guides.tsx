import type { Route } from "./+types/guides";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { GuideCards } from "~/components/guide/GuideCards";
import { guides, type Guide } from "~/data/guides";
import { breadcrumbJsonLd, buildMeta } from "~/lib/seo";
import { site } from "~/config/site";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Guides: Form Uploads, Tax and Loans – ${site.name}`,
    description:
      "Plain-language guides to photo and PDF size limits for Indian forms, income tax regimes, HRA, GST and home loans, with worked examples you can check.",
    path: "/guides",
    jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }])],
  });
}

const topics: Guide["topic"][] = ["Forms and uploads", "Money and tax"];

export default function Guides() {
  return (
    <ContentPage
      title="Guides"
      path="/guides"
      intro={
        <p>
          Practical explanations of the problems our tools solve: why an upload gets rejected, how a tax rule works, what a
          prepayment really saves. Every number is worked out with the same calculators you can use on this site.
        </p>
      }
    >
      {topics.map((topic) => (
        <ContentSection key={topic} id={topic.toLowerCase().replace(/\W+/g, "-")} title={topic}>
          <GuideCards guides={guides.filter((g) => g.topic === topic)} />
        </ContentSection>
      ))}
    </ContentPage>
  );
}
