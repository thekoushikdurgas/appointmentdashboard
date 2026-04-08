"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Linkedin, Building2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Contact } from "@/services/graphql/contactsService";
import { emailService } from "@/services/graphql/emailService";

interface ContactDetailPanelProps {
  contact: Contact;
  /** Table column count for expanded row. */
  colSpan?: number;
}

export function ContactDetailPanel({
  contact,
  colSpan = 7,
}: ContactDetailPanelProps) {
  const router = useRouter();
  const [findingEmail, setFindingEmail] = useState(false);

  async function handleFindEmail() {
    const firstName = contact.firstName ?? contact.name.split(" ")[0] ?? "";
    const lastName =
      contact.lastName ?? contact.name.split(" ").slice(1).join(" ") ?? "";
    if (!firstName) {
      toast.error("Contact must have a first name to find email.");
      return;
    }
    setFindingEmail(true);
    try {
      const result = await emailService.findEmails({
        firstName,
        lastName,
        domain: contact.company ?? undefined,
      });
      const emails = result.email.findEmails.emails ?? [];
      if (emails.length > 0) {
        toast.success(`Found email: ${emails[0]}`);
      } else {
        toast.info("No email found for this contact.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to find email.");
    } finally {
      setFindingEmail(false);
    }
  }

  function handleViewProfile() {
    router.push(`/contacts/${contact.id}`);
  }

  return (
    <tr>
      <td colSpan={colSpan} className="c360-contact-detail-expand-cell">
        <div className="c360-contact-detail-grid">
          <div>
            <div className="c360-section-label">Contact Info</div>
            {contact.email && (
              <div className="c360-contact-info-row">
                <Mail size={13} color="var(--c360-primary)" />
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            )}
            {contact.phone && (
              <div className="c360-contact-info-row">
                <Phone size={13} color="var(--c360-text-muted)" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.location && (
              <div className="c360-contact-info-row">
                <MapPin size={13} color="var(--c360-text-muted)" />
                <span>{contact.location}</span>
              </div>
            )}
          </div>

          <div>
            <div className="c360-section-label">Company</div>
            <div className="c360-contact-info-row">
              <Building2 size={13} color="var(--c360-text-muted)" />
              <span>{contact.company || "—"}</span>
            </div>
            <div className="c360-page-subtitle">{contact.title || "—"}</div>
          </div>

          <div>
            <div className="c360-section-label">Social</div>
            {contact.linkedinUrl && (
              <div className="c360-contact-info-row">
                <Linkedin size={13} color="#0077b5" />
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c360-truncate c360-max-w-200"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>

          <div>
            <div className="c360-section-label">Tags</div>
            <div className="c360-flex c360-flex-wrap c360-gap-1">
              {(contact as unknown as { tags?: string[] }).tags?.length ? (
                (contact as unknown as { tags: string[] }).tags.map(
                  (tag: string) => (
                    <Badge key={tag} color="gray" className="c360-text-2xs">
                      <Tag size={10} className="c360-mr-1" />
                      {tag}
                    </Badge>
                  ),
                )
              ) : (
                <span className="c360-page-subtitle">No tags</span>
              )}
            </div>
          </div>

          <div>
            <div className="c360-section-label">Email Status</div>
            <Badge
              color={
                contact.emailStatus === "VALID"
                  ? "green"
                  : contact.emailStatus
                    ? "orange"
                    : "gray"
              }
            >
              {contact.emailStatus || "Unknown"}
            </Badge>
          </div>

          <div className="c360-section-stack c360-section-stack--sm">
            <div className="c360-section-label">Actions</div>
            <Button
              size="sm"
              leftIcon={<Mail size={12} />}
              loading={findingEmail}
              disabled={findingEmail}
              onClick={handleFindEmail}
            >
              Find Email
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              }
              onClick={handleViewProfile}
            >
              View Profile
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}
