"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Mail } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/shared/Skeleton";
import { Pagination } from "@/components/patterns/Pagination";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { emailService } from "@/services/graphql/emailService";
import { toast } from "sonner";
import { CompanyHeader } from "@/components/feature/companies/CompanyHeader";
import { CompanyContactsTable } from "@/components/feature/companies/CompanyContactsTable";
import { CompanyFindEmailsPanel } from "@/components/feature/companies/CompanyFindEmailsPanel";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";

const CONTACTS_PAGE_SIZE = 20;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const {
    company,
    loading,
    error,
    contacts,
    contactsTotal,
    contactsPage,
    contactsLoading,
    setContactsPage,
  } = useCompanyDetail(id);

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
    return (
      <DashboardPageLayout>
        <Link href="/companies" className="c360-back-link c360-mb-4">
          <ArrowLeft size={16} /> Back to Companies
        </Link>
        <Card>
          <div className="c360-empty-state">
            {error ?? "Company not found."}
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
        description={company.description}
        industry={company.industry}
        country={company.country}
        domain={company.domain}
        employeeCount={company.employeeCount}
        website={company.website}
        linkedinUrl={company.linkedinUrl}
        contactCount={contactsTotal}
        findingEmails={findingEmails}
        onFindAllEmails={handleFindAllEmails}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" icon={<Building2 size={14} />}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" icon={<Mail size={14} />}>
            Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="c360-section-stack c360-mt-4">
            <Card title="Company details">
              <div className="c360-section-stack">
                {company.description && (
                  <p className="c360-text-sm c360-text-muted">
                    {company.description}
                  </p>
                )}
                <div className="c360-detail-row">
                  <span className="c360-section-label">Industry</span>
                  <span>{company.industry || "—"}</span>
                </div>
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
                  <span className="c360-section-label">Country</span>
                  <span>{company.country || "—"}</span>
                </div>
                {company.employeeCount && (
                  <div className="c360-detail-row">
                    <span className="c360-section-label">Employees</span>
                    <span>{company.employeeCount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </Card>

            <CompanyFindEmailsPanel
              domain={company.domain ?? ""}
              emails={foundEmails}
            />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="c360-section-stack c360-mt-4">
            {contactsLoading ? (
              <Card title="Contacts">
                <div className="c360-text-center c360-p-6">
                  <span className="c360-spinner" />
                </div>
              </Card>
            ) : (
              <>
                <CompanyContactsTable
                  companyName={company.name}
                  contactCount={contactsTotal}
                  contacts={contacts}
                />
                {contactsTotal > CONTACTS_PAGE_SIZE && (
                  <div className="c360-flex c360-justify-end">
                    <Pagination
                      page={contactsPage}
                      total={contactsTotal}
                      pageSize={CONTACTS_PAGE_SIZE}
                      onPageChange={setContactsPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardPageLayout>
  );
}
