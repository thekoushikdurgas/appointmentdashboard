"use client";

import Image from "next/image";
import { Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, getAvatarUrl } from "@/lib/utils";

interface CompanyContact {
  id: string;
  name: string;
  title?: string | null;
  email?: string | null;
  emailStatus?: string | null;
  createdAt: string;
}

interface CompanyContactsTableProps {
  companyName: string;
  contactCount?: number | null;
  contacts: CompanyContact[];
}

export function CompanyContactsTable({
  companyName,
  contactCount,
  contacts,
}: CompanyContactsTableProps) {
  return (
    <Card
      title="Contacts"
      subtitle={`People at ${companyName}`}
      actions={<Badge color="gray">{contactCount ?? 0}</Badge>}
    >
      <div className="c360-table-wrapper">
        <table className="c360-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Email</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="c360-table__empty">
                  No contacts yet
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <div className="c360-table-cell--avatar">
                      <Image
                        src={getAvatarUrl(contact.name, 28)}
                        alt=""
                        width={28}
                        height={28}
                        className="c360-avatar c360-avatar--sm"
                      />
                      <span className="c360-fw-medium">{contact.name}</span>
                    </div>
                  </td>
                  <td className="c360-text-muted">{contact.title}</td>
                  <td>
                    {contact.email ? (
                      <Badge
                        color={
                          contact.emailStatus === "VALID" ? "green" : "orange"
                        }
                      >
                        {contact.email}
                      </Badge>
                    ) : (
                      <Button variant="ghost" size="sm">
                        <Mail size={12} /> Find
                      </Button>
                    )}
                  </td>
                  <td className="c360-text-muted">
                    {formatDate(contact.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
