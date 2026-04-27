"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Linkedin,
  Download,
  UserPlus,
  Search,
  Building2,
  Plus,
  Users,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageHeader } from "@/components/patterns/PageHeader";
import { SearchBar } from "@/components/patterns/SearchBar";
import { Input } from "@/components/ui/Input";
import { formatDate, getAvatarUrl } from "@/lib/utils";
import { linkedinService } from "@/services/graphql/linkedinService";
import { useLinkedInSearch } from "@/hooks/useLinkedInSearch";
import { useRole } from "@/context/RoleContext";
import { ROUTES } from "@/lib/routes";
import { FEATURE_GATES } from "@/lib/featureAccess";
import type { LinkedInCompanyRow, LinkedInProfileRow } from "@/types/linkedin";
import { mapLinkedInError } from "@/lib/linkedinValidation";
import { parseOperationError } from "@/lib/errorParser";
import { toast } from "sonner";

export default function LinkedInPage() {
  const { checkAccess, credits, refreshBillingLimits } = useRole();
  const canAccess = checkAccess("linkedin_export");

  const {
    url,
    setUrl,
    urlError,
    setUrlError,
    loading,
    profiles,
    companies,
    lastSearchUrl,
    search,
  } = useLinkedInSearch();

  const [filter, setFilter] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importingCompanyId, setImportingCompanyId] = useState<string | null>(
    null,
  );
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const filtered = profiles.filter(
    (p) =>
      !filter ||
      p.fullName.toLowerCase().includes(filter.toLowerCase()) ||
      p.company.toLowerCase().includes(filter.toLowerCase()),
  );

  const filteredCompanies = companies.filter(
    (c) => !filter || c.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleSearch = async () => {
    setSearchError(null);
    try {
      const r = await search();
      if (!r) return;
      toast.success(
        `Found ${r.totals.totalContacts} contact(s) and ${r.totals.totalCompanies} company(s)`,
      );
    } catch (e) {
      const opErr = parseOperationError(e, "linkedin");
      setSearchError(opErr.userMessage);
      toast.error(opErr.userMessage);
    }
  };

  const handleAddToContacts = async (profile: LinkedInProfileRow) => {
    setImportingId(profile.id);
    try {
      const result = await linkedinService.upsertByLinkedInUrl({
        url: profile.linkedinUrl,
        contactData: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          title: profile.title || null,
        },
        contactMetadata: {
          linkedinUrl: profile.linkedinUrl,
        },
      });
      const u = result.linkedin.upsertByLinkedInUrl;
      if (u.success) {
        toast.success(
          u.created
            ? `${profile.fullName} added to contacts`
            : `${profile.fullName} already exists — updated`,
        );
        void refreshBillingLimits();
      } else {
        toast.error(mapLinkedInError(u.errors?.join("; ") || "Upsert failed"));
      }
    } catch (e) {
      toast.error(mapLinkedInError(e));
    } finally {
      setImportingId(null);
    }
  };

  const handleAddCompany = async (company: LinkedInCompanyRow) => {
    const upsertUrl = company.linkedinUrl || lastSearchUrl || url.trim();
    if (!upsertUrl) {
      toast.error("No LinkedIn URL available for this company.");
      return;
    }
    setImportingCompanyId(company.id);
    try {
      const result = await linkedinService.upsertByLinkedInUrl({
        url: upsertUrl,
        companyData: { name: company.name },
        companyMetadata: { linkedinUrl: company.linkedinUrl || upsertUrl },
      });
      const u = result.linkedin.upsertByLinkedInUrl;
      if (u.success) {
        toast.success(
          u.created
            ? `${company.name} added to companies`
            : `${company.name} updated`,
        );
        void refreshBillingLimits();
      } else {
        toast.error(mapLinkedInError(u.errors?.join("; ") || "Upsert failed"));
      }
    } catch (e) {
      toast.error(mapLinkedInError(e));
    } finally {
      setImportingCompanyId(null);
    }
  };

  const handleBulkAddToContacts = async () => {
    if (selected.length === 0) return;
    setBulkImporting(true);
    setBulkTotal(selected.length);
    setBulkProgress(0);
    let ok = 0;
    let fail = 0;
    try {
      for (let i = 0; i < selected.length; i++) {
        const id = selected[i];
        const profile = profiles.find((p) => p.id === id);
        if (!profile) continue;
        try {
          const result = await linkedinService.upsertByLinkedInUrl({
            url: profile.linkedinUrl,
            contactData: {
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              title: profile.title || null,
            },
            contactMetadata: {
              linkedinUrl: profile.linkedinUrl,
            },
          });
          if (result.linkedin.upsertByLinkedInUrl.success) ok++;
          else fail++;
        } catch {
          fail++;
        }
        setBulkProgress(i + 1);
      }
      toast.success(
        `Imported ${ok} contact(s)${fail > 0 ? `, ${fail} failed` : ""}`,
      );
      setSelected([]);
      void refreshBillingLimits();
    } finally {
      setBulkImporting(false);
      setBulkProgress(0);
      setBulkTotal(0);
    }
  };

  if (!canAccess) {
    return (
      <DashboardPageLayout>
        <PageHeader title="LinkedIn" />
        <Alert variant="warning">
          {FEATURE_GATES.linkedin_export.label} is available on{" "}
          <strong>Professional</strong> and <strong>Enterprise</strong> plans.{" "}
          <Link href={ROUTES.BILLING}>View billing</Link> to upgrade.
        </Alert>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout>
      <PageHeader
        title="LinkedIn"
        actions={
          <>
            <div className="c360-flex-row-wrap c360-items-end c360-gap-2">
              <div className="c360-flex-1-1-260">
                <Input
                  label="LinkedIn URL"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
                  placeholder="https://www.linkedin.com/in/..."
                  leftIcon={<Linkedin size={14} />}
                />
                {urlError && <p className="c360-otp-error">{urlError}</p>}
              </div>
              <Button
                size="sm"
                loading={loading}
                leftIcon={<Search size={14} />}
                onClick={() => void handleSearch()}
              >
                Search
              </Button>
            </div>
            <SearchBar
              value={filter}
              onChange={setFilter}
              placeholder="Filter results..."
            />
            {selected.length > 0 && (
              <Button
                size="sm"
                loading={bulkImporting}
                leftIcon={<UserPlus size={14} />}
                onClick={() => void handleBulkAddToContacts()}
              >
                Add selected to Contacts ({selected.length})
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              disabled
              title="Server export mutation is not available yet. Use Add to Contacts or per-row import."
            >
              Export CSV
            </Button>
          </>
        }
      />

      <p className="c360-text-sm c360-text-muted c360-mb-4">
        Credits remaining: <strong>{credits}</strong> · Each search / import may
        consume credits per your plan.
      </p>

      {searchError && (
        <Alert
          variant="danger"
          title="Search failed"
          className="c360-mb-4"
          onClose={() => setSearchError(null)}
        >
          {searchError}
        </Alert>
      )}

      {(filtered.length > 0 || filteredCompanies.length > 0) && (
        <div className="c360-stat-summary-row c360-mb-4">
          <div className="c360-stat-chip">
            <Users size={14} className="c360-text-primary" />
            <span className="c360-text-sm">
              <strong>{filtered.length}</strong> contact
              {filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="c360-stat-chip">
            <Building2 size={14} className="c360-text-primary" />
            <span className="c360-text-sm">
              <strong>{filteredCompanies.length}</strong> compan
              {filteredCompanies.length !== 1 ? "ies" : "y"}
            </span>
          </div>
        </div>
      )}

      {bulkImporting && bulkTotal > 0 && (
        <div className="c360-mb-4">
          <ProgressBar
            value={Math.round((bulkProgress / bulkTotal) * 100)}
            tone="primary"
            animated={bulkProgress === 0}
            label={`Importing ${bulkProgress} / ${bulkTotal} contacts…`}
            showValue
          />
        </div>
      )}

      {filtered.length === 0 && filteredCompanies.length === 0 && (
        <Card>
          <p className="c360-empty-state">
            {loading
              ? "Searching…"
              : "Enter a LinkedIn URL above and click Search to find contacts and companies."}
          </p>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="c360-mb-6">
          <h2 className="c360-linkedin-section-title">
            Contacts ({filtered.length})
          </h2>
          <div className="c360-result-grid">
            {filtered.map((profile) => (
              <Card key={profile.id} padding="md">
                <div className="c360-linkedin-card-inner">
                  <input
                    type="checkbox"
                    aria-label={`Select ${profile.fullName}`}
                    className="c360-checkbox__input"
                    checked={selected.includes(profile.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, profile.id]
                          : prev.filter((i) => i !== profile.id),
                      )
                    }
                  />
                  <Image
                    src={getAvatarUrl(profile.fullName, 48)}
                    alt=""
                    width={48}
                    height={48}
                    className="c360-linkedin-avatar"
                  />
                  <div className="c360-flex-1">
                    <div className="c360-flex c360-items-center c360-gap-2 c360-mb-0-5">
                      <span className="c360-text-primary c360-font-semibold">
                        {profile.fullName}
                      </span>
                      <Badge
                        color={
                          profile.connectionDegree === 1 ? "green" : "blue"
                        }
                      >
                        {profile.connectionDegree}° connection
                      </Badge>
                    </div>
                    {(profile.title || profile.company) && (
                      <div className="c360-text-sm c360-text-muted">
                        {[profile.title, profile.company]
                          .filter(Boolean)
                          .join(" at ")}
                      </div>
                    )}
                    <div className="c360-text-xs c360-text-light">
                      {profile.location && `${profile.location} · `}Imported{" "}
                      {formatDate(profile.importedAt)}
                    </div>
                  </div>
                  <div className="c360-badge-row">
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Linkedin size={14} />}
                        >
                          View
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      leftIcon={<UserPlus size={14} />}
                      loading={importingId === profile.id}
                      onClick={() => void handleAddToContacts(profile)}
                    >
                      Add to Contacts
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredCompanies.length > 0 && (
        <div>
          <h2 className="c360-linkedin-section-title">
            Companies ({filteredCompanies.length})
          </h2>
          <div className="c360-result-grid">
            {filteredCompanies.map((company) => (
              <Card key={company.id} padding="md">
                <div className="c360-linkedin-card-inner">
                  <div className="c360-linkedin-icon-box">
                    <Building2 size={20} className="c360-text-muted" />
                  </div>
                  <div className="c360-flex-1">
                    <span className="c360-text-primary c360-font-semibold">
                      {company.name}
                    </span>
                  </div>
                  <div className="c360-badge-row">
                    {company.linkedinUrl && (
                      <a
                        href={company.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Linkedin size={14} />}
                        >
                          View on LinkedIn
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      leftIcon={<Plus size={14} />}
                      loading={importingCompanyId === company.id}
                      onClick={() => void handleAddCompany(company)}
                    >
                      Import company
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardPageLayout>
  );
}
