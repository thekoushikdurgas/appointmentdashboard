"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Building2,
  Tag,
  Calendar,
  Edit2,
  Globe,
  Briefcase,
  CircleDot,
  Layers,
  Facebook,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/shared/Skeleton";
import {
  contactsService,
  type Contact,
} from "@/services/graphql/contactsService";
import { companiesService } from "@/services/graphql/companiesService";
import { emailStatusLabel } from "@/components/feature/contacts/contactsGridCells";
import { ContactCreateModal } from "@/components/feature/contacts/ContactCreateModal";
import { formatDisplayLabel, formatDisplayLabelList } from "@/lib/displayText";
import { ROUTES } from "@/lib/routes";
import { isContactEmailVerifiedStatus } from "@/lib/contactEmailStatus";
import {
  asRecord,
  fetchEnrichedCompany,
} from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";
import { readStashedContactRow } from "@/lib/rowSession";
import { sanitizeUserFacingMessage } from "@/lib/linkedinValidation";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="c360-contact-info-row">
      <span className="c360-contact-info-icon">{icon}</span>
      <div className="c360-contact-info-content">
        <span className="c360-section-label">{label}</span>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ) : (
          <span>{value}</span>
        )}
      </div>
    </div>
  );
}

function isContactNotFoundMessage(message: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    message.includes("ERR_CONTACT_NOT_FOUND") ||
    m.includes("contact not found") ||
    m.includes("not found")
  );
}

export default function ContactDetailPage({ params }: PageProps) {
  const { uuid } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromListSnapshot, setFromListSnapshot] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const companyRedirectAttempted = useRef(false);

  const fetchContact = useCallback(async () => {
    setError(null);
    const stashedEarly = readStashedContactRow(uuid);
    if (stashedEarly) {
      setContact(stashedEarly);
      setFromListSnapshot(true);
      setLoading(false);
    } else {
      setLoading(true);
      setFromListSnapshot(false);
    }

    const applyLoadedContact = (c: Contact) => {
      setContact(c);
      setFromListSnapshot(false);
    };

    try {
      const c = await contactsService.get(uuid, {
        showToastOnError: false,
        notFoundReturnsNull: true,
        listHint: stashedEarly ?? undefined,
      });
      if (c) {
        applyLoadedContact(c);
        return;
      }

      if (!stashedEarly && !companyRedirectAttempted.current) {
        companyRedirectAttempted.current = true;
        let redirected = false;
        try {
          const rec = await fetchEnrichedCompany(uuid);
          const rr = asRecord(rec.hireSignal?.connectraCompany);
          if (rr && rr.success !== false && rr.data) {
            redirected = true;
          }
        } catch {
          /* not a company via enriched profile lookup */
        }
        if (!redirected) {
          const company = await companiesService.get(uuid, {
            showToastOnError: false,
            notFoundReturnsNull: true,
          });
          if (company) {
            redirected = true;
          }
        }
        if (redirected) {
          toast.info(
            "That link is a company record. Opening the company page.",
          );
          router.replace(`/companies/${encodeURIComponent(uuid)}`);
          return;
        }
      }
      const stashed = readStashedContactRow(uuid);
      if (stashed) {
        setContact(stashed);
        setFromListSnapshot(true);
        return;
      }
      setError(
        `Contact with identifier '${uuid}' was not found in Contact360.`,
      );
      setContact(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load contact";
      setError(sanitizeUserFacingMessage(msg));
      setContact(null);
    } finally {
      setLoading(false);
    }
  }, [uuid, router]);

  useEffect(() => {
    void fetchContact();
  }, [fetchContact]);

  const backLink = (
    <Link href={ROUTES.CONTACTS} className="c360-back-link c360-mb-4">
      <ArrowLeft size={16} /> Back to Contacts
    </Link>
  );

  if (loading) {
    return (
      <DashboardPageLayout>
        {backLink}
        <div className="c360-contact-detail-page">
          <Skeleton height={240} />
          <Skeleton height={320} />
        </div>
      </DashboardPageLayout>
    );
  }

  if (error || !contact) {
    const notFound = isContactNotFoundMessage(error);
    return (
      <DashboardPageLayout>
        {backLink}
        <Card>
          <div className="c360-empty-state c360-section-stack">
            <p>
              {notFound
                ? "This contact no longer exists or was removed."
                : (error ?? "Contact not found.")}
            </p>
            {!notFound && error ? (
              <Button onClick={() => void fetchContact()}>Retry</Button>
            ) : null}
          </div>
        </Card>
      </DashboardPageLayout>
    );
  }

  const initials =
    [contact.firstName?.[0], contact.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    contact.name[0]?.toUpperCase() ||
    "?";

  return (
    <DashboardPageLayout>
      {backLink}
      {fromListSnapshot ? (
        <p className="c360-mb-4 c360-text-sm c360-text-muted">
          Showing data from your contacts list. Live profile refresh is
          temporarily unavailable for this record.
        </p>
      ) : null}

      <div className="c360-contact-detail-page">
        {/* Header card */}
        <Card>
          <div className="c360-contact-detail-header">
            <div className="c360-avatar c360-avatar--lg">{initials}</div>
            <div className="c360-contact-detail-meta">
              <h1 className="c360-page-title">
                {formatDisplayLabel(contact.name)}
              </h1>
              {contact.title && (
                <p className="c360-page-subtitle">
                  {formatDisplayLabel(contact.title)}
                </p>
              )}
              {contact.company && (
                <div className="c360-contact-info-row c360-mt-1">
                  <Building2 size={14} />
                  {contact.companyId ? (
                    <Link
                      href={`/companies/${contact.companyId}`}
                      className="c360-link"
                    >
                      {formatDisplayLabel(contact.company)}
                    </Link>
                  ) : (
                    <span>{formatDisplayLabel(contact.company)}</span>
                  )}
                </div>
              )}
            </div>
            <div className="c360-contact-detail-actions c360-flex c360-gap-2 c360-items-center">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit2 size={14} />}
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
              <Badge
                color={
                  isContactEmailVerifiedStatus(contact.emailStatus)
                    ? "green"
                    : contact.emailStatus
                      ? "orange"
                      : "gray"
                }
              >
                {emailStatusLabel(contact.emailStatus)}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Info grid */}
        <div className="c360-contact-detail-grid-2">
          {/* Contact information */}
          <Card title="Contact Information">
            <div className="c360-section-stack">
              <InfoRow
                icon={<Mail size={14} />}
                label="Email"
                value={contact.email}
                href={contact.email ? `mailto:${contact.email}` : undefined}
              />
              <InfoRow
                icon={<Phone size={14} />}
                label="Mobile"
                value={contact.phone}
                href={contact.phone ? `tel:${contact.phone}` : undefined}
              />
              <InfoRow
                icon={<Phone size={14} />}
                label="Work direct"
                value={contact.workDirectPhone}
                href={
                  contact.workDirectPhone
                    ? `tel:${contact.workDirectPhone}`
                    : undefined
                }
              />
              <InfoRow
                icon={<Phone size={14} />}
                label="Home"
                value={contact.homePhone}
                href={
                  contact.homePhone ? `tel:${contact.homePhone}` : undefined
                }
              />
              <InfoRow
                icon={<Phone size={14} />}
                label="Other phone"
                value={contact.otherPhone}
                href={
                  contact.otherPhone ? `tel:${contact.otherPhone}` : undefined
                }
              />
              <InfoRow
                icon={<MapPin size={14} />}
                label="Location"
                value={formatDisplayLabel(contact.location)}
              />
              <InfoRow
                icon={<Linkedin size={14} />}
                label="LinkedIn"
                value={contact.linkedinUrl ? "View Profile" : undefined}
                href={contact.linkedinUrl}
              />
              <InfoRow
                icon={<Linkedin size={14} />}
                label="LinkedIn Sales"
                value={
                  contact.linkedinSalesUrl ? "Open Sales Navigator" : undefined
                }
                href={contact.linkedinSalesUrl}
              />
              <InfoRow
                icon={<Globe size={14} />}
                label="Website"
                value={contact.website}
                href={
                  contact.website?.startsWith("http")
                    ? contact.website
                    : contact.website
                      ? `https://${contact.website}`
                      : undefined
                }
              />
              <InfoRow
                icon={<Facebook size={14} />}
                label="Facebook"
                value={contact.facebookUrl ? "Profile" : undefined}
                href={contact.facebookUrl}
              />
              <InfoRow
                icon={<Globe size={14} />}
                label="Twitter / X"
                value={contact.twitterUrl ? "Profile" : undefined}
                href={contact.twitterUrl}
              />
              {!contact.email &&
                !contact.phone &&
                !contact.workDirectPhone &&
                !contact.homePhone &&
                !contact.otherPhone &&
                !contact.location &&
                !contact.linkedinUrl &&
                !contact.linkedinSalesUrl &&
                !contact.website &&
                !contact.facebookUrl &&
                !contact.twitterUrl && (
                  <p className="c360-page-subtitle">
                    No contact details available.
                  </p>
                )}
            </div>
          </Card>

          {/* Metadata */}
          <Card title="Details">
            <div className="c360-section-stack">
              <div className="c360-detail-row">
                <span className="c360-section-label">UUID</span>
                <code className="c360-code-inline">{contact.id}</code>
              </div>
              {contact.seniority && (
                <div className="c360-detail-row">
                  <span className="c360-section-label">
                    <Briefcase size={12} /> Seniority
                  </span>
                  <span>{formatDisplayLabel(contact.seniority)}</span>
                </div>
              )}
              {contact.stage && (
                <div className="c360-detail-row">
                  <span className="c360-section-label">
                    <CircleDot size={12} /> Stage
                  </span>
                  <span>{formatDisplayLabel(contact.stage)}</span>
                </div>
              )}
              {contact.departments && contact.departments.length > 0 && (
                <div className="c360-detail-row">
                  <span className="c360-section-label">
                    <Layers size={12} /> Departments
                  </span>
                  <span>{formatDisplayLabelList(contact.departments)}</span>
                </div>
              )}
              <div className="c360-detail-row">
                <span className="c360-section-label">
                  <Calendar size={12} /> Created
                </span>
                <span>
                  {contact.createdAt
                    ? new Date(contact.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="c360-detail-row">
                <span className="c360-section-label">
                  <Edit2 size={12} /> Updated
                </span>
                <span>
                  {contact.updatedAt
                    ? new Date(contact.updatedAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Tags */}
          <Card title="Tags">
            <div className="c360-badge-row">
              {(contact as unknown as { tags?: string[] }).tags?.length ? (
                (contact as unknown as { tags: string[] }).tags.map((tag) => (
                  <Badge key={tag} color="gray">
                    <Tag size={11} />
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="c360-page-subtitle">No tags assigned.</span>
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <Card title="Actions">
            <div className="c360-section-stack">
              {contact.email && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Mail size={13} />}
                  onClick={() => window.open(`mailto:${contact.email}`)}
                >
                  Send Email
                </Button>
              )}
              {contact.linkedinUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Linkedin size={13} />}
                  onClick={() => window.open(contact.linkedinUrl, "_blank")}
                >
                  Open LinkedIn
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ContactCreateModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onCreated={() => void fetchContact()}
        editContact={contact}
      />
    </DashboardPageLayout>
  );
}
