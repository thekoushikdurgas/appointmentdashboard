"use client";

import { useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useEmailFinderSingle } from "@/hooks/useEmailFinderSingle";
import { emailVerifyBadgeColor } from "@/lib/emailStatus";

export function EmailFinderSingleTab() {
  const { find, result, loading, error, reset } = useEmailFinderSingle();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [domain, setDomain] = useState("");
  const [website, setWebsite] = useState("");
  const [mode, setMode] = useState<"domain" | "website">("domain");

  const handleFind = async (e: React.FormEvent) => {
    e.preventDefault();
    await find({
      firstName,
      lastName,
      domain: mode === "domain" ? domain : undefined,
      website: mode === "website" ? website : undefined,
    });
  };

  return (
    <Card title="Email Finder" subtitle="Find a professional email address">
      <form onSubmit={handleFind} className="c360-section-stack c360-max-w-520">
        <div className="c360-form-grid">
          <Input
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            required
          />
          <Input
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            required
          />
        </div>
        <div>
          <span className="c360-form-label">Lookup by</span>
          <div className="c360-flex c360-gap-4 c360-mt-1">
            <label className="c360-flex c360-items-center c360-gap-2 c360-text-sm">
              <input
                type="radio"
                name="email-finder-target"
                checked={mode === "domain"}
                onChange={() => setMode("domain")}
              />
              Company domain
            </label>
            <label className="c360-flex c360-items-center c360-gap-2 c360-text-sm">
              <input
                type="radio"
                name="email-finder-target"
                checked={mode === "website"}
                onChange={() => setMode("website")}
              />
              Website URL
            </label>
          </div>
        </div>
        {mode === "domain" ? (
          <Input
            label="Company domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="acme.com"
            required
            leftIcon={<Search size={16} />}
          />
        ) : (
          <Input
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.acme.com"
            required
            leftIcon={<Search size={16} />}
          />
        )}
        <div className="c360-flex c360-gap-3">
          <Button type="submit" loading={loading}>
            Find Email
          </Button>
          {result && (
            <Button variant="secondary" type="button" onClick={reset}>
              Clear
            </Button>
          )}
        </div>

        {error && (
          <div className="c360-alert c360-alert--error">
            <div className="c360-alert__body">{error}</div>
          </div>
        )}

        {result && result.success && result.emails.length > 0 && (
          <div className="c360-result-box c360-result-box--success">
            <div className="c360-result-box__header">
              <CheckCircle2 size={18} className="c360-text-success" />
              <span className="c360-result-box__label">
                {result.total} result(s) · {result.summary}
              </span>
            </div>
            <div className="c360-section-stack c360-section-stack--sm c360-mt-2">
              {result.emails.map((row) => (
                <div
                  key={`${row.email}-${row.uuid ?? row.source ?? ""}`}
                  className="c360-flex c360-flex-wrap c360-gap-2 c360-items-center"
                >
                  <code className="c360-text-sm">{row.email}</code>
                  {row.status ? (
                    <Badge color={emailVerifyBadgeColor(row.status)}>
                      {row.status}
                    </Badge>
                  ) : null}
                  {row.source ? (
                    <span className="c360-text-xs c360-text-muted">
                      {row.source}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && result.success && result.emails.length === 0 && (
          <p className="c360-page-subtitle">
            No emails returned for this query.
          </p>
        )}
      </form>
    </Card>
  );
}
