"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Mail, Zap } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/shared/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { emailService } from "@/services/graphql/emailService";
import { toast } from "sonner";
import { CompanyHeader } from "@/components/feature/companies/CompanyHeader";
import { CompanyContactsTable } from "@/components/feature/companies/CompanyContactsTable";
import { CompanyFindEmailsPanel } from "@/components/feature/companies/CompanyFindEmailsPanel";
import { CompanyHiringTab } from "@/components/feature/companies/CompanyHiringTab";
import { useCompanyHiringSignals } from "@/hooks/useCompanyHiringSignals";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";
import { useRole } from "@/context/RoleContext";

const CONTACTS_PAGE_SIZE = 20;

interface PageProps {
  params: Promise<{ id: string }>;
}

function isCompanyNotFoundMessage(message: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    message.includes("ERR_COMPANY_NOT_FOUND") ||
    m.includes("company not found") ||
    m.includes("not found")
  );
}

export default function CompanyDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { isPro, isAdmin } = useRole();
  const showHiringTab = isPro() || isAdmin;
  const {
    company,
    loading,
    error,
    refreshing,
    contacts,
    contactsTotal,
    contactsPage,
    contactsLoading,
    contactsError,
    setContactsPage,
    reload,
  } = useCompanyDetail(id);

  const hiringSignals = useCompanyHiringSignals(
    showHiringTab && company?.id ? company.id : undefined,
  );

  const [findingEmails, setFindingEmails] = useState(false);
  const [foundEmails, setFoundEmails] = useState<
    Array<{ email: string; status: string }>
  >([]);

  const handleFindAllEmails = async () => {
    if (!company?.domain) {
      toast.error("Company has no domain set");
      return;
    }
    setFindingEmails(true);
    try {
      const result = await emailService.findEmails({
        firstName: "",
        lastName: "",
        domain: company.domain,
      });
      const emails = result.email?.findEmails?.emails ?? [];
      setFoundEmails(
        emails.map((e: { email: string; status?: string | null }) => ({
          email: e.email,
          status: e.status ?? "unknown",
        })),
      );
      toast.success(`Found ${emails.length} emails for ${company.domain}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Email search failed");
    } finally {
      setFindingEmails(false);
    }
  };

  if (loading) {
    return (
      <DashboardPageLayout>
        <div className="c360-company-detail-grid">
          <Skeleton height={400} />
          <Skeleton height={400} />
        </div>
      </DashboardPageLayout>
    );
  }

  if (!company) {
    const notFound = isCompanyNotFoundMessage(error);
    return (
      <DashboardPageLayout>
        <Link href="/companies" className="c360-back-link c360-mb-4">
          <ArrowLeft size={16} /> Back to Companies
        </Link>
        <Card>
          <div className="c360-empty-state c360-section-stack">
            <p>
              {notFound
                ? "This company no longer exists or was removed."
                : (error ?? "Company not found.")}
            </p>
            {!notFound ? (
              <Button
                variant="secondary"
                onClick={() => void reload()}
                loading={refreshing}
              >
                Retry
              </Button>
            ) : null}
          </div>
        </Card>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout>
      <Link href="/companies" className="c360-back-link c360-mb-4">
        <ArrowLeft size={16} /> Back to Companies
      </Link>

      <CompanyHeader
        name={company.name}
        companyUuid={company.id}
        description={company.description}
        industry={company.industry}
        country={company.country}
        domain={company.domain}
        employeeCount={company.employeeCount}
        website={company.website}
        linkedinUrl={company.linkedinUrl}
        linkedinSalesUrl={company.linkedinSalesUrl}
        address={company.address}
        phoneNumber={company.phoneNumber}
        contactCount={contactsTotal}
        findingEmails={findingEmails}
        onFindAllEmails={handleFindAllEmails}
        onReload={() => void reload()}
        reloading={refreshing}
      />

      <Tabs
        defaultValue="overview"
        variant="floating"
        className="c360-tabs--company-detail"
      >
        <TabsList>
          <TabsTrigger value="overview" icon={<Building2 size={16} />}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="contacts" icon={<Mail size={16} />}>
            Contacts
          </TabsTrigger>
          {showHiringTab ? (
            <TabsTrigger value="hiring" icon={<Zap size={16} />}>
              Hiring signals
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="overview">
          <div className="c360-section-stack">
            <Card title="Company details">
              <div className="c360-section-stack">
                {company.description && (
                  <p className="c360-text-sm c360-text-muted">
                    {company.description}
                  </p>
                )}
                <div className="c360-detail-row">
                  <span className="c360-section-label">UUID</span>
                  <span className="c360-text-xs c360-break-all">
                    {company.id || "—"}
                  </span>
                </div>
                <div className="c360-detail-row">
                  <span className="c360-section-label">Industry</span>
                  <span>{company.industry || "—"}</span>
                </div>
                {company.industries && company.industries.length > 1 ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Industries</span>
                    <span>{company.industries.join(", ")}</span>
                  </div>
                ) : null}
                <div className="c360-detail-row">
                  <span className="c360-section-label">Domain</span>
                  <span>{company.domain || "—"}</span>
                </div>
                <div className="c360-detail-row">
                  <span className="c360-section-label">Website</span>
                  {company.website ? (
                    <a
                      href={
                        company.website.startsWith("http")
                          ? company.website
                          : `https://${company.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c360-link"
                    >
                      {company.website}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="c360-detail-row">
                  <span className="c360-section-label">Location</span>
                  <span>{company.location || "—"}</span>
                </div>
                <div className="c360-detail-row">
                  <span className="c360-section-label">Country</span>
                  <span>{company.country || "—"}</span>
                </div>
                {company.address?.trim() ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Address</span>
                    <span>{company.address}</span>
                  </div>
                ) : null}
                {company.phoneNumber?.trim() ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Phone</span>
                    <span>{company.phoneNumber}</span>
                  </div>
                ) : null}
                {company.employeeCount != null && company.employeeCount > 0 ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Employees</span>
                    <span>{company.employeeCount.toLocaleString()}</span>
                  </div>
                ) : null}
                {company.keywords?.length ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Keywords</span>
                    <span>{company.keywords.join(", ")}</span>
                  </div>
                ) : null}
                {company.technologies?.length ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Technologies</span>
                    <span>{company.technologies.join(", ")}</span>
                  </div>
                ) : null}
                {company.companyNameForEmails?.trim() ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Name for emails</span>
                    <span>{company.companyNameForEmails}</span>
                  </div>
                ) : null}
                {company.annualRevenue != null && company.annualRevenue > 0 ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Annual revenue</span>
                    <span>
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(company.annualRevenue)}
                    </span>
                  </div>
                ) : null}
                {company.totalFunding != null && company.totalFunding > 0 ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Total funding</span>
                    <span>
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(company.totalFunding)}
                    </span>
                  </div>
                ) : null}
                {company.latestFunding?.trim() ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Latest funding</span>
                    <span>{company.latestFunding}</span>
                  </div>
                ) : null}
                {company.latestFundingAmount != null &&
                company.latestFundingAmount > 0 ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">
                      Latest funding amount
                    </span>
                    <span>
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(company.latestFundingAmount)}
                    </span>
                  </div>
                ) : null}
                {company.lastRaisedAt?.trim() ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Last raised</span>
                    <span>{company.lastRaisedAt}</span>
                  </div>
                ) : null}
                {company.linkedinUrl ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">LinkedIn</span>
                    <a
                      href={company.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c360-link"
                    >
                      Profile
                    </a>
                  </div>
                ) : null}
                {company.linkedinSalesUrl ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Sales Nav</span>
                    <a
                      href={company.linkedinSalesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c360-link"
                    >
                      Open
                    </a>
                  </div>
                ) : null}
                {company.facebookUrl ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Facebook</span>
                    <a
                      href={company.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c360-link"
                    >
                      Open
                    </a>
                  </div>
                ) : null}
                {company.twitterUrl ? (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Twitter / X</span>
                    <a
                      href={company.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c360-link"
                    >
                      Open
                    </a>
                  </div>
                ) : null}
                <div className="c360-detail-row">
                  <span className="c360-section-label">Created</span>
                  <span>
                    {company.createdAt
                      ? new Date(company.createdAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="c360-detail-row">
                  <span className="c360-section-label">Updated</span>
                  <span>
                    {company.updatedAt
                      ? new Date(company.updatedAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </div>
            </Card>

            <CompanyFindEmailsPanel
              domain={company.domain ?? ""}
              emails={foundEmails}
            />
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="c360-section-stack">
            <CompanyContactsTable
              companyName={company.name}
              contacts={contacts}
              loading={contactsLoading}
              error={contactsError}
              page={contactsPage}
              total={contactsTotal}
              pageSize={CONTACTS_PAGE_SIZE}
              onPageChange={setContactsPage}
            />
          </div>
        </TabsContent>

        {showHiringTab ? (
          <TabsContent value="hiring">
            {hiringSignals.error ? (
              <p
                className="c360-text-sm c360-text-danger c360-mb-4"
                role="alert"
              >
                {hiringSignals.error}
              </p>
            ) : null}
            <CompanyHiringTab
              jobs={hiringSignals.jobs}
              loading={hiringSignals.loading}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </DashboardPageLayout>
  );
}
