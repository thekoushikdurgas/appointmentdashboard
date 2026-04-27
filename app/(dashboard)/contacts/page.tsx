"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Download,
  Trash2,
  Mail,
  Upload,
  Globe,
  List,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { parseOperationError } from "@/lib/errorParser";
import { WorldMap } from "@/components/shared/WorldMap";
import { useContacts } from "@/hooks/useContacts";
import { useContactFilters } from "@/hooks/useContactFilters";
import { useCountryAggregates } from "@/hooks/useCountryAggregates";
import { useRole } from "@/context/RoleContext";
import {
  ContactsDataTable,
  CONTACTS_DT_COLUMN_IDS,
  CONTACTS_DT_DEFAULT_COLUMNS,
  CONTACTS_DT_PAGE_SIZE_OPTIONS,
  type ContactsDataTableColumnId,
} from "@/components/feature/contacts/ContactsDataTable";
import { ContactsFilterSidebar } from "@/components/feature/contacts/ContactsFilterSidebar";
import { ContactCreateModal } from "@/components/feature/contacts/ContactCreateModal";
import { ContactExportModal } from "@/components/feature/contacts/ContactExportModal";
import { ContactImportModal } from "@/components/feature/contacts/ContactImportModal";
import { contactsService } from "@/services/graphql/contactsService";
import {
  readContactsSortPreference,
  writeContactsSortPreference,
} from "@/lib/contactsListCache";
import {
  countDraftConditions,
  draftToVqlQueryInput,
  emptyDraftCondition,
  emptyDraftGroup,
  type DraftCondition,
  type DraftGroup,
  type DraftQuery,
  type DraftSort,
} from "@/lib/vqlDraft";
import {
  defaultCompanySelectWhenPopulate,
  selectColumnsFromVisibleColumns,
  visibleColumnsNeedCompanyPopulate,
} from "@/lib/contactsColumnVql";
import { VqlBuilderModal } from "@/components/vql/VqlBuilderModal";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { SavedSearchesMenu } from "@/components/feature/saved-searches/SavedSearchesMenu";
import {
  SAVED_SEARCH_VERSION,
  type ContactSavedSearchPayload,
} from "@/lib/savedSearchPayload";
import type { VqlQueryInput } from "@/graphql/generated/types";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import { getContactsToolbarActiveCount } from "@/lib/contactsFilterMetrics";

const STATUS_MAP: Record<string, string> = {
  Verified: "VALID",
  Found: "FOUND",
  Unknown: "UNKNOWN",
  Risky: "RISKY",
};

const SORT_MAP: Record<string, { field: string; direction: "asc" | "desc" }> = {
  newest: { field: "createdAt", direction: "desc" },
  oldest: { field: "createdAt", direction: "asc" },
  name_asc: { field: "firstName", direction: "asc" },
  name_desc: { field: "firstName", direction: "desc" },
};

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name A→Z",
  name_desc: "Name Z→A",
};

function sortByToDraftSort(sortBy: string): DraftSort[] {
  const s = SORT_MAP[sortBy] ?? SORT_MAP.newest;
  return [{ field: s.field, direction: s.direction }];
}

function sidebarCond(
  field: string,
  operator: string,
  value: string,
): DraftCondition {
  const c = emptyDraftCondition();
  return { ...c, field, operator, value };
}

/** One facet dimension: single value uses `eq`, multiple uses `in_list` → `in` via vqlDraft. */
function sidebarFacetCond(
  key: string,
  values: string[],
): DraftCondition | null {
  const trimmed = values.map((v) => String(v).trim()).filter(Boolean);
  if (trimmed.length === 0) return null;
  if (trimmed.length === 1) return sidebarCond(key, "eq", trimmed[0]);
  const c = emptyDraftCondition();
  return { ...c, field: key, operator: "in_list", value: trimmed.join(",") };
}

const CONTACT_TABS = [
  { value: "total", label: "Total" },
  { value: "net_new", label: "Net New" },
  { value: "do_not_contact", label: "Do Not Contact" },
] as const;

const VISIBLE_COLUMNS_STORAGE_KEY = "c360:contacts:visibleColumns:v1";

function loadVisibleColumns(): ContactsDataTableColumnId[] {
  if (typeof window === "undefined") return [...CONTACTS_DT_DEFAULT_COLUMNS];
  try {
    const raw = localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
    if (!raw) return [...CONTACTS_DT_DEFAULT_COLUMNS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...CONTACTS_DT_DEFAULT_COLUMNS];
    const ordered = CONTACTS_DT_COLUMN_IDS.filter((id) => parsed.includes(id));
    return ordered.length > 0 ? ordered : [...CONTACTS_DT_DEFAULT_COLUMNS];
  } catch {
    return [...CONTACTS_DT_DEFAULT_COLUMNS];
  }
}

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const {
    contacts,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    loading,
    error,
    applyVqlQuery,
    exportVql,
    vqlQuery,
    refresh,
  } = useContacts();

  const {
    data: countryData,
    loading: countryLoading,
    error: countryMapError,
    analytics: countryGeoMeta,
  } = useCountryAggregates(exportVql);

  const [selected, setSelected] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window === "undefined") return "newest";
    const s = readContactsSortPreference();
    return s && s in SORT_MAP ? s : "newest";
  });
  const [activeTab, setActiveTab] = useState<string>("total");
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [vqlOpen, setVqlOpen] = useState(false);
  const [advancedListDraft, setAdvancedListDraft] = useState<DraftQuery | null>(
    null,
  );
  const [facetValues, setFacetValues] = useState<Record<string, string[]>>({});
  const {
    sections: filterSections,
    loadFilterData,
    loadMoreFilterData,
    setFilterSearch,
    refetchFiltersMetadata,
  } = useContactFilters();

  const handleFacetChange = useCallback((key: string, values: string[]) => {
    setFacetValues((prev) => ({ ...prev, [key]: values }));
  }, []);

  const mergedPreviewQuery = useMemo((): Partial<VqlQueryInput> => {
    const offset = (page - 1) * pageSize;
    return {
      ...(vqlQuery as Partial<VqlQueryInput>),
      limit: pageSize,
      offset,
      searchAfter: undefined,
    };
  }, [vqlQuery, page, pageSize]);
  const isDesktop = useIsDesktop();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [tableDensity, setTableDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [filtersRefreshing, setFiltersRefreshing] = useState(false);
  const { isSuperAdmin } = useRole();
  const [importOpen, setImportOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<
    ContactsDataTableColumnId[]
  >(() => [...CONTACTS_DT_DEFAULT_COLUMNS]);

  useEffect(() => {
    setVisibleColumns(loadVisibleColumns());
  }, []);

  useEffect(() => {
    writeContactsSortPreference(sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (isDesktop) setMobileFiltersOpen(false);
  }, [isDesktop]);

  const verifiedOnPage = useMemo(
    () =>
      contacts.filter((c) => (c.emailStatus || "").toUpperCase() === "VALID")
        .length,
    [contacts],
  );

  const toggleColumn = useCallback((id: ContactsDataTableColumnId) => {
    setVisibleColumns((prev) => {
      let next: ContactsDataTableColumnId[];
      if (prev.includes(id)) {
        next = prev.filter((c) => c !== id);
        if (next.length === 0) return prev;
      } else {
        next = [...prev, id];
      }
      const ordered = CONTACTS_DT_COLUMN_IDS.filter((col) =>
        next.includes(col),
      );
      try {
        localStorage.setItem(
          VISIBLE_COLUMNS_STORAGE_KEY,
          JSON.stringify(ordered),
        );
      } catch {
        /* ignore */
      }
      return ordered;
    });
  }, []);

  const handleVqlApply = useCallback((draft: DraftQuery) => {
    setAdvancedListDraft(structuredClone(draft));
  }, []);

  const clearVqlQuery = useCallback(() => {
    setAdvancedListDraft(null);
  }, []);

  const advancedVqlRuleCount = advancedListDraft
    ? countDraftConditions(advancedListDraft.rootGroup)
    : 0;

  const hasAdvancedBuilderState = useMemo(() => {
    if (!advancedListDraft) return false;
    return (
      advancedVqlRuleCount > 0 ||
      advancedListDraft.sort.length > 0 ||
      advancedListDraft.selectColumns.length > 0 ||
      advancedListDraft.companyPopulate
    );
  }, [advancedListDraft, advancedVqlRuleCount]);

  const resetVisibleColumns = useCallback(() => {
    const next = [...CONTACTS_DT_DEFAULT_COLUMNS];
    setVisibleColumns(next);
    try {
      localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const toggleAll = () =>
    setSelected(
      selected.length === contacts.length ? [] : contacts.map((c) => c.id),
    );

  const toggleRow = (id: string) =>
    setExpandedRow((prev) => (prev === id ? null : id));

  const applyFilters = useCallback(() => {
    const sidebar: DraftCondition[] = [];
    if (activeTab === "net_new") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      sidebar.push(sidebarCond("created_at", "gte", d.toISOString()));
    } else if (activeTab === "do_not_contact") {
      sidebar.push(sidebarCond("status", "eq", "do_not_contact"));
    }
    if (search.trim()) {
      sidebar.push(sidebarCond("email", "contains", search.trim()));
    }
    if (statusFilter !== "All" && STATUS_MAP[statusFilter]) {
      sidebar.push(sidebarCond("email_status", "eq", STATUS_MAP[statusFilter]));
    }
    for (const [key, vals] of Object.entries(facetValues)) {
      if (!vals?.length) continue;
      const cond = sidebarFacetCond(key, vals);
      if (cond) sidebar.push(cond);
    }
    const rootItems: Array<DraftCondition | DraftGroup> = [...sidebar];
    if (
      advancedListDraft &&
      countDraftConditions(advancedListDraft.rootGroup) > 0
    ) {
      rootItems.push(structuredClone(advancedListDraft.rootGroup));
    }
    const merged: DraftQuery = {
      rootGroup: { ...emptyDraftGroup("and"), items: rootItems },
      sort:
        advancedListDraft?.sort?.length && advancedListDraft.sort.length > 0
          ? advancedListDraft.sort
          : sortByToDraftSort(sortBy),
      selectColumns:
        advancedListDraft?.selectColumns?.length &&
        advancedListDraft.selectColumns.length > 0
          ? advancedListDraft.selectColumns
          : selectColumnsFromVisibleColumns(visibleColumns),
      companyPopulate:
        !!advancedListDraft?.companyPopulate ||
        visibleColumnsNeedCompanyPopulate(visibleColumns),
      companySelectColumns:
        advancedListDraft?.companySelectColumns?.length &&
        advancedListDraft.companySelectColumns.length > 0
          ? advancedListDraft.companySelectColumns
          : visibleColumnsNeedCompanyPopulate(visibleColumns)
            ? defaultCompanySelectWhenPopulate()
            : [],
    };
    applyVqlQuery(draftToVqlQueryInput(merged, "contact"));
  }, [
    search,
    statusFilter,
    sortBy,
    activeTab,
    facetValues,
    advancedListDraft,
    visibleColumns,
    applyVqlQuery,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const sortChipLabel =
    sortBy !== "newest" ? `Sort: ${SORT_LABELS[sortBy] ?? sortBy}` : null;
  const hiddenColumnCount = CONTACTS_DT_COLUMN_IDS.filter(
    (id) => !visibleColumns.includes(id),
  ).length;

  const toolbarActiveCount = useMemo(
    () =>
      getContactsToolbarActiveCount({
        activeTab,
        statusFilter,
        facetValues,
        search,
        advancedVqlRuleCount,
        sortBy,
        hiddenColumnCount,
      }),
    [
      activeTab,
      statusFilter,
      facetValues,
      search,
      advancedVqlRuleCount,
      sortBy,
      hiddenColumnCount,
    ],
  );

  const handleRefreshFilters = useCallback(async () => {
    setFiltersRefreshing(true);
    try {
      await refetchFiltersMetadata();
    } finally {
      setFiltersRefreshing(false);
    }
  }, [refetchFiltersMetadata]);

  const getContactSavedPayload = useCallback((): ContactSavedSearchPayload => {
    return {
      version: SAVED_SEARCH_VERSION,
      vqlQuery: vqlQuery as Partial<VqlQueryInput>,
      pageSize,
    };
  }, [vqlQuery, pageSize]);

  const handleApplyContactSaved = useCallback(
    (p: ContactSavedSearchPayload) => {
      setPageSize(p.pageSize);
      applyVqlQuery(p.vqlQuery);
    },
    [applyVqlQuery, setPageSize],
  );

  const handleAiSearch = useCallback(() => {
    if (process.env.NEXT_PUBLIC_CONTACTS_AI_SEARCH === "1") {
      setAiSearching(true);
      try {
        toast.info("AI filter integration is not wired yet.");
      } finally {
        setAiSearching(false);
      }
      return;
    }
    toast.info(
      "AI-assisted filtering is not enabled. Set NEXT_PUBLIC_CONTACTS_AI_SEARCH=1 when the API is available.",
    );
  }, []);

  const filtersSidebar = useMemo(
    () => (
      <ContactsFilterSidebar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterSections={filterSections}
        facetValues={facetValues}
        onFacetChange={handleFacetChange}
        onSectionExpand={loadFilterData}
        onLoadMoreFacet={loadMoreFilterData}
        setFacetSearch={setFilterSearch}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        advancedVqlRuleCount={advancedVqlRuleCount}
        onClearVql={clearVqlQuery}
        onOpenAdvanced={() => setVqlOpen(true)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        sortChipLabel={sortChipLabel}
        hiddenColumnCount={hiddenColumnCount}
        onResetVisibleColumns={resetVisibleColumns}
        onRefreshFilters={handleRefreshFilters}
        filtersRefreshing={filtersRefreshing}
        filterDrawerTitleId="c360-filter-drawer-title"
        onCloseDrawer={
          isDesktop ? undefined : () => setMobileFiltersOpen(false)
        }
        aiQuery={aiQuery}
        onAiQueryChange={setAiQuery}
        onAiSearch={handleAiSearch}
        aiSearching={aiSearching}
      />
    ),
    [
      search,
      statusFilter,
      sortBy,
      filterSections,
      facetValues,
      loadFilterData,
      activeTab,
      advancedVqlRuleCount,
      visibleColumns,
      toggleColumn,
      clearVqlQuery,
      sortChipLabel,
      hiddenColumnCount,
      resetVisibleColumns,
      handleRefreshFilters,
      filtersRefreshing,
      isDesktop,
      aiQuery,
      handleAiSearch,
      aiSearching,
      handleFacetChange,
      loadMoreFilterData,
      setFilterSearch,
    ],
  );

  const mapTopCountry = useMemo(() => {
    if (countryData.length === 0) return null;
    return countryData.reduce(
      (best, cur) => (cur.count > best.count ? cur : best),
      countryData[0]!,
    );
  }, [countryData]);

  const contactsToolbarMeta = (
    <div className="c360-contacts-metadata c360-contacts-metadata--toolbar">
      <div className="c360-contacts-metadata__item">
        <span className="c360-contacts-metadata__label">Total (list)</span>
        <span className="c360-contacts-metadata__value">
          {total.toLocaleString()}
        </span>
      </div>
      <div className="c360-contacts-metadata__item">
        <span className="c360-contacts-metadata__label">Verified on page</span>
        <span className="c360-contacts-metadata__value">{verifiedOnPage}</span>
      </div>
      <div className="c360-contacts-metadata__item">
        <span className="c360-contacts-metadata__label">Rows this page</span>
        <span className="c360-contacts-metadata__value">{contacts.length}</span>
      </div>
    </div>
  );

  const toolbarEl = (
    <DataToolbar
      cssPrefix="c360-toolbar"
      tabs={CONTACT_TABS.map((t) => ({
        value: t.value,
        label: t.label,
      }))}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      totalCount={total}
      meta={contactsToolbarMeta}
      viewModes={[
        { value: "comfortable", label: "Comfortable", icon: LayoutGrid },
        { value: "compact", label: "Compact", icon: List },
      ]}
      viewMode={tableDensity}
      onViewModeChange={(m) => setTableDensity(m as "comfortable" | "compact")}
      filterConfig={{
        activeCount: toolbarActiveCount,
        onOpen: () => setMobileFiltersOpen(true),
        show: !isDesktop,
      }}
      actionPrefix={
        <>
          <div className="c360-toolbar__page-size c360-flex c360-items-center c360-gap-2">
            <span className="c360-contacts-dt__toolbar-label">Show</span>
            <Select
              options={[...CONTACTS_DT_PAGE_SIZE_OPTIONS]}
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              fullWidth={false}
              className="c360-contacts-dt__page-size"
              inputSize="sm"
              aria-label="Rows per page"
            />
            <span className="c360-contacts-dt__toolbar-label">entries</span>
          </div>
          <SavedSearchesMenu
            entity="contact"
            getContactPayload={getContactSavedPayload}
            onApplyContact={handleApplyContactSaved}
          />
        </>
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
                onClick: clearVqlQuery,
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
          label: "Map view",
          onClick: () => setMapModalOpen(true),
          icon: Globe,
          variant: "secondary" as const,
        },
        {
          label: "Add contact",
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
      className="c360-contacts-page"
    >
      <Modal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title="Contact distribution"
        size="xl"
        className="c360-contacts-map-modal"
      >
        <p className="c360-text-sm c360-text-muted c360-mb-3">
          Countries reflect your current filters and search (same cohort as the
          list). Hover a region for counts.
        </p>
        {countryMapError ? (
          <Alert variant="danger" title="Could not load map data" className="c360-mb-4">
            {countryMapError}
          </Alert>
        ) : null}
        {countryGeoMeta ? (
          <div className="c360-contacts-metadata c360-mb-4 c360-flex c360-flex-wrap c360-gap-4">
            <div className="c360-contacts-metadata__item">
              <span className="c360-contacts-metadata__label">Filtered total</span>
              <span className="c360-contacts-metadata__value">
                {countryGeoMeta.total.toLocaleString()}
              </span>
            </div>
            <div className="c360-contacts-metadata__item">
              <span className="c360-contacts-metadata__label">Countries shown</span>
              <span className="c360-contacts-metadata__value">
                {countryData.length.toLocaleString()}
              </span>
            </div>
            {mapTopCountry ? (
              <div className="c360-contacts-metadata__item">
                <span className="c360-contacts-metadata__label">Top country</span>
                <span className="c360-contacts-metadata__value">
                  {mapTopCountry.name} ({mapTopCountry.count.toLocaleString()})
                </span>
              </div>
            ) : null}
            {countryGeoMeta.unmappedCount > 0 ? (
              <div className="c360-contacts-metadata__item">
                <span className="c360-contacts-metadata__label">Unmapped country</span>
                <span className="c360-contacts-metadata__value">
                  {countryGeoMeta.unmappedCount.toLocaleString()}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
        <WorldMap
          data={countryData}
          height={countryLoading && countryData.length === 0 ? 80 : 440}
        />
      </Modal>

      <VqlBuilderModal
        open={vqlOpen}
        onClose={() => setVqlOpen(false)}
        onApply={handleVqlApply}
        entityType="contact"
        initialDraft={advancedListDraft ?? undefined}
        fullQuery={mergedPreviewQuery}
      />

      <ContactExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        vqlForExport={exportVql}
        visibleColumnIds={visibleColumns}
      />

      {selected.length > 0 && (
        <div className="c360-floating-bar c360-floating-bar--kit">
          <span>
            <strong>{selected.length}</strong> selected
          </span>
          <div className="c360-badge-row">
            <Button variant="secondary" size="sm" leftIcon={<Mail size={14} />}>
              Find Emails
            </Button>
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

      {error &&
        (() => {
          const opErr = parseOperationError(error, "contacts");
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
                    : "Failed to load contacts"
              }
              className="c360-mb-4"
            >
              {opErr.userMessage}
              {opErr.retryable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="c360-mt-2"
                  onClick={() => void refresh()}
                >
                  Retry
                </Button>
              )}
            </Alert>
          );
        })()}

      <Card padding="none">
        <div className="c360-p-4">
          <ContactsDataTable
            contacts={contacts}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            loading={loading}
            error={error}
            search={search}
            onSearchChange={setSearch}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAllPage={toggleAll}
            expandedRow={expandedRow}
            onToggleExpand={toggleRow}
            onRetry={() => void refresh()}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            showToolbarSearch={false}
            showColumnPicker={false}
            showPageSizeControl={false}
            showPaginationFooter={false}
            density={tableDensity}
          />
        </div>
      </Card>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        processing={bulkDeleting}
        onConfirm={async () => {
          setBulkDeleting(true);
          try {
            for (const id of selected) {
              await contactsService.delete(id);
            }
            toast.success(`Deleted ${selected.length} contact(s).`);
            setDeleteOpen(false);
            setSelected([]);
            await refresh();
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Failed to delete contacts",
            );
          } finally {
            setBulkDeleting(false);
          }
        }}
        title={`Delete ${selected.length} contacts?`}
        message="This action cannot be undone. All selected contacts will be permanently deleted."
        confirmLabel="Delete"
      />

      <ContactImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => void refresh?.()}
      />

      <ContactCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => refresh?.()}
      />
    </DataPageLayout>
  );
}
