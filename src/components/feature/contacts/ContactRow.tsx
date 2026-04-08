"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, Mail, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContactDetailPanel } from "./ContactDetailPanel";
import { cn, formatDate, getAvatarUrl } from "@/lib/utils";
import { contactDetailRoute } from "@/lib/routes";
import type { Contact } from "@/services/graphql/contactsService";

interface ContactRowProps {
  contact: Contact;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

export function ContactRow({
  contact,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: ContactRowProps) {
  return (
    <Fragment>
      <tr className={cn("c360-cursor-pointer", isSelected && "tr--selected")}>
        <td onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} onChange={onSelect} />
        </td>
        <td onClick={onToggleExpand}>
          <div className="c360-flex c360-gap-2 c360-items-center">
            <Image
              src={getAvatarUrl(contact.name, 32)}
              alt=""
              width={32}
              height={32}
              className="c360-contact-avatar"
            />
            <div>
              <div className="c360-font-medium">{contact.name}</div>
              <div className="c360-text-xs c360-text-muted">
                {contact.location}
              </div>
            </div>
            <div className="c360-ml-auto c360-text-muted">
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
        </td>
        <td className="c360-text-muted">{contact.title || "—"}</td>
        <td className="c360-text-muted">{contact.company || "—"}</td>
        <td>
          {contact.email ? (
            <Badge color={contact.emailStatus === "VALID" ? "green" : "orange"}>
              {contact.email}
            </Badge>
          ) : (
            <span className="c360-text-muted">—</span>
          )}
        </td>
        <td className="c360-text-muted">{formatDate(contact.createdAt)}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="c360-badge-row">
            <Button variant="ghost" size="sm" title="Find Email">
              <Mail size={14} />
            </Button>
            <Link href={contactDetailRoute(contact.id)}>
              <Button variant="ghost" size="sm" title="View">
                <ExternalLink size={14} />
              </Button>
            </Link>
          </div>
        </td>
      </tr>

      {isExpanded && <ContactDetailPanel contact={contact} />}
    </Fragment>
  );
}
