"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { phoneService } from "@/services/graphql/phoneService";
import { parsePhoneServiceError } from "@/lib/phoneErrors";

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function PhoneJobStatusTab() {
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = jobId.trim();
    if (!id) {
      setError("Enter a job ID.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await phoneService.phoneJobStatus(id);
      setResult(data.phone.phoneJobStatus);
    } catch (err) {
      setError(parsePhoneServiceError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Job status"
      subtitle="GET /jobs/:id/status via gateway phone.phoneJobStatus"
    >
      <form onSubmit={load} className="c360-section-stack c360-max-w-520">
        <Input
          label="Job ID"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          placeholder="job-uuid"
          leftIcon={<Search size={16} />}
        />
        <Button type="submit" loading={loading}>
          Load status
        </Button>
        {error && (
          <div className="c360-alert c360-alert--error">
            <div className="c360-alert__body">{error}</div>
          </div>
        )}
        {result != null && (
          <pre className="c360-code-block c360-text-xs c360-overflow-auto">
            {formatJson(result)}
          </pre>
        )}
      </form>
    </Card>
  );
}
