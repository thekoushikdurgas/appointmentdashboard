import {
  asRecord,
  fetchEnrichedCompany,
} from "@/services/graphql/hiringSignalService";
import { pickCompanyDisplay } from "@/components/feature/hiring-signals/hiringSignalUiUtils";

const logoByCompanyUuid = new Map<string, Promise<string | undefined>>();

/**
 * Load company logo from enriched company profile (same source as the drawer header).
 * Dedupes in-flight requests per company UUID.
 */
export function fetchCompanyLogoUrl(
  companyUuid: string,
): Promise<string | undefined> {
  const id = companyUuid.trim();
  if (!id) return Promise.resolve(undefined);
  const cached = logoByCompanyUuid.get(id);
  if (cached) return cached;
  const p = (async () => {
    try {
      const rec = await fetchEnrichedCompany(id);
      const rr = asRecord(rec.hireSignal?.connectraCompany);
      if (!rr || rr.success === false) return undefined;
      const pic = pickCompanyDisplay(rr.data).profilePic.trim();
      return pic || undefined;
    } catch {
      return undefined;
    }
  })();
  logoByCompanyUuid.set(id, p);
  return p;
}
