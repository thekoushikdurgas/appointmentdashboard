import type { Contact } from "@/services/graphql/contactsService";
import type { LinkedInJobRow } from "@/lib/jobs/hiringSignalJobRows";

/** Minimal company identity for `CompanyDrawerPanel`. */
export type CompanyDrawerAnchor = {
  companyUuid: string;
  companyName: string;
};

export function companyDrawerAnchorFromJob(
  row: LinkedInJobRow,
): CompanyDrawerAnchor | null {
  const companyUuid = row.companyUuid?.trim();
  if (!companyUuid) return null;
  return {
    companyUuid,
    companyName: row.companyName?.trim() || "Company",
  };
}

export function companyDrawerAnchorFromContact(
  contact: Contact,
): CompanyDrawerAnchor | null {
  const companyUuid = contact.companyId?.trim();
  if (!companyUuid) return null;
  return {
    companyUuid,
    companyName: contact.company?.trim() || "Company",
  };
}
