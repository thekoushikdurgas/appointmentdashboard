"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { usePhoneVerifierSingle } from "@/hooks/usePhoneVerifierSingle";

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function PhoneVerifierSingleTab() {
  const { verify, result, loading, error, reset } = usePhoneVerifierSingle();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verify(email);
  };

  return (
    <Card
      title="Phone verifier"
      subtitle="Gateway maps to phone.server verifier (input uses email per API schema)"
    >
      <form
        onSubmit={handleSubmit}
        className="c360-section-stack c360-max-w-520"
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@acme.com"
          required
        />
        <div className="c360-flex c360-gap-3">
          <Button type="submit" loading={loading}>
            Verify
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
