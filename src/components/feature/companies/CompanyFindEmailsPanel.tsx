"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface FoundEmail {
  email: string;
  status: string;
}

interface CompanyFindEmailsPanelProps {
  domain: string;
  emails: FoundEmail[];
}

export function CompanyFindEmailsPanel({
  domain,
  emails,
}: CompanyFindEmailsPanelProps) {
  if (emails.length === 0) return null;

  return (
    <Card
      title="Email Finder Results"
      subtitle={`${emails.length} emails found for ${domain}`}
    >
      <div className="c360-section-stack c360-section-stack--sm">
        {emails.map((e) => (
          <div key={e.email} className="c360-email-result-row">
            <span className="c360-text-sm">{e.email}</span>
            <Badge
              color={
                e.status === "valid"
                  ? "green"
                  : e.status === "risky"
                    ? "orange"
                    : "gray"
              }
            >
              {e.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
