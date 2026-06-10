"use client";

import type { Contact } from "@/services/graphql/contactsService";
import { HiringSignalsCompanyAvatar } from "@/components/feature/hiring-signals/hiringSignalsGridCells";
import { useCompanyLogoUrl } from "@/hooks/useCompanyLogoUrl";
import { companyFaviconUrl } from "@/lib/companyLogoUrl";
import { formatDisplayLabel } from "@/lib/displayText";
import { cn } from "@/lib/utils";
import { isContactEmailVerifiedStatus } from "@/lib/contactEmailStatus";

type EmailStatusTone = "danger" | "warning" | "success" | "primary" | "muted";

function emailStatusTone(status?: string): EmailStatusTone {
  const s = (status || "").toUpperCase();
  if (isContactEmailVerifiedStatus(status)) return "success";
  if (s === "FOUND") return "primary";
  if (s === "RISKY") return "danger";
  if (s === "UNKNOWN") return "warning";
  return "muted";
}

export function emailStatusLabel(status?: string): string {
  const s = (status || "").toUpperCase();
  if (isContactEmailVerifiedStatus(status)) return "Verified";
  if (s === "FOUND") return "Found";
  if (s === "RISKY") return "Risky";
  if (s === "UNKNOWN") return "Unknown";
  if (!status) return "No email";
  return status;
}

function ContactsGridEmailStatusPill({ status }: { status?: string }) {
  const tone = emailStatusTone(status);
  return (
    <span
      className={cn(
        "c360-contacts-dt__pill c360-shrink-0",
        `c360-contacts-dt__pill--${tone}`,
      )}
    >
      <span className="c360-contacts-dt__pill-dot" aria-hidden />
      {emailStatusLabel(status)}
    </span>
  );
}

export function ContactsGridEmailCellCompact({
  contact,
}: {
  contact: Contact;
}) {
  const email = contact.email?.trim() || "—";
  return (
    <div className="c360-ct-grid-email-cell c360-ct-grid-email-cell--compact">
      <span
        className="c360-contacts-dt__email c360-min-w-0 c360-flex-1 c360-truncate c360-text-xs"
        title={contact.email || undefined}
      >
        {email}
      </span>
      <ContactsGridEmailStatusPill status={contact.emailStatus} />
    </div>
  );
}

export function ContactsGridEmailCellComfortable({
  contact,
}: {
  contact: Contact;
}) {
  const email = contact.email?.trim() || "—";
  return (
    <div className="c360-ct-grid-email-cell">
      <span
        className="c360-contacts-dt__email c360-block c360-min-w-0 c360-truncate c360-text-xs"
        title={contact.email || undefined}
      >
        {email}
      </span>
      <ContactsGridEmailStatusPill status={contact.emailStatus} />
    </div>
  );
}

/** Secondary line under company name (seniority; departments use the Department column). */
export function contactsCompanySubtitle(contact: Contact): string | undefined {
  const seniority = contact.seniority?.trim();
  if (seniority) return formatDisplayLabel(seniority);
  return undefined;
}

function contactCompanyLogoUrl(contact: Contact): string | undefined {
  const direct = contact.companyLogoUrl?.trim();
  if (direct) return direct;
  const fav = companyFaviconUrl({ website: contact.companyWebsite });
  return fav ?? undefined;
}

function ContactsGridCompanyAvatar({ contact }: { contact: Contact }) {
  const fromList = contactCompanyLogoUrl(contact);
  const logoUrl = useCompanyLogoUrl(contact.companyId, fromList);
  return (
    <HiringSignalsCompanyAvatar
      logoUrl={logoUrl}
      companyName={contact.company}
    />
  );
}

function ContactsGridCompanyName({
  contact,
  onOpenCompanyDrawer,
}: {
  contact: Contact;
  onOpenCompanyDrawer?: (contact: Contact) => void;
}) {
  const name = formatDisplayLabel(contact.company);
  const companyId = contact.companyId?.trim();

  if (onOpenCompanyDrawer && companyId) {
    return (
      <button
        type="button"
        className="c360-hs-table__company-link c360-block c360-max-w-full c360-truncate c360-text-left c360-text-sm c360-font-medium c360-text-ink hover:c360-underline"
        title={contact.company || undefined}
        onClick={(e) => {
          e.stopPropagation();
          onOpenCompanyDrawer(contact);
        }}
      >
        {name}
      </button>
    );
  }

  return (
    <span
      className="c360-text-sm c360-font-medium c360-text-ink c360-block c360-max-w-full c360-truncate"
      title={contact.company || undefined}
    >
      {name}
    </span>
  );
}

export function ContactsGridCompanyCellCompact({
  contact,
  onOpenCompanyDrawer,
}: {
  contact: Contact;
  onOpenCompanyDrawer?: (contact: Contact) => void;
}) {
  const companyId = contact.companyId?.trim();
  const name = formatDisplayLabel(contact.company);

  if (onOpenCompanyDrawer && companyId) {
    return (
      <button
        type="button"
        className="c360-hs-table__company-link c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-left c360-text-sm c360-font-medium c360-text-ink hover:c360-underline"
        title={contact.company || undefined}
        onClick={(e) => {
          e.stopPropagation();
          onOpenCompanyDrawer(contact);
        }}
      >
        {name}
      </button>
    );
  }

  return (
    <span
      className="c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-sm c360-font-medium c360-text-ink"
      title={contact.company || undefined}
    >
      {name}
    </span>
  );
}

export function ContactsGridCompanyCellComfortable({
  contact,
  onOpenCompanyDrawer,
}: {
  contact: Contact;
  onOpenCompanyDrawer?: (contact: Contact) => void;
}) {
  const subtitle = contactsCompanySubtitle(contact);

  return (
    <div className="c360-hs-grid-company-cell">
      <ContactsGridCompanyAvatar contact={contact} />
      <div className="c360-min-w-0 c360-flex-1">
        <ContactsGridCompanyName
          contact={contact}
          onOpenCompanyDrawer={onOpenCompanyDrawer}
        />
        {subtitle ? (
          <p className="c360-m-0 c360-mt-0-5 c360-text-xs c360-text-ink-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
