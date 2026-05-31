import type { Contact } from "@/services/graphql/contactsService";

const PREFIX = "c360:contact-row:";

/** Stash a list-row snapshot so detail can render when Connectra uuid lookup lags. */
export function stashContactRowForDetail(contact: Contact): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${PREFIX}${contact.id}`, JSON.stringify(contact));
  } catch {
    /* quota / private mode */
  }
}

export function readStashedContactRow(uuid: string): Contact | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${uuid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Contact;
    return parsed?.id === uuid ? parsed : null;
  } catch {
    return null;
  }
}
