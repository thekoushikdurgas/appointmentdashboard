"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  ExternalLink,
  Users,
  Download,
  Upload,
  RefreshCw,
  Trash2,
} from "lucide-react";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { cn, formatDate, formatCompact } from "@/lib/utils";
import { parseOperationError } from "@/lib/errorParser";
import { useCompanies } from "@/hooks/useCompanies";
import { useCompanyFilters } from "@/hooks/useCompanyFilters";
import { companiesService } from "@/services/graphql/companiesService";
import { useRole } from "@/context/RoleContext";
import { CompanyExportModal } from "@/components/feature/companies/CompanyExportModal";
import { CompanyImportModal } from "@/components/feature/companies/CompanyImportModal";
import { CompanyCreateModal } from "@/components/feature/companies/CompanyCreateModal";
import { CompaniesFilterSidebar } from "@/components/feature/companies/CompaniesFilterSidebar";
import { CompaniesDataTable } from "@/components/feature/companies/CompaniesDataTable";
import { CompanyLogoThumb } from "@/components/feature/companies/CompanyLogoThumb";
import {
  COMPANIES_DT_COLUMN_IDS,
  COMPANIES_DT_DEFAULT_COLUMNS,
  COMPANIES_DT_PAGE_SIZE_OPTIONS,
  type CompaniesDataTableColumnId,
} from "@/components/feature/companies/companiesTableModel";
import { CompanyPagination } from "@/components/feature/companies/CompanyPagination";
import { VqlBuilderModal } from "@/components/vql/VqlBuilderModal";
import { SavedSearchesMenu } from "@/components/feature/saved-searches/SavedSearchesMenu";
import {
  SAVED_SEARCH_VERSION,
  SAVED_SEARCH_VERSION_SIDEBAR,
  type CompanySavedSearchPayload,
} from "@/lib/savedSearchPayload";
import {
  countDraftConditions,
  draftGroupToVqlFilter,
  draftToVqlQueryInput,
  type DraftQuery,
} from "@/lib/vqlDraft";
import type {
  VqlConditionInput,
  VqlFilterInput,
  VqlQueryInput,
} from "@/graphql/generated/types";
import { toast } from "sonner";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import { Skeleton } from "@/components/shared/Skeleton";
import {
  tryLocalStorageGet,
  tryLocalStorageSetJSON,
} from "@/lib/safeLocalStorage";

type ViewMode = "list" | "card";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name A→Z",
  name_desc: "Name Z→A",
};

const VISIBLE_COLUMNS_STORAGE_KEY = "c360:companies:visibleColumns:v1";

function loadVisibleColumns(): CompaniesDataTableColumnId[] {
  const raw = tryLocalStorageGet(VISIBLE_COLUMNS_STORAGE_KEY);
  if (!raw) return [...COMPANIES_DT_DEFAULT_COLUMNS];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...COMPANIES_DT_DEFAULT_COLUMNS];
    const ordered = COMPANIES_DT_COLUMN_IDS.filter((id) => parsed.includes(id));
    return ordered.length > 0 ? ordered : [...COMPANIES_DT_DEFAULT_COLUMNS];
  } catch {
    return [...COMPANIES_DT_DEFAULT_COLUMNS];
  }
}

/** Migrate legacy saved searches where each facet was a single string. */
function normalizeCompanyFacetValues(
  raw: Record<string, unknown>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) {
      out[k] = v.map((x) => String(x).trim()).filter(Boolean);
    } else if (v != null && String(v).trim() !== "") {
      out[k] = [String(v).trim()];
    } else {
      out[k] = [];
    }
  }
  return out;
}

export default function CompaniesPage() {
  const {
    companies,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    search,
    setSearch,
    loading,
    error,
    exportVql,
    refresh,
    applyVqlQuery,
  } = useCompanies();
  const isDesktop = useIsDesktop();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [tableDensity, setTableDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [facetValues, setFacetValues] = useState<Record<string, string[]>>({});
  const [vqlOpen, setVqlOpen] = useState(false);
  const [advancedCompanyDraft, setAdvancedCompanyDraft] =
    useState<DraftQuery | null>(null);
  const {
    sections: filterSections,
    filtersLoading,
    loadFilterData,
    loadMoreFilterData,
    setFilterSearch,
    refetchFiltersMetadata,
  } = useCompanyFilters();

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d296a1",
      },
      body: JSON.stringify({
        sessionId: "d296a1",
        location: "companies/page.tsx:filterSections",
        message: "companies page filter state",
        data: {
          filterSectionsCount: filterSections.length,
          filtersLoading,
          sectionTitles: filterSections.slice(0, 8).map((s) => s.displayName),
        },
        timestamp: Date.now(),
        hypothesisId: "D",
      }),
    }).catch(() => {});
  }, [filterSections.length, filtersLoading]);
  // #endregion
  const { isSuperAdmin } = useRole();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [filtersRefreshing, setFiltersRefreshing] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<
    CompaniesDataTableColumnId[]
  >(() => [...COMPANIES_DT_DEFAULT_COLUMNS]);

  useEffect(() => {
    setVisibleColumns(loadVisibleColumns());
  }, []);

  useEffect(() => {
    if (isDesktop) setMobileFiltersOpen(false);
  }, [isDesktop]);

  const handleFacetChange = useCallback((key: string, values: string[]) => {
    setFacetValues((prev) => ({ ...prev, [key]: values }));
  }, []);

  const facetFilter = useMemo((): VqlFilterInput | undefined => {
    const conditions: VqlConditionInput[] = [];
    for (const [key, vals] of Object.entries(facetValues)) {
      const trimmed = vals.map((v) => String(v).trim()).filter(Boolean);
      if (trimmed.length === 0) continue;
      if (trimmed.length === 1) {
        conditions.push({
          field: key,
          operator: "eq",
          value: trimmed[0] as unknown as VqlConditionInput["value"],
        });
      } else {
        conditions.push({
          field: key,
          operator: "in",
          value: trimmed as unknown as VqlConditionInput["value"],
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

  const mergedPreviewQuery = useMemo((): Partial<VqlQueryInput> => {
    const offset = (page - 1) * pageSize;
    return {
      ...currentCompanyVqlQuery,
      limit: pageSize,
      offset,
      searchAfter: undefined,
    };
  }, [currentCompanyVqlQuery, page, pageSize]);

  const tableErrorMessage = useMemo(() => {
    if (!error) return null;
    return parseOperationError(error, "companies").userMessage;
  }, [error]);

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

  const hiddenColumnCount = COMPANIES_DT_COLUMN_IDS.filter(
    (id) => !visibleColumns.includes(id),
  ).length;

  const sortChipLabel =
    sortBy !== "newest" ? `Sort: ${SORT_LABELS[sortBy] ?? sortBy}` : null;

  const toolbarActiveCount = useMemo(() => {
    let n = Object.values(facetValues).filter((arr) => arr?.length > 0).length;
    if (search.trim()) n += 1;
    if (advancedVqlRuleCount > 0) n += 1;
    if (sortBy !== "newest") n += 1;
    if (hiddenColumnCount > 0) n += 1;
    return n;
  }, [facetValues, search, advancedVqlRuleCount, sortBy, hiddenColumnCount]);

  const toggleColumn = useCallback((id: CompaniesDataTableColumnId) => {
    setVisibleColumns((prev) => {
      let next: CompaniesDataTableColumnId[];
      if (prev.includes(id)) {
        next = prev.filter((c) => c !== id);
        if (next.length === 0) return prev;
      } else {
        next = [...prev, id];
      }
      const ordered = COMPANIES_DT_COLUMN_IDS.filter((col) =>
        next.includes(col),
      );
      tryLocalStorageSetJSON(VISIBLE_COLUMNS_STORAGE_KEY, ordered);
      return ordered;
    });
  }, []);

  const resetVisibleColumns = useCallback(() => {
    const next = [...COMPANIES_DT_DEFAULT_COLUMNS];
    setVisibleColumns(next);
    tryLocalStorageSetJSON(VISIBLE_COLUMNS_STORAGE_KEY, next);
  }, []);

  const handleVisibleColumnsResolved = useCallback(
    (next: CompaniesDataTableColumnId[]) => {
      setVisibleColumns(next);
      tryLocalStorageSetJSON(VISIBLE_COLUMNS_STORAGE_KEY, next);
    },
    [],
  );

  const handleRefreshFilters = useCallback(async () => {
    setFiltersRefreshing(true);
    try {
      await refetchFiltersMetadata();
    } finally {
      setFiltersRefreshing(false);
    }
  }, [refetchFiltersMetadata]);

  const getCompanySavedPayload = useCallback((): CompanySavedSearchPayload => {
    return {
      version: SAVED_SEARCH_VERSION_SIDEBAR,
      vqlQuery: currentCompanyVqlQuery,
      search,
      facetValues: { ...facetValues },
      advancedCompanyDraft: advancedCompanyDraft
        ? structuredClone(advancedCompanyDraft)
        : null,
      sortBy,
      pageSize,
    };
  }, [
    currentCompanyVqlQuery,
    search,
    facetValues,
    advancedCompanyDraft,
    sortBy,
    pageSize,
  ]);

  const handleApplyCompanySaved = useCallback(
    (p: CompanySavedSearchPayload) => {
      if (p.version === SAVED_SEARCH_VERSION_SIDEBAR) {
        setSearch(p.search);
        setFacetValues(
          normalizeCompanyFacetValues(p.facetValues as Record<string, unknown>),
        );
        setAdvancedCompanyDraft(
          p.advancedCompanyDraft
            ? structuredClone(p.advancedCompanyDraft)
            : null,
        );
        if (p.sortBy) setSortBy(p.sortBy);
        if (p.pageSize) setPageSize(p.pageSize);
        applyVqlQuery(p.vqlQuery);
      } else if (p.version === SAVED_SEARCH_VERSION) {
        setSearch(p.search);
        applyVqlQuery(p.vqlQuery);
      }
    },
    [
      applyVqlQuery,
      setSearch,
      setFacetValues,
      setAdvancedCompanyDraft,
      setSortBy,
      setPageSize,
    ],
  );

  const companySavedSearchesMenu = useMemo(
    () => (
      <SavedSearchesMenu
        entity="company"
        getCompanyPayload={getCompanySavedPayload}
        onApplyCompany={handleApplyCompanySaved}
      />
    ),
    [getCompanySavedPayload, handleApplyCompanySaved],
  );

  const filtersSidebar = useMemo(
    () => (
      <>
        {!isDesktop ? (
          <div className="c360-data-layout__filters-mobile-saved">
            {companySavedSearchesMenu}
          </div>
        ) : null}
        <CompaniesFilterSidebar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterSections={filterSections}
          filtersLoading={filtersLoading}
          facetValues={facetValues}
          onFacetChange={handleFacetChange}
          onSectionExpand={loadFilterData}
          onLoadMoreFacet={loadMoreFilterData}
          setFacetSearch={setFilterSearch}
          advancedVqlRuleCount={advancedVqlRuleCount}
          onClearVql={clearCompanyVql}
          onOpenAdvanced={() => setVqlOpen(true)}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
          sortChipLabel={sortChipLabel}
          hiddenColumnCount={hiddenColumnCount}
          onResetVisibleColumns={resetVisibleColumns}
          onRefreshFilters={handleRefreshFilters}
          filtersRefreshing={filtersRefreshing}
          drawerTitleId="c360-companies-filter-drawer-title"
          onCloseDrawer={
            isDesktop ? undefined : () => setMobileFiltersOpen(false)
          }
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          tableDensity={tableDensity}
          onTableDensityChange={setTableDensity}
        />
      </>
    ),
    [
      isDesktop,
      companySavedSearchesMenu,
      search,
      setSearch,
      sortBy,
      setSortBy,
      filterSections,
      filtersLoading,
      facetValues,
      handleFacetChange,
      loadFilterData,
      loadMoreFilterData,
      setFilterSearch,
      advancedVqlRuleCount,
      clearCompanyVql,
      visibleColumns,
      toggleColumn,
      sortChipLabel,
      hiddenColumnCount,
      resetVisibleColumns,
      handleRefreshFilters,
      filtersRefreshing,
      viewMode,
      tableDensity,
    ],
  );

  const toolbarEl = (
    <DataToolbar
      cssPrefix="c360-toolbar"
      totalCount={total}
      meta={
        !loading && total > 0 ? (
          <CompanyPagination
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        ) : undefined
      }
      filterConfig={{
        activeCount: toolbarActiveCount,
        onOpen: () => setMobileFiltersOpen(true),
        show: !isDesktop,
      }}
      actionPrefix={
        <div className="c360-toolbar__page-size c360-flex c360-items-center c360-gap-2">
          <span className="c360-contacts-dt__toolbar-label">Show</span>
          <Select
            options={[...COMPANIES_DT_PAGE_SIZE_OPTIONS]}
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            fullWidth={false}
            className="c360-contacts-dt__page-size"
            inputSize="sm"
            aria-label="Rows per page"
          />
        </div>
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
      filtersAriaLabel="Company filters"
      filterDrawerTitleId="c360-companies-filter-drawer-title"
      filtersPeekRail
      filtersPeekScope="companies"
      filtersPinExtra={companySavedSearchesMenu}
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
        fullQuery={mergedPreviewQuery}
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
              {opErr.retryable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="c360-mt-2"
                  disabled={loading}
                  leftIcon={
                    <RefreshCw
                      size={13}
                      className={cn(loading && "c360-spin")}
                    />
                  }
                  onClick={() => void refresh()}
                >
                  Retry
                </Button>
              ) : null}
            </Alert>
          );
        })()}

      {selected.length > 0 && (
        <div className="c360-floating-bar c360-floating-bar--kit">
          <span>
            <strong>{selected.length}</strong> selected
          </span>
          <div className="c360-badge-row">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {!loading && companies.length === 0 ? (
        <Card>
          <div className="c360-empty-state">No companies found</div>
        </Card>
      ) : viewMode === "card" ? (
        loading && companies.length === 0 ? (
          <div className="c360-widget-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="c360-card c360-flex c360-flex-col">
                <div className="c360-card__body">
                  <Skeleton height={22} className="c360-mb-2" />
                  <Skeleton height={14} className="c360-mb-4 c360-w-2/3" />
                  <Skeleton height={72} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="c360-widget-grid">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="c360-card c360-flex c360-flex-col"
                >
                  <div className="c360-card__body">
                    <div className="c360-company-card-header">
                      <CompanyLogoThumb
                        key={company.id}
                        company={company}
                        size="md"
                      />
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
          </>
        )
      ) : (
        <Card padding="none">
          <div className="c360-p-0">
            <CompaniesDataTable
              rows={companies}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              loading={loading}
              error={tableErrorMessage}
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              selected={selected}
              onSelectionChange={setSelected}
              onRetry={() => void refresh()}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onVisibleColumnsResolved={handleVisibleColumnsResolved}
              showToolbarSearch={false}
              showColumnPicker={false}
              showPageSizeControl={false}
              showPaginationFooter={false}
              density={tableDensity}
            />
          </div>
        </Card>
      )}

      <CompanyImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => void refresh?.()}
      />

      <CompanyCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refresh?.()}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        processing={bulkDeleting}
        onConfirm={async () => {
          setBulkDeleting(true);
          try {
            let deleted = 0;
            let alreadyGone = 0;
            const failures: string[] = [];
            for (const id of selected) {
              try {
                await companiesService.delete(id);
                deleted += 1;
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                if (
                  msg.includes("ERR_COMPANY_NOT_FOUND") ||
                  msg.toLowerCase().includes("not found")
                ) {
                  alreadyGone += 1;
                } else {
                  failures.push(msg);
                }
              }
            }
            if (failures.length > 0) {
              const preview = failures.slice(0, 5).join("; ");
              const more =
                failures.length > 5 ? ` (+${failures.length - 5} more)` : "";
              toast.warning(
                `${failures.length} compan(y/ies) failed: ${preview}${more}`,
              );
            }
            if (alreadyGone > 0 && deleted === 0 && failures.length === 0) {
              toast.info(
                `${alreadyGone} compan(y/ies) were already deleted or missing.`,
              );
            } else if (alreadyGone > 0 && deleted > 0) {
              toast.success(
                `Deleted ${deleted} compan(y/ies). ${alreadyGone} were already removed.`,
              );
            } else if (deleted > 0) {
              toast.success(`Deleted ${deleted} compan(y/ies).`);
            }
            setDeleteOpen(false);
            setSelected([]);
            await refresh();
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Failed to delete companies",
            );
          } finally {
            setBulkDeleting(false);
          }
        }}
        title={`Delete ${selected.length} companies?`}
        message="This action cannot be undone. All selected companies will be permanently deleted."
        confirmLabel="Delete"
      />
    </DataPageLayout>
  );
}
