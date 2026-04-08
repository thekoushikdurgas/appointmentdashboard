"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

/** Static HTTP envelope matrix from `docs/backend/graphql.modules/18_HEALTH_ENVELOPE_MATRIX.md` (no live probes). */
const ROWS: Array<{
  service: string;
  family: string;
  endpoint: string;
  required: string;
}> = [
  {
    service: "Contact360 gateway (contact360.io/api)",
    family: "FastAPI gateway",
    endpoint: "/health",
    required: "status, service, version",
  },
  {
    service: "Connectra (contact360.io/sync)",
    family: "Go/Gin",
    endpoint: "/health",
    required: "status",
  },
  {
    service: "TKD Job (contact360.io/jobs)",
    family: "FastAPI jobs",
    endpoint: "/health",
    required: "status",
  },
  {
    service: "Email APIs (lambda/emailapis)",
    family: "FastAPI lambda-style",
    endpoint: "/health",
    required: "status, service, version",
  },
  {
    service: "Email API Go (lambda/emailapigo)",
    family: "Go/Gin",
    endpoint: "/health",
    required: "status, service, version",
  },
  {
    service: "Logs API (lambda/logs.api)",
    family: "FastAPI logging",
    endpoint: "/health",
    required: "status, service identity",
  },
  {
    service: "S3 Storage (lambda/s3storage)",
    family: "FastAPI storage",
    endpoint: "/api/v1/health",
    required: "status, storage connectivity",
  },
  {
    service: "Sales Navigator",
    family: "FastAPI integration",
    endpoint: "/v1/health",
    required: "status, service, version",
  },
  {
    service: "Contact AI",
    family: "FastAPI AI",
    endpoint: "/health",
    required: "status, database connectivity",
  },
  {
    service: "ResumeAI",
    family: "FastAPI AI",
    endpoint: "/v1/health",
    required: "status, service",
  },
  {
    service: "Mailvetter",
    family: "Go/Gin verifier",
    endpoint: "/v1/health",
    required: "status, service, version",
  },
];

export function StatusEnvelopeReferenceTab() {
  return (
    <div className="c360-section-stack">
      <Alert variant="info">
        This table documents expected <strong>HTTP</strong>{" "}
        <code className="c360-mono">/health</code> envelopes across core
        services. The browser cannot probe internal URLs; this app’s live checks
        use <strong>GraphQL</strong>{" "}
        <code className="c360-mono">health {`{ ... }`}</code> on the gateway
        (see Overview and Connectra tabs).
      </Alert>

      <Card title="Service matrix (reference)">
        <div className="c360-card-body">
          <div className="c360-table-wrapper">
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Family</th>
                  <th>Health endpoint</th>
                  <th>Required fields</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.service}>
                    <td>{row.service}</td>
                    <td>
                      <Badge color="gray">{row.family}</Badge>
                    </td>
                    <td>
                      <code className="c360-mono">{row.endpoint}</code>
                    </td>
                    <td className="c360-text-sm">{row.required}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card title="Envelope families">
        <div className="c360-card-body">
          <ol className="c360-page-subtitle c360-m-0 c360-pl-4">
            <li className="c360-mb-2">
              <strong>Minimal (Gin)</strong>:{" "}
              <code>{`{ "status": "ok" }`}</code>
            </li>
            <li className="c360-mb-2">
              <strong>Service identity</strong>:{" "}
              <code>{`{ "status", "service", "version" }`}</code>
            </li>
            <li>
              <strong>Component-aware</strong>:{" "}
              <code>{`{ "status", "diagnostics": { ... } }`}</code>
            </li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
