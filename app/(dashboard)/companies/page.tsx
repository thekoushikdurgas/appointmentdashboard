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
  Filter,
} from "lucide-react";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/patterns/PageHeader";
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
  } = useCompanies();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [facetValues, setFacetValues] = useState<Record<string, string>>({});
  const [vqlOpen, setVqlOpen] = useState(false);
  const [advancedCompanyDraft, setAdvancedCompanyDraft] =
    useState<DraftQuery | null>(null);
  const { sections: filterSections, loadFilterData } = useCompanyFilters();
  const { isSuperAdmin } = useRole();

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

  return (
    <DataPageLayout filters={filtersSidebar}>
      <PageHeader
        title="Companies"
        subtitle={`${total.toLocaleString()} companies`}
        actions={
          <>
            <SavedSearchesMenu
              entity="company"
              getCompanyPayload={getCompanySavedPayload}
              onApplyCompany={handleApplyCompanySaved}
            />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Filter size={16} />}
              onClick={() => setVqlOpen(true)}
            >
              {hasAdvancedBuilderState ? "Edit Filters" : "Advanced Filter"}
            </Button>
            {hasAdvancedBuilderState ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompanyVql}
                title="Clear advanced filters"
              >
                ✕ Clear
              </Button>
            ) : null}
            {/* View mode toggle */}
            <div className="c360-view-toggle">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="List view"
                className={cn(
                  "c360-view-toggle__btn",
                  viewMode === "list" && "c360-view-toggle__btn--active",
                )}
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                title="Card view"
                className={cn(
                  "c360-view-toggle__btn",
                  viewMode === "card" && "c360-view-toggle__btn--active",
                )}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={() => setExportOpen(true)}
            >
              Export
            </Button>
            {isSuperAdmin && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload size={16} />}
                onClick={() => setImportOpen(true)}
              >
                Import
              </Button>
            )}
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setCreateOpen(true)}
            >
              Add Company
            </Button>
          </>
        }
      />

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
          <div className="c360-flex c360-justify-end c360-mt-4">
            <Pagination
              page={page}
              totalPages={Math.ceil(total / 25)}
              onPageChange={setPage}
              total={total}
              pageSize={25}
            />
          </div>
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
          <div className="c360-table-footer">
            <Pagination
              page={page}
              totalPages={Math.ceil(total / 25)}
              onPageChange={setPage}
              total={total}
              pageSize={25}
            />
          </div>
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
