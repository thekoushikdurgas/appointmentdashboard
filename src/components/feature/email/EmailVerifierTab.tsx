"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { emailVerifyBadgeColor } from "@/lib/emailStatus";

const PROVIDER_OPTIONS = [
  { value: "", label: "Default (mailtester)" },
  { value: "truelist", label: "Truelist" },
  { value: "icypeas", label: "Icypeas" },
  { value: "mailtester", label: "Mailtester" },
  { value: "mailvetter", label: "Mailvetter" },
];

export function EmailVerifierTab() {
  const { verify, result, loading, error, reset } = useEmailVerification();
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await verify(email, provider || null);
  };

  const res = result?.result;

  return (
    <Card
      title="Email Verifier"
      subtitle="Check deliverability via email.verifySingleEmail"
    >
      <form
        onSubmit={handleVerify}
        className="c360-section-stack c360-max-w-520"
      >
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@acme.com"
          required
        />
        <Select
          label="Provider"
          options={PROVIDER_OPTIONS}
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          inputSize="sm"
        />
        <div className="c360-flex c360-gap-2">
          <Button type="submit" loading={loading}>
            Verify Email
          </Button>
          {result && (
            <Button type="button" variant="secondary" onClick={reset}>
              Clear
            </Button>
          )}
        </div>

        {error && (
          <div className="c360-alert c360-alert--error">
            <div className="c360-alert__body">{error}</div>
          </div>
        )}

        {res && (
          <div className="c360-result-box c360-result-box--info">
            <div className="c360-flex c360-flex-wrap c360-gap-2 c360-items-center c360-mb-2">
              <span className="c360-fw-medium">{res.email}</span>
              <Badge color={emailVerifyBadgeColor(res.status)}>
                {res.status}
              </Badge>
            </div>
            <div className="c360-text-sm c360-text-muted c360-section-stack c360-section-stack--sm">
              {res.emailState && (
                <div>
                  State: <strong>{res.emailState}</strong>
                  {res.emailSubState ? ` / ${res.emailSubState}` : ""}
                </div>
              )}
              {res.certainty != null && res.certainty !== "" && (
                <div>Certainty: {res.certainty}</div>
              )}
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}
