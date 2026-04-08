import type {
  ContactWithRelations,
  CompanyWithRelations,
  LinkedInSearchResponse,
} from "@/graphql/generated/types";
import type { LinkedInCompanyRow, LinkedInProfileRow } from "@/types/linkedin";

export function mapLinkedInSearchResponse(
  res: LinkedInSearchResponse,
  fallbackUrl: string,
): { profiles: LinkedInProfileRow[]; companies: LinkedInCompanyRow[] } {
  const profiles: LinkedInProfileRow[] = res.contacts.map((row, i) =>
    mapContactRow(row, i, fallbackUrl),
  );
  const companies: LinkedInCompanyRow[] = res.companies.map((row, i) =>
    mapCompanyRow(row, i, fallbackUrl),
  );
  return { profiles, companies };
}

function mapContactRow(
  row: ContactWithRelations,
  i: number,
  fallbackUrl: string,
): LinkedInProfileRow {
  const c = row.contact;
  const m = row.metadata;
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return {
    id: c.uuid ?? `r-${i}`,
    fullName: name || "Contact",
    title: c.title ?? "",
    company: row.company?.name ?? "",
    location: [m?.city, m?.state, m?.country].filter(Boolean).join(", "),
    linkedinUrl: m?.linkedinUrl ?? fallbackUrl,
    connectionDegree: 0,
    importedAt: new Date().toISOString(),
    firstName: c.firstName ?? null,
    lastName: c.lastName ?? null,
    email: c.email ?? null,
  };
}

function mapCompanyRow(
  row: CompanyWithRelations,
  i: number,
  fallbackUrl: string,
): LinkedInCompanyRow {
  return {
    id: row.company.uuid ?? `c-${i}`,
    name: row.company.name ?? "Company",
    linkedinUrl: row.metadata?.linkedinUrl ?? fallbackUrl,
  };
}
