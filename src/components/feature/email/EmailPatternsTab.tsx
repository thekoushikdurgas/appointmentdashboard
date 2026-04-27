"use client";

import { useState, useMemo, useRef } from "react";
import { OpenJobsDrawerButton } from "@/components/feature/jobs/OpenJobsDrawerButton";
import Papa from "papaparse";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import { emailService } from "@/services/graphql/emailService";
import { parseEmailServiceError } from "@/lib/emailErrors";
import { emailVerifyBadgeColor } from "@/lib/emailStatus";

const MAX_PATTERN_BULK = 10_000;

type PatternLearnRow = {
  companyUuid: string;
  email: string;
  firstName: string;
  lastName: string;
  domain: string;
};

function normalizeKey(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Parse CSV with header row; columns: company_uuid, email, first_name, last_name, domain (flexible names). */
function parsePatternLearnCsv(text: string): PatternLearnRow[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parsed = Papa.parse<Record<string, string>>(trimmed, {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "Invalid CSV");
  }
  const out: PatternLearnRow[] = [];
  for (const raw of parsed.data) {
    if (!raw || typeof raw !== "object") continue;
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      r[normalizeKey(k)] = (v ?? "").trim();
    }
    const companyUuid =
      r.company_uuid || r.companyuuid || r["company_id"] || r.company || "";
    const email = r.email || r.sample_email || "";
    const firstName = r.first_name || r.firstname || r.fn || "";
    const lastName = r.last_name || r.lastname || r.ln || "";
    const domain = r.domain || r.company_domain || "";
    if (!companyUuid || !email || !firstName || !lastName || !domain) continue;
    out.push({ companyUuid, email, firstName, lastName, domain });
  }
  return out;
}

export function EmailPatternsTab() {
  return (
    <Card
      title="Email Patterns"
      subtitle="Learn domain formats from sample contacts, or predict emails from name + domain"
    >
      <Tabs defaultValue="learn-single" className="c360-mt-2">
        <TabsList>
          <TabsTrigger value="learn-single">Learn Single</TabsTrigger>
          <TabsTrigger value="learn-bulk">Learn Bulk</TabsTrigger>
          <TabsTrigger value="predict">Predict</TabsTrigger>
        </TabsList>
        <TabsContent value="learn-single" className="c360-mt-4">
          <LearnSingleSection />
        </TabsContent>
        <TabsContent value="learn-bulk" className="c360-mt-4">
          <LearnBulkSection />
        </TabsContent>
        <TabsContent value="predict" className="c360-mt-4">
          <PredictSection />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function LearnSingleSection() {
  const [companyUuid, setCompanyUuid] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [domain, setDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [patternError, setPatternError] = useState<string | null>(null);
  const [added, setAdded] = useState<Array<{ domain: string; email: string }>>(
    [],
  );

  const handleAddPattern = async () => {
    setPatternError(null);
    if (
      !companyUuid.trim() ||
      !email.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !domain.trim()
    ) {
      setPatternError(
        "Company UUID, sample email, first name, last name, and domain are required.",
      );
      return;
    }
    setAdding(true);
    try {
      await emailService.addEmailPattern({
        companyUuid: companyUuid.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        domain: domain.trim(),
      });
      setAdded((prev) => [
        ...prev,
        { domain: domain.trim(), email: email.trim() },
      ]);
      setEmail("");
    } catch (err) {
      setPatternError(parseEmailServiceError(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="c360-section-stack c360-max-w-560">
      <div className="c360-card c360-p-3 c360-text-sm c360-mb-4">
        <p className="c360-mb-0">
          For bulk pattern learning from a CSV in S3, go to{" "}
          <OpenJobsDrawerButton type="button" className="c360-text-primary">
            Jobs → Start Job → Email pattern learn (S3)
          </OpenJobsDrawerButton>
          .
        </p>
      </div>
      <Input
        label="Company UUID"
        value={companyUuid}
        onChange={(e) => setCompanyUuid(e.target.value)}
        placeholder="00000000-0000-0000-0000-000000000000"
      />
      <div className="c360-form-grid">
        <Input
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Jane"
        />
        <Input
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Doe"
        />
      </div>
      <Input
        label="Domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="acme.com"
      />
      <Input
        label="Sample email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="jane.doe@acme.com"
      />
      {patternError && (
        <Alert variant="danger" onClose={() => setPatternError(null)}>
          {patternError}
        </Alert>
      )}
      <Button loading={adding} onClick={() => void handleAddPattern()}>
        Add pattern
      </Button>
      {added.length > 0 && (
        <div>
          <p className="c360-text-sm c360-fw-medium c360-mb-2">
            Added this session:
          </p>
          <div className="c360-flex c360-flex-wrap c360-gap-2">
            {added.map((a, i) => (
              <Badge key={i} color="green">
                {a.domain}: {a.email}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LearnBulkSection() {
  const [raw, setRaw] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    total: number | null;
    inserted: number | null;
    skipped: number | null;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    try {
      return parsePatternLearnCsv(raw);
    } catch {
      return [];
    }
  }, [raw]);

  const runBulk = async () => {
    setBulkError(null);
    setBulkResult(null);
    let parsed: PatternLearnRow[];
    try {
      parsed = parsePatternLearnCsv(raw);
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Could not parse CSV");
      return;
    }
    if (parsed.length === 0) {
      setBulkError(
        "No valid rows. Expected headers such as company_uuid, email, first_name, last_name, domain.",
      );
      return;
    }
    const slice = parsed.slice(0, MAX_PATTERN_BULK);
    setBulkLoading(true);
    try {
      const data = await emailService.addEmailPatternBulk(
        slice.map((r) => ({
          companyUuid: r.companyUuid,
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          domain: r.domain,
        })),
      );
      const r = data.email.addEmailPatternBulk;
      setBulkResult({
        total: r.total ?? null,
        inserted: r.inserted ?? null,
        skipped: r.skipped ?? null,
      });
    } catch (e) {
      setBulkError(parseEmailServiceError(e));
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="c360-section-stack c360-max-w-720">
      <p className="c360-text-sm c360-text-muted">
        Paste CSV with a header row, or upload a file. Columns (flexible names):
        company_uuid, email, first_name, last_name, domain. Max{" "}
        {MAX_PATTERN_BULK} rows per request.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="c360-sr-only"
        aria-label="Upload pattern learn CSV"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => setRaw(String(reader.result ?? ""));
          reader.readAsText(f);
          e.target.value = "";
        }}
      />
      <div className="c360-flex c360-flex-wrap c360-gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          Upload CSV
        </Button>
        <span className="c360-text-xs c360-text-muted c360-self-center">
          Parsed rows: {rows.length}
          {raw.trim() && rows.length === 0
            ? " (no complete rows — check headers)"
            : ""}
        </span>
      </div>
      <textarea
        className="c360-input c360-w-full c360-font-mono"
        rows={10}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={
          "company_uuid,email,first_name,last_name,domain\n00000000-0000-0000-0000-000000000001,jane@acme.com,Jane,Doe,acme.com"
        }
      />
      {bulkError && (
        <Alert variant="danger" onClose={() => setBulkError(null)}>
          {bulkError}
        </Alert>
      )}
      <Button loading={bulkLoading} onClick={() => void runBulk()}>
        Add patterns in bulk
      </Button>
      {bulkResult && (
        <div
          className="c360-pattern-bulk-result c360-flex c360-flex-wrap c360-gap-2"
          data-testid="pattern-bulk-result"
        >
          {bulkResult.inserted != null && (
            <Badge color="green">inserted {bulkResult.inserted}</Badge>
          )}
          {bulkResult.skipped != null && (
            <Badge color="gray">skipped {bulkResult.skipped}</Badge>
          )}
          {bulkResult.total != null && (
            <Badge color="blue">total {bulkResult.total}</Badge>
          )}
        </div>
      )}
      <div className="c360-card c360-p-3 c360-text-sm">
        <p className="c360-mb-0">
          Very large files: use{" "}
          <OpenJobsDrawerButton type="button" className="c360-text-primary">
            Jobs → Email pattern learn (S3)
          </OpenJobsDrawerButton>
          .
        </p>
      </div>
    </div>
  );
}

function PredictSection() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<
    Array<{
      uuid: string;
      patternFormat: string;
      email: string;
      contactCount: number;
      successRate?: number | null;
      status?: string | null;
    }>
  >([]);

  const onPredict = async () => {
    setErr(null);
    setPatterns([]);
    if (!firstName.trim() || !lastName.trim() || !domain.trim()) {
      setErr("First name, last name, and domain are required.");
      return;
    }
    setLoading(true);
    try {
      const data = await emailService.predictEmailPattern({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        domain: domain.trim(),
      });
      setPatterns(data.email.predictEmailPattern.patterns ?? []);
    } catch (e) {
      setErr(parseEmailServiceError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="c360-section-stack c360-max-w-720">
      <div className="c360-form-grid">
        <Input
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Jane"
        />
        <Input
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Doe"
        />
      </div>
      <Input
        label="Domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="acme.com"
      />
      {err && <p className="c360-text-sm c360-text-danger">{err}</p>}
      <Button loading={loading} onClick={() => void onPredict()}>
        Predict
      </Button>
      {patterns.length > 0 && (
        <div className="c360-table-wrapper">
          <table className="c360-table c360-pattern-predict-table">
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Email</th>
                <th>Contacts</th>
                <th>Success %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.uuid + p.email}>
                  <td className="c360-text-xs">{p.patternFormat}</td>
                  <td>
                    <code className="c360-text-xs">{p.email}</code>
                  </td>
                  <td>{p.contactCount}</td>
                  <td>
                    {p.successRate != null
                      ? `${p.successRate.toFixed(1)}%`
                      : "—"}
                  </td>
                  <td>
                    {p.status ? (
                      <Badge color={emailVerifyBadgeColor(p.status)} size="sm">
                        {p.status}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
