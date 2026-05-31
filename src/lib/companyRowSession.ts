import type { Company } from "@/services/graphql/companiesService";

const PREFIX = "c360:company-row:";

/** Stash a list-row snapshot so detail can render when Connectra uuid lookup misses. */
export function stashCompanyRowForDetail(company: Company): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${PREFIX}${company.id}`, JSON.stringify(company));
  } catch {
    /* quota / private mode */
  }
}

export function readStashedCompanyRow(uuid: string): Company | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${uuid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Company;
    return parsed?.id === uuid ? parsed : null;
  } catch {
    return null;
  }
}
