import {
  asRecord,
  fetchConnectraCompany,
} from "@/services/graphql/hiringSignalService";
import { pickCompanyDisplay } from "@/components/feature/hiring-signals/hiringSignalUiUtils";

const logoByCompanyUuid = new Map<string, Promise<string | undefined>>();

/**
 * Load company logo from hireSignal.connectraCompany (same source as the drawer header).
 * Dedupes in-flight requests per company UUID.
 */
export function fetchConnectraCompanyLogoUrl(
  companyUuid: string,
): Promise<string | undefined> {
  const id = companyUuid.trim();
  if (!id) return Promise.resolve(undefined);
  const cached = logoByCompanyUuid.get(id);
  if (cached) return cached;
  const p = (async () => {
    try {
      const rec = await fetchConnectraCompany(id);
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
