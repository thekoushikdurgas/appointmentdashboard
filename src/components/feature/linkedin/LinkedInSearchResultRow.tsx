"use client";

import { Badge } from "@/components/ui/Badge";
import type {
  ContactWithRelations,
  CompanyWithRelations,
} from "@/graphql/generated/types";

interface LinkedInContactRowProps {
  result: ContactWithRelations;
}

interface LinkedInCompanyRowProps {
  result: CompanyWithRelations;
}

export function LinkedInContactResultRow({ result }: LinkedInContactRowProps) {
  const c = result.contact;
  const meta = result.metadata;
  const linkedinUrl = meta?.linkedinUrl ?? undefined;
  return (
    <tr className="c360-table__row">
      <td className="c360-table__cell">
        {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
      </td>
      <td className="c360-table__cell">{c.email ?? "—"}</td>
      <td className="c360-table__cell">{c.title ?? "—"}</td>
      <td className="c360-table__cell">
        {linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="c360-link"
          >
            View
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="c360-table__cell">
        <Badge color="blue">—</Badge>
      </td>
    </tr>
  );
}

export function LinkedInCompanyResultRow({ result }: LinkedInCompanyRowProps) {
  const co = result.company;
  const meta = result.metadata;
  const linkedinUrl = meta?.linkedinUrl ?? undefined;
  return (
    <tr className="c360-table__row">
      <td className="c360-table__cell">{co.name ?? "—"}</td>
      <td className="c360-table__cell">{meta?.website ?? "—"}</td>
      <td className="c360-table__cell">
        {co.employeesCount != null ? String(co.employeesCount) : "—"}
      </td>
      <td className="c360-table__cell">
        {linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="c360-link"
          >
            View
          </a>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}
