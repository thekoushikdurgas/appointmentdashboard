"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
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
import { ROUTES } from "@/lib/routes";

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

export default function ContactDetailPage({ params }: PageProps) {
  const { uuid } = use(params);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    contactsService
      .get(uuid)
      .then((c) => {
        if (!cancelled) setContact(c);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load contact");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid]);

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
    return (
      <DashboardPageLayout>
        {backLink}
        <Card>
          <div className="c360-empty-state">
            {error ?? "Contact not found."}
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

      <div className="c360-contact-detail-page">
        {/* Header card */}
        <Card>
          <div className="c360-contact-detail-header">
            <div className="c360-avatar c360-avatar--lg">{initials}</div>
            <div className="c360-contact-detail-meta">
              <h1 className="c360-page-title">{contact.name}</h1>
              {contact.title && (
                <p className="c360-page-subtitle">{contact.title}</p>
              )}
              {contact.company && (
                <div className="c360-contact-info-row c360-mt-1">
                  <Building2 size={14} />
                  <span>{contact.company}</span>
                </div>
              )}
            </div>
            <div className="c360-contact-detail-actions">
              <Badge
                color={
                  contact.emailStatus === "VALID"
                    ? "green"
                    : contact.emailStatus
                      ? "orange"
                      : "gray"
                }
              >
                {contact.emailStatus ?? "Email unknown"}
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
                label="Phone"
                value={contact.phone}
                href={contact.phone ? `tel:${contact.phone}` : undefined}
              />
              <InfoRow
                icon={<MapPin size={14} />}
                label="Location"
                value={contact.location}
              />
              <InfoRow
                icon={<Linkedin size={14} />}
                label="LinkedIn"
                value={contact.linkedinUrl ? "View Profile" : undefined}
                href={contact.linkedinUrl}
              />
              {!contact.email &&
                !contact.phone &&
                !contact.location &&
                !contact.linkedinUrl && (
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
              {contact.companyId && (
                <div className="c360-detail-row">
                  <span className="c360-section-label">Company ID</span>
                  <Link
                    href={`/companies/${contact.companyId}`}
                    className="c360-link"
                  >
                    {contact.companyId}
                  </Link>
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
    </DashboardPageLayout>
  );
}
