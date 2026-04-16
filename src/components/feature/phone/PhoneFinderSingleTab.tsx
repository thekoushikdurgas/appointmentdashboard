"use client";

import { useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { usePhoneFinderSingle } from "@/hooks/usePhoneFinderSingle";

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function PhoneFinderSingleTab() {
  const { find, result, loading, error, reset } = usePhoneFinderSingle();
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
    <Card
      title="Phone finder"
      subtitle="Resolve phone data via the phone.server satellite (JSON response)"
    >
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
                name="phone-finder-target"
                checked={mode === "domain"}
                onChange={() => setMode("domain")}
              />
              Company domain
            </label>
            <label className="c360-flex c360-items-center c360-gap-2 c360-text-sm">
              <input
                type="radio"
                name="phone-finder-target"
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
            Find phone
          </Button>
          {result != null && (
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

        {result != null && (
          <div className="c360-result-box c360-result-box--success">
            <div className="c360-result-box__header">
              <CheckCircle2 size={18} className="c360-text-success" />
              <span className="c360-result-box__label">Response</span>
            </div>
            <pre className="c360-code-block c360-mt-2 c360-text-xs c360-overflow-auto">
              {formatJson(result)}
            </pre>
          </div>
        )}
      </form>
    </Card>
  );
}
