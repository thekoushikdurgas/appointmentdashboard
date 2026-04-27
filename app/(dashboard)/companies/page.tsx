"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Building2,
  ExternalLink,
  Users,
  LayoutGrid,
  List,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { Pagination } from "@/components/patterns/Pagination";
import { cn, formatDate, formatCompact } from "@/lib/utils";
import { parseOperationError } from "@/lib/errorParser";
import { useCompanies } from "@/hooks/useCompanies";
import { useCompanyFilters } from "@/hooks/useCompanyFilters";
import { companiesService } from "@/services/graphql/companiesService";
import { useRole } from "@/context/RoleContext";
import { CompanyExportModal } from "@/components/feature/companies/CompanyExportModal";
import { CompanyImportModal } from "@/components/feature/companies/CompanyImportModal";
import { CompaniesFilterSidebar } from "@/components/feature/companies/CompaniesFilterSidebar";
import { VqlBuilderModal } from "@/components/vql/VqlBuilderModal";
import { SavedSearchesMenu } from "@/components/feature/saved-searches/SavedSearchesMenu";
import {
  SAVED_SEARCH_VERSION,
  type CompanySavedSearchPayload,
} from "@/lib/savedSearchPayload";
import {
  countDraftConditions,
  draftGroupToVqlFilter,
  draftToVqlQueryInput,
  type DraftQuery,
} from "@/lib/vqlDraft";
import type {
  CreateCompanyInput,
  VqlConditionInput,
  VqlFilterInput,
  VqlQueryInput,
} from "@/graphql/generated/types";
import { toast } from "sonner";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";

type ViewMode = "list" | "card";

export default function CompaniesPage() {
  const {
    companies,
    total,
    page,
    setPage,
    search,
    setSearch,
    loading,
    error,
    exportVql,
    refresh,
    applyVqlQuery,
    pageSize,
  } = useCompanies();
  const isDesktop = useIsDesktop();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [facetValues, setFacetValues] = useState<Record<string, string>>({});
  const [vqlOpen, setVqlOpen] = useState(false);
  const [advancedCompanyDraft, setAdvancedCompanyDraft] =
    useState<DraftQuery | null>(null);
  const { sections: filterSections, loadFilterData } = useCompanyFilters();
  const { isSuperAdmin } = useRole();
  const totalPages = Math.ceil(total / pageSize);

  const facetFilter = useMemo((): VqlFilterInput | undefined => {
    const conditions: VqlConditionInput[] = [];
    for (const [key, val] of Object.entries(facetValues)) {
      if (val != null && String(val).trim() !== "") {
        conditions.push({
          field: key,
          operator: "eq",
          value: String(val).trim() as unknown as VqlConditionInput["value"],
        });
      }
    }
    if (conditions.length === 0) return undefined;
    return { conditions };
  }, [facetValues]);

  useEffect(() => {
    const parts: VqlFilterInput[] = [];
    if (facetFilter) parts.push(facetFilter);
    if (advancedCompanyDraft) {
      const g = draftGroupToVqlFilter(
        advancedCompanyDraft.rootGroup,
        "company",
      );
      if (g) parts.push(g);
    }
    const filters: VqlFilterInput | undefined =
      parts.length === 0
        ? undefined
        : parts.length === 1
          ? parts[0]
          : { allOf: parts };
    const extra = advancedCompanyDraft
      ? draftToVqlQueryInput(advancedCompanyDraft, "company")
      : {};
    applyVqlQuery({
      ...extra,
      filters,
    });
  }, [facetFilter, advancedCompanyDraft, applyVqlQuery]);

  /** Same shape as passed to `applyVqlQuery` — used for saved-search payload. */
  const currentCompanyVqlQuery = useMemo((): Partial<VqlQueryInput> => {
    const parts: VqlFilterInput[] = [];
    if (facetFilter) parts.push(facetFilter);
    if (advancedCompanyDraft) {
      const g = draftGroupToVqlFilter(
        advancedCompanyDraft.rootGroup,
        "company",
      );
      if (g) parts.push(g);
    }
    const filters: VqlFilterInput | undefined =
      parts.length === 0
        ? undefined
        : parts.length === 1
          ? parts[0]
          : { allOf: parts };
    const extra = advancedCompanyDraft
      ? draftToVqlQueryInput(advancedCompanyDraft, "company")
      : {};
    return { ...extra, filters };
  }, [facetFilter, advancedCompanyDraft]);

  const advancedVqlRuleCount = advancedCompanyDraft
    ? countDraftConditions(advancedCompanyDraft.rootGroup)
    : 0;

  const toolbarActiveCount = useMemo(() => {
    let n = Object.values(facetValues).filter(
      (v) => v != null && String(v).trim() !== "",
    ).length;
    if (search.trim()) n += 1;
    if (advancedVqlRuleCount > 0) n += 1;
    return n;
  }, [facetValues, search, advancedVqlRuleCount]);

  const hasAdvancedBuilderState = useMemo(() => {
    if (!advancedCompanyDraft) return false;
    return (
      advancedVqlRuleCount > 0 ||
      advancedCompanyDraft.sort.length > 0 ||
      advancedCompanyDraft.selectColumns.length > 0
    );
  }, [advancedCompanyDraft, advancedVqlRuleCount]);

  const handleCompanyVqlApply = useCallback((d: DraftQuery) => {
    setAdvancedCompanyDraft(structuredClone(d));
  }, []);

  const clearCompanyVql = useCallback(() => {
    setAdvancedCompanyDraft(null);
  }, []);

  const getCompanySavedPayload = useCallback((): CompanySavedSearchPayload => {
    return {
      version: SAVED_SEARCH_VERSION,
      vqlQuery: currentCompanyVqlQuery,
      search,
    };
  }, [currentCompanyVqlQuery, search]);

  const handleApplyCompanySaved = useCallback(
    (p: CompanySavedSearchPayload) => {
      setSearch(p.search);
      applyVqlQuery(p.vqlQuery);
    },
    [applyVqlQuery, setSearch],
  );

  const filtersSidebar = useMemo(
    () => (
      <CompaniesFilterSidebar
        search={search}
        onSearchChange={setSearch}
        filterSections={filterSections}
        facetValues={facetValues}
        onFacetChange={(key, val) =>
          setFacetValues((prev) => ({ ...prev, [key]: val }))
        }
        onSectionExpand={loadFilterData}
        advancedVqlRuleCount={advancedVqlRuleCount}
        onClearVql={clearCompanyVql}
        onOpenAdvanced={() => setVqlOpen(true)}
      />
    ),
    [
      search,
      setSearch,
      filterSections,
      facetValues,
      loadFilterData,
      advancedVqlRuleCount,
      clearCompanyVql,
    ],
  );

  type CreateCompanyForm = {
    name: string;
    employeesCount: string;
    industriesCsv: string;
    address: string;
    textSearch: string;
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCompanyForm>({
    name: "",
    employeesCount: "",
    industriesCsv: "",
    address: "",
    textSearch: "",
  });

  const toCreateInput = (): CreateCompanyInput => {
    const industries = createForm.industriesCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      name: createForm.name.trim() || undefined,
      employeesCount: createForm.employeesCount.trim()
        ? Number(createForm.employeesCount)
        : undefined,
      industries: industries.length ? industries : undefined,
      address: createForm.address.trim() || undefined,
      textSearch: createForm.textSearch.trim() || undefined,
    };
  };

  const handleCreateCompany = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      await companiesService.create(toCreateInput());
      toast.success("Company created successfully!");
      setCreateOpen(false);
      setCreateForm({
        name: "",
        employeesCount: "",
        industriesCsv: "",
        address: "",
        textSearch: "",
      });
      refresh?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  const companiesToolbarMeta = (
    <div className="c360-contacts-metadata c360-contacts-metadata--toolbar">
      <div className="c360-contacts-metadata__item">
        <span className="c360-contacts-metadata__label">Total</span>
        <span className="c360-contacts-metadata__value">
          {total.toLocaleString()}
        </span>
      </div>
      <div className="c360-contacts-metadata__item">
        <span className="c360-contacts-metadata__label">On this page</span>
        <span className="c360-contacts-metadata__value">
          {companies.length}
        </span>
      </div>
      <div className="c360-contacts-metadata__item">
        <span className="c360-contacts-metadata__label">Page size</span>
        <span className="c360-contacts-metadata__value">{pageSize}</span>
      </div>
    </div>
  );

  const toolbarEl = (
    <DataToolbar
      cssPrefix="c360-toolbar"
      meta={companiesToolbarMeta}
      viewModes={[
        { value: "list", label: "List", icon: List },
        { value: "card", label: "Card", icon: LayoutGrid },
      ]}
      viewMode={viewMode}
      onViewModeChange={(m) => setViewMode(m as ViewMode)}
      filterConfig={{
        activeCount: toolbarActiveCount,
        onOpen: () => setMobileFiltersOpen(true),
        show: !isDesktop,
      }}
      actionPrefix={
        <SavedSearchesMenu
          entity="company"
          getCompanyPayload={getCompanySavedPayload}
          onApplyCompany={handleApplyCompanySaved}
        />
      }
      actions={[
        {
          label: hasAdvancedBuilderState ? "Edit filters" : "Advanced filter",
          onClick: () => setVqlOpen(true),
          variant: "secondary" as const,
        },
        ...(hasAdvancedBuilderState
          ? [
              {
                label: "Clear advanced",
                onClick: clearCompanyVql,
                variant: "ghost" as const,
              },
            ]
          : []),
        {
          label: "Export",
          onClick: () => setExportOpen(true),
          icon: Download,
          variant: "secondary" as const,
        },
        ...(isSuperAdmin
          ? [
              {
                label: "Import",
                onClick: () => setImportOpen(true),
                icon: Upload,
                variant: "secondary" as const,
              },
            ]
          : []),
        {
          label: "Add company",
          onClick: () => setCreateOpen(true),
          icon: Plus,
          variant: "primary" as const,
        },
      ]}
    />
  );

  return (
    <DataPageLayout
      filters={filtersSidebar}
      toolbar={toolbarEl}
      mobileFiltersOpen={mobileFiltersOpen}
      onMobileFiltersClose={() => setMobileFiltersOpen(false)}
      className="c360-companies-page"
    >
      <CompanyExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        vqlForExport={exportVql}
      />

      <VqlBuilderModal
        open={vqlOpen}
        onClose={() => setVqlOpen(false)}
        onApply={handleCompanyVqlApply}
        entityType="company"
        initialDraft={advancedCompanyDraft ?? undefined}
      />

      {error &&
        (() => {
          const opErr = parseOperationError(error, "companies");
          return (
            <Alert
              variant={
                opErr.isServiceDown
                  ? "danger"
                  : opErr.isPermission
                    ? "warning"
                    : "danger"
              }
              title={
                opErr.isServiceDown
                  ? "Service unavailable"
                  : opErr.isPermission
                    ? "Access denied"
                    : "Failed to load companies"
              }
              className="c360-mb-4"
            >
              {opErr.userMessage}
              <Button
                variant="ghost"
                size="sm"
                className="c360-mt-2"
                disabled={loading}
                leftIcon={
                  <RefreshCw size={13} className={cn(loading && "c360-spin")} />
                }
                onClick={() => void refresh()}
              >
                Retry
              </Button>
            </Alert>
          );
        })()}

      {loading ? (
        <div className="c360-text-center c360-p-12">
          <span className="c360-spinner" />
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <div className="c360-empty-state">No companies found</div>
        </Card>
      ) : viewMode === "card" ? (
        /* Card grid view */
        <>
          <div className="c360-widget-grid">
            {companies.map((company) => (
              <div
                key={company.id}
                className="c360-card c360-flex c360-flex-col"
              >
                <div className="c360-card__body">
                  <div className="c360-company-card-header">
                    <div className="c360-company-icon-box">
                      <Building2 size={20} className="c360-text-primary" />
                    </div>
                    <div className="c360-min-w-0">
                      <Link
                        href={`/companies/${company.id}`}
                        className="c360-company-name-link"
                      >
                        {company.name}
                      </Link>
                      {company.domain && (
                        <div className="c360-text-xs c360-text-muted c360-truncate">
                          {company.domain}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="c360-flex-row-wrap c360-gap-2 c360-mb-3">
                    {company.industry && (
                      <Badge color="blue">{company.industry}</Badge>
                    )}
                    {company.country && (
                      <Badge color="gray">{company.country}</Badge>
                    )}
                  </div>

                  <div className="c360-company-meta">
                    {company.employeeCount ? (
                      <div className="c360-company-meta-row">
                        <Users size={12} />
                        {formatCompact(company.employeeCount)} employees
                      </div>
                    ) : null}
                    <div className="c360-text-xs c360-text-muted">
                      {company.contactCount || 0} contacts · Added{" "}
                      {formatDate(company.createdAt)}
                    </div>
                  </div>

                  <Link href={`/companies/${company.id}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="c360-w-full"
                      rightIcon={<ExternalLink size={12} />}
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="c360-flex c360-justify-end c360-mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={total}
                pageSize={pageSize}
              />
            </div>
          ) : null}
        </>
      ) : (
        /* Table list view */
        <Card padding="none">
          <div className="c360-table-wrapper">
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Size</th>
                  <th>Domain</th>
                  <th>Contacts</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div className="c360-flex c360-items-center c360-gap-3">
                        <div className="c360-company-icon-box c360-company-icon-box--sm">
                          <Building2 size={16} className="c360-text-primary" />
                        </div>
                        <div>
                          <Link
                            href={`/companies/${company.id}`}
                            className="c360-font-medium c360-text-body"
                          >
                            {company.name}
                          </Link>
                          {company.website && (
                            <div className="c360-text-xs c360-text-muted">
                              {company.website}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge color="blue">{company.industry || "—"}</Badge>
                    </td>
                    <td className="c360-text-muted">
                      {company.employeeCount
                        ? formatCompact(company.employeeCount)
                        : "—"}
                    </td>
                    <td className="c360-text-muted">{company.domain || "—"}</td>
                    <td>
                      <div className="c360-flex c360-items-center c360-gap-1">
                        <Users size={14} className="c360-text-muted" />
                        <span className="c360-text-muted">
                          {company.contactCount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="c360-text-muted">
                      {formatDate(company.createdAt)}
                    </td>
                    <td>
                      <Link href={`/companies/${company.id}`}>
                        <Button variant="ghost" size="sm" title="View">
                          <ExternalLink size={14} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="c360-table-footer">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={total}
                pageSize={pageSize}
              />
            </div>
          ) : null}
        </Card>
      )}
      <CompanyImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => void refresh?.()}
      />

      {/* Create Company Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add New Company"
        size="md"
      >
        <div className="c360-section-stack">
          <p className="c360-text-muted c360-text-sm c360-m-0">
            Fields match gateway{" "}
            <code className="c360-text-xs">CreateCompanyInput</code> (no
            separate website/domain/country on the schema — use text search for
            hints).
          </p>
          <Input
            label="Company name *"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, name: e.target.value }))
            }
          />
          <Input
            label="Employee count"
            type="number"
            value={createForm.employeesCount}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, employeesCount: e.target.value }))
            }
            placeholder="e.g. 50"
          />
          <Input
            label="Industries"
            value={createForm.industriesCsv}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, industriesCsv: e.target.value }))
            }
            placeholder="Technology, Finance (comma-separated)"
          />
          <Input
            label="Address"
            value={createForm.address}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, address: e.target.value }))
            }
          />
          <Input
            label="Text search / domain / location hints"
            value={createForm.textSearch}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, textSearch: e.target.value }))
            }
            placeholder="e.g. example.com or San Francisco"
          />
          <div className="c360-modal-actions">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button loading={creating} onClick={handleCreateCompany}>
              Create Company
            </Button>
          </div>
        </div>
      </Modal>
    </DataPageLayout>
  );
}
