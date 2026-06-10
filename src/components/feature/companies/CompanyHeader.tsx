"use client";

import {
  Globe,
  Users,
  MapPin,
  TrendingUp,
  Linkedin,
  Mail,
  ExternalLink,
  Phone,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CompanyLogoThumb } from "@/components/feature/companies/CompanyLogoThumb";
import { formatDisplayLabel } from "@/lib/displayText";
import { formatCompact } from "@/lib/utils";

interface CompanyHeaderProps {
  name: string;
  companyUuid?: string | null;
  description?: string | null;
  industry?: string | null;
  country?: string | null;
  domain?: string | null;
  employeeCount?: number | null;
  website?: string | null;
  linkedinUrl?: string | null;
  linkedinSalesUrl?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  contactCount?: number | null;
  findingEmails: boolean;
  onFindAllEmails: () => void;
  /** Reload company metadata from the server */
  onReload?: () => void;
  reloading?: boolean;
}

export function CompanyHeader({
  name,
  companyUuid,
  description,
  industry,
  country,
  domain,
  employeeCount,
  website,
  linkedinUrl,
  linkedinSalesUrl,
  address,
  phoneNumber,
  contactCount,
  findingEmails,
  onFindAllEmails,
  onReload,
  reloading,
}: CompanyHeaderProps) {
  const details = [
    { icon: <Globe size={16} />, label: "Domain", value: domain },
    {
      icon: <Users size={16} />,
      label: "Employees",
      value: employeeCount ? formatCompact(employeeCount) : null,
    },
    { icon: <Globe size={16} />, label: "Website", value: website },
    { icon: <MapPin size={16} />, label: "Country", value: country },
    address?.trim()
      ? { icon: <MapPin size={16} />, label: "Address", value: address }
      : null,
    phoneNumber?.trim()
      ? { icon: <Phone size={16} />, label: "Phone", value: phoneNumber }
      : null,
    {
      icon: <TrendingUp size={16} />,
      label: "Contacts",
      value: String(contactCount ?? 0),
    },
  ].filter((i): i is NonNullable<typeof i> => Boolean(i?.value));

  return (
    <Card>
      <div className="c360-company-header__identity">
        <div className="c360-company-header__logo">
          <CompanyLogoThumb
            key={companyUuid ?? name}
            company={{
              name,
              website: website ?? undefined,
              domain: domain ?? undefined,
            }}
            size="lg"
          />
        </div>
        <div>
          <h2 className="c360-company-header__name">
            {formatDisplayLabel(name)}
          </h2>
          {description && (
            <p className="c360-text-sm c360-text-muted">{description}</p>
          )}
        </div>
        <div className="c360-badge-row c360-company-header__badges">
          {industry && (
            <Badge color="blue">{formatDisplayLabel(industry)}</Badge>
          )}
          {country && (
            <Badge color="gray">{formatDisplayLabel(country)}</Badge>
          )}
        </div>
      </div>

      <div className="c360-company-header__details">
        {details.map((item) => (
          <div key={item.label} className="c360-company-header__detail-row">
            <span className="c360-text-muted">{item.icon}</span>
            <span className="c360-text-xs c360-text-muted">{item.label}:</span>
            <span className="c360-text-xs c360-fw-medium">{item.value}</span>
          </div>
        ))}
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="c360-company-header__linkedin"
          >
            <Linkedin size={14} /> LinkedIn Profile
          </a>
        )}
        {linkedinSalesUrl && (
          <a
            href={linkedinSalesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="c360-company-header__linkedin"
          >
            <Linkedin size={14} /> Sales Navigator
          </a>
        )}
      </div>

      <div className="c360-section-stack c360-section-stack--sm c360-mt-4">
        {onReload ? (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            loading={reloading}
            onClick={onReload}
            className="c360-w-full"
          >
            Refresh
          </Button>
        ) : null}
        <Button
          size="sm"
          leftIcon={<Mail size={14} />}
          loading={findingEmails}
          onClick={onFindAllEmails}
          className="c360-w-full"
        >
          Find All Emails
        </Button>
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ExternalLink size={12} />}
              className="c360-w-full"
            >
              Visit Website
            </Button>
          </a>
        )}
      </div>
    </Card>
  );
}
