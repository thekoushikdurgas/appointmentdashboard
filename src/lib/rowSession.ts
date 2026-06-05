import type { Contact } from "@/services/graphql/contactsService";
import type { Company } from "@/services/graphql/companiesService";

/**
 * Session-storage stash for list-row snapshots (detail pages when API lookup lags).
 */
export function createRowSessionStash<T extends { id: string }>(
  prefix: string,
) {
  return {
    stash(item: T): void {
      if (typeof window === "undefined") return;
      try {
        sessionStorage.setItem(`${prefix}${item.id}`, JSON.stringify(item));
      } catch {
        /* quota / private mode */
      }
    },

    read(id: string): T | null {
      if (typeof window === "undefined") return null;
      try {
        const raw = sessionStorage.getItem(`${prefix}${id}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as T;
        return parsed?.id === id ? parsed : null;
      } catch {
        return null;
      }
    },
  };
}

const contactStash = createRowSessionStash<Contact>("c360:contact-row:");
const companyStash = createRowSessionStash<Company>("c360:company-row:");

export function stashContactRowForDetail(contact: Contact): void {
  contactStash.stash(contact);
}

export function readStashedContactRow(uuid: string): Contact | null {
  return contactStash.read(uuid);
}

export function stashCompanyRowForDetail(company: Company): void {
  companyStash.stash(company);
}

export function readStashedCompanyRow(uuid: string): Company | null {
  return companyStash.read(uuid);
}
