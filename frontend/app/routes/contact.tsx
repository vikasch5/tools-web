import { useState } from "react";
import { Link } from "react-router";
import { Mail } from "lucide-react";
import type { Route } from "./+types/contact";
import { ContentPage, ContentSection } from "~/components/layout/ContentPage";
import { Button } from "~/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "~/components/ui/Field";
import { buildMeta } from "~/lib/seo";
import { site } from "~/config/site";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `Contact – ${site.name}`,
    description: `Report a bug, suggest a tool or ask a question about ${site.name}.`,
    path: "/contact",
  });
}

/**
 * There is no backend yet, so the form composes an email in the visitor's
 * own mail app instead of submitting anywhere. The page says so.
 */
export default function Contact() {
  const [topic, setTopic] = useState("Suggest a tool");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(`[${topic}] ${subject}`.trim())}&body=${encodeURIComponent(message)}`;

  return (
    <ContentPage
      title="Contact"
      path="/contact"
      intro={<p>Found a bug, missing a tool, or have a question? We read every message.</p>}
      notice={
        // Shown only while the address is still the placeholder.
        site.email.endsWith(".example") && (
          <>
            <strong>Before launch:</strong> {site.email} is a placeholder address. This form opens your own email app
            with your message filled in; nothing is sent from this website.
          </>
        )
      }
    >
      <ContentSection id="write" title="Write to us">
        <form
          className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            window.location.href = mailto;
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option>Suggest a tool</option>
              <option>Report a bug</option>
              <option>Question</option>
              <option>Other</option>
            </SelectField>
            <TextField label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
          </div>
          <TextAreaField
            label="Message"
            hint="For bugs, include the tool and the steps"
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="[&_textarea]:font-sans"
            required
          />
          <Button type="submit" variant="primary" icon={Mail}>
            Open in email app
          </Button>
        </form>
        <p>
          Please do not attach confidential files. Many questions are already answered in the <Link to="/help">help center</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
