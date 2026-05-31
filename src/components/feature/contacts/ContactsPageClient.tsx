"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Download,
  Trash2,
  Mail,
  Upload,
  Globe,
  RefreshCw,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { CONTACTS_AI_SEARCH_ENABLED } from "@/lib/config";
import { parseOperationError } from "@/lib/errorParser";
import { useContacts } from "@/hooks/useContacts";
import { useContactFilters } from "@/hooks/useContactFilters";
import { useCountryAggregates } from "@/hooks/useCountryAggregates";
import type { CountryCount } from "@/components/shared/WorldMap";
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
import { CompanyDrawerPanel } from "@/components/feature/hiring-signals/CompanyDrawerPanel";
import {
  companyDrawerAnchorFromContact,
  type CompanyDrawerAnchor,
} from "@/lib/companyDrawerAnchor";
import type { Contact } from "@/services/graphql/contactsService";
import { ContactExportModal } from "@/components/feature/contacts/ContactExportModal";
import { ContactImportModal } from "@/components/feature/contacts/ContactImportModal";
import { contactsService } from "@/services/graphql/contactsService";
import { emailService } from "@/services/graphql/emailService";
import {
  readContactsSortPreference,
  writeContactsSortPreference,
} from "@/lib/contactsListCache";
import { swallowBestEffortAsync } from "@/lib/bestEffort";
import { cn } from "@/lib/utils";
import {
  tryLocalStorageGet,
  tryLocalStorageSetJSON,
} from "@/lib/safeLocalStorage";
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
import { ContactPagination } from "@/components/feature/contacts/ContactPagination";
import { ContactsToolbarAiSearch } from "@/components/feature/contacts/ContactsToolbarAiSearch";
import {
  SavedSearchesMenu,
  SavedSearchesTriggerButton,
} from "@/components/feature/saved-searches/SavedSearchesMenu";
import {
  SAVED_SEARCH_VERSION,
  SAVED_SEARCH_VERSION_SIDEBAR,
  type ContactSavedSearchPayload,
} from "@/lib/savedSearchPayload";
import type { VqlQueryInput } from "@/graphql/generated/types";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import { getContactsToolbarActiveCount } from "@/lib/contactsFilterMetrics";
import {
  contactFacetExcludeDraftCondition,
  contactFacetIncludeDraftCondition,
} from "@/lib/contactFacetDraftConditions";
import { contactVqlFieldForFacetFilterKey } from "@/lib/contactFacetVql";
import { contactRangeBucketSidebarItems } from "@/lib/contactFacetRangeDraftConditions";
import { isContactIncludeExcludeFacet } from "@/lib/contactIncludeExcludeFacets";
import { mergeLegacyCompanyFacetValues } from "@/lib/contactLegacyCompanyFacets";
import { isCompanyRangeBucketFacet } from "@/lib/companyRangeBuckets";
import {
  LEGACY_EMAIL_STATUS_PILL_TO_TOKEN,
  normalizeEmailStatusFilterValues,
} from "@/lib/contactEmailStatus";

const WorldMap = dynamic(
  () => import("@/components/shared/WorldMap").then((m) => m.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div className="c360-flex c360-items-center c360-justify-center c360-p-12">
        <span className="c360-spinner" aria-label="Loading map…" />
      </div>
    ),
  },
);

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
  displayName?: string,
): DraftCondition | null {
  const trimmed = values.map((v) => String(v).trim()).filter(Boolean);
  if (trimmed.length === 0) return null;
  const field = contactVqlFieldForFacetFilterKey(key, displayName);
  const vals =
    field === "email_status"
      ? normalizeEmailStatusFilterValues(trimmed)
      : trimmed;
  if (vals.length === 1) return sidebarCond(field, "eq", vals[0]);
  const c = emptyDraftCondition();
  return { ...c, field, operator: "in_list", value: vals.join(",") };
}

const VISIBLE_COLUMNS_STORAGE_KEY = "c360:contacts:visibleColumns:v1";

function loadVisibleColumns(): ContactsDataTableColumnId[] {
  const raw = tryLocalStorageGet(VISIBLE_COLUMNS_STORAGE_KEY);
  if (!raw) return [...CONTACTS_DT_DEFAULT_COLUMNS];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...CONTACTS_DT_DEFAULT_COLUMNS];
    const legacy = parsed as string[];
    if (legacy.includes("status") && !legacy.includes("email")) {
      legacy.push("email");
    }
    const ordered = CONTACTS_DT_COLUMN_IDS.filter((id) => legacy.includes(id));
    return ordered.length > 0 ? ordered : [...CONTACTS_DT_DEFAULT_COLUMNS];
  } catch {
    return [...CONTACTS_DT_DEFAULT_COLUMNS];
  }
}

export default function ContactsPageClient() {
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
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window === "undefined") return "newest";
    const s = readContactsSortPreference();
    return s && s in SORT_MAP ? s : "newest";
  });
  const [activeTab, setActiveTab] = useState<string>("total");
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkFindingEmails, setBulkFindingEmails] = useState(false);
  const [vqlOpen, setVqlOpen] = useState(false);
  const [savedSearchesPanelOpen, setSavedSearchesPanelOpen] = useState(false);
  const [companyDrawerAnchor, setCompanyDrawerAnchor] =
    useState<CompanyDrawerAnchor | null>(null);
  const [advancedListDraft, setAdvancedListDraft] = useState<DraftQuery | null>(
    null,
  );
  const [facetValues, setFacetValues] = useState<Record<string, string[]>>({});
  const [excludedFacetValues, setExcludedFacetValues] = useState<
    Record<string, string[]>
  >({});
  const {
    sections: filterSections,
    filtersLoading,
    filtersError,
    loadFilterData,
    loadMoreFilterData,
    setFilterSearch,
    refetchFiltersMetadata,
  } = useContactFilters();

  const handleFacetChange = useCallback((key: string, values: string[]) => {
    setFacetValues((prev) => ({ ...prev, [key]: values }));
  }, []);

  const handleOpenCompanyDrawer = useCallback((contact: Contact) => {
    const anchor = companyDrawerAnchorFromContact(contact);
    if (anchor) setCompanyDrawerAnchor(anchor);
  }, []);

  const handleMapCountrySelect = useCallback(
    (country: CountryCount) => {
      const token = country.filterValue.trim();
      if (!token) {
        toast.error("Could not apply a country filter for this region.");
        return;
      }
      setFacetValues((prev) => ({
        ...prev,
        country: [token],
      }));
      setExcludedFacetValues((prev) => ({
        ...prev,
        country: [],
      }));
      setMapModalOpen(false);
      setPage(1);
      toast.success(`Showing contacts in ${country.name}`);
    },
    [setPage],
  );

  const handleExcludedFacetChange = useCallback(
    (key: string, values: string[]) => {
      setExcludedFacetValues((prev) => ({ ...prev, [key]: values }));
    },
    [],
  );

  const mergedPreviewQuery = useMemo((): Partial<VqlQueryInput> => {
    const offset = (page - 1) * pageSize;
    return {
      ...(vqlQuery as Partial<VqlQueryInput>),
      limit: pageSize,
      offset,
      searchAfter: undefined,
    };
  }, [vqlQuery, page, pageSize]);

  const tableErrorMessage = useMemo(() => {
    if (!error) return null;
    return parseOperationError(error, "contacts").userMessage;
  }, [error]);
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
      tryLocalStorageSetJSON(VISIBLE_COLUMNS_STORAGE_KEY, ordered);
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

  const resetVisibleColumns = useCallback(() => {
    const next = [...CONTACTS_DT_DEFAULT_COLUMNS];
    setVisibleColumns(next);
    tryLocalStorageSetJSON(VISIBLE_COLUMNS_STORAGE_KEY, next);
  }, []);

  const handleVisibleColumnsResolved = useCallback(
    (next: ContactsDataTableColumnId[]) => {
      setVisibleColumns(next);
      tryLocalStorageSetJSON(VISIBLE_COLUMNS_STORAGE_KEY, next);
    },
    [],
  );

  const toggleRow = (id: string) =>
    setExpandedRow((prev) => (prev === id ? null : id));

  const applyFilters = useCallback(() => {
    const sidebar: Array<DraftCondition | DraftGroup> = [];
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
    const facetKeys = new Set([
      ...Object.keys(facetValues),
      ...Object.keys(excludedFacetValues),
    ]);
    for (const key of facetKeys) {
      const meta = filterSections.find((s) => s.filterKey === key);
      const displayName = meta?.displayName;
      if (isCompanyRangeBucketFacet(key)) {
        sidebar.push(
          ...contactRangeBucketSidebarItems(
            key,
            facetValues[key] ?? [],
            excludedFacetValues[key] ?? [],
          ),
        );
        continue;
      }
      if (isContactIncludeExcludeFacet(key)) {
        const inc = contactFacetIncludeDraftCondition(
          key,
          facetValues[key] ?? [],
          displayName,
        );
        if (inc) sidebar.push(inc);
        const exc = contactFacetExcludeDraftCondition(
          key,
          excludedFacetValues[key] ?? [],
          displayName,
        );
        if (exc) sidebar.push(exc);
      } else {
        const vals = facetValues[key];
        if (!vals?.length) continue;
        const cond = sidebarFacetCond(key, vals, displayName);
        if (cond) sidebar.push(cond);
      }
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
    sortBy,
    activeTab,
    facetValues,
    excludedFacetValues,
    filterSections,
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
        facetValues,
        excludedFacetValues,
        search,
        advancedVqlRuleCount,
        sortBy,
        hiddenColumnCount,
      }),
    [
      activeTab,
      facetValues,
      excludedFacetValues,
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
      version: SAVED_SEARCH_VERSION_SIDEBAR,
      vqlQuery: vqlQuery as Partial<VqlQueryInput>,
      pageSize,
      search,
      statusFilter: "All",
      sortBy,
      activeTab,
      facetValues: { ...facetValues },
      excludedFacetValues: { ...excludedFacetValues },
      advancedListDraft: advancedListDraft
        ? structuredClone(advancedListDraft)
        : null,
    };
  }, [
    vqlQuery,
    pageSize,
    search,
    sortBy,
    activeTab,
    facetValues,
    excludedFacetValues,
    advancedListDraft,
  ]);

  const getContactSavedPayloadRef = useRef(getContactSavedPayload);
  getContactSavedPayloadRef.current = getContactSavedPayload;
  const getContactSavedPayloadStable = useCallback(
    (): ContactSavedSearchPayload => getContactSavedPayloadRef.current(),
    [],
  );

  const handleApplyContactSaved = useCallback(
    (p: ContactSavedSearchPayload) => {
      if (p.version === SAVED_SEARCH_VERSION_SIDEBAR) {
        setSearch(p.search);
        setSortBy(p.sortBy);
        setActiveTab(p.activeTab);
        let mergedFacets = { ...p.facetValues };
        const legacySf = p.statusFilter;
        if (
          legacySf &&
          legacySf !== "All" &&
          LEGACY_EMAIL_STATUS_PILL_TO_TOKEN[legacySf] &&
          !mergedFacets.email_status?.length
        ) {
          mergedFacets.email_status = [
            LEGACY_EMAIL_STATUS_PILL_TO_TOKEN[legacySf],
          ];
        }
        mergedFacets = mergeLegacyCompanyFacetValues(
          mergedFacets,
          p.companyFacetValues,
        );
        setFacetValues(mergedFacets);
        setExcludedFacetValues({ ...(p.excludedFacetValues ?? {}) });
        setAdvancedListDraft(
          p.advancedListDraft ? structuredClone(p.advancedListDraft) : null,
        );
        setPageSize(p.pageSize);
        applyVqlQuery(p.vqlQuery);
      } else if (p.version === SAVED_SEARCH_VERSION) {
        setPageSize(p.pageSize);
        applyVqlQuery(p.vqlQuery);
      }
    },
    [
      applyVqlQuery,
      setPageSize,
      setSearch,
      setSortBy,
      setActiveTab,
      setFacetValues,
      setAdvancedListDraft,
    ],
  );

  const contactSavedSearchMenuProps = useMemo(
    () => ({
      entity: "contact" as const,
      getContactPayload: getContactSavedPayloadStable,
      onApplyContact: handleApplyContactSaved,
      presentation: "panel" as const,
      panelOpen: savedSearchesPanelOpen,
      onPanelOpenChange: setSavedSearchesPanelOpen,
      showTrigger: false,
    }),
    [
      getContactSavedPayloadStable,
      handleApplyContactSaved,
      savedSearchesPanelOpen,
    ],
  );

  const openSavedSearchesPanel = useCallback(() => {
    setSavedSearchesPanelOpen(true);
  }, []);

  const savedSearchesTrigger = useMemo(
    () => <SavedSearchesTriggerButton onClick={openSavedSearchesPanel} />,
    [openSavedSearchesPanel],
  );

  const filtersRefreshButton = useMemo(
    () => (
      <button
        type="button"
        className="c360-contacts-filters__icon-btn"
        title="Refresh filter definitions"
        aria-label="Refresh filter definitions"
        disabled={filtersRefreshing}
        onClick={() => void handleRefreshFilters()}
      >
        <RefreshCw
          size={16}
          className={cn(filtersRefreshing && "c360-spin")}
          aria-hidden
        />
      </button>
    ),
    [filtersRefreshing, handleRefreshFilters],
  );

  const filtersPinExtra = useMemo(
    () => (
      <>
        {savedSearchesTrigger}
        {filtersRefreshButton}
      </>
    ),
    [savedSearchesTrigger, filtersRefreshButton],
  );

  const handleAiSearch = useCallback(() => {
    if (CONTACTS_AI_SEARCH_ENABLED) {
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

  const handleBulkFindEmails = useCallback(async () => {
    const rows = contacts.filter((c) => selected.includes(c.id));
    if (rows.length === 0) return;
    setBulkFindingEmails(true);
    let foundCount = 0;
    try {
      for (const c of rows) {
        const firstName = c.firstName ?? c.name.split(" ")[0] ?? "";
        const lastName =
          c.lastName ?? c.name.split(" ").slice(1).join(" ") ?? "";
        if (!firstName.trim()) continue;
        await swallowBestEffortAsync("contacts.bulkFindEmail", async () => {
          const result = await emailService.findEmails({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            domain: c.company ?? undefined,
          });
          const emails = result.email?.findEmails?.emails ?? [];
          if (emails.length > 0) foundCount += 1;
        });
      }
      toast.success(
        foundCount > 0
          ? `Found candidate emails for ${foundCount} of ${rows.length} selected contacts`
          : "No emails found for selected contacts",
      );
    } finally {
      setBulkFindingEmails(false);
    }
  }, [contacts, selected]);

  const filtersSidebar = useMemo(
    () => (
      <>
        {!isDesktop ? (
          <div className="c360-data-layout__filters-mobile-saved c360-data-layout__filters-mobile-saved--actions">
            {savedSearchesTrigger}
            {filtersRefreshButton}
          </div>
        ) : null}
        <ContactsFilterSidebar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterSections={filterSections}
          filtersLoading={filtersLoading}
          filtersError={filtersError}
          facetValues={facetValues}
          excludedFacetValues={excludedFacetValues}
          onFacetChange={handleFacetChange}
          onExcludedFacetChange={handleExcludedFacetChange}
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
          filterDrawerTitleId="c360-filter-drawer-title"
          onCloseDrawer={
            isDesktop ? undefined : () => setMobileFiltersOpen(false)
          }
          tableDensity={tableDensity}
          onTableDensityChange={setTableDensity}
        />
      </>
    ),
    [
      filtersRefreshButton,
      savedSearchesTrigger,
      isDesktop,
      search,
      sortBy,
      filterSections,
      filtersLoading,
      filtersError,
      facetValues,
      excludedFacetValues,
      loadFilterData,
      activeTab,
      advancedVqlRuleCount,
      visibleColumns,
      toggleColumn,
      clearVqlQuery,
      sortChipLabel,
      hiddenColumnCount,
      resetVisibleColumns,
      handleFacetChange,
      handleExcludedFacetChange,
      loadMoreFilterData,
      setFilterSearch,
      tableDensity,
      setTableDensity,
    ],
  );

  const mapTopCountry = useMemo(() => {
    if (countryData.length === 0) return null;
    return countryData.reduce(
      (best, cur) => (cur.count > best.count ? cur : best),
      countryData[0]!,
    );
  }, [countryData]);

  const toolbarEl = (
    <DataToolbar
      cssPrefix="c360-toolbar"
      totalCount={total}
      meta={
        <div className="c360-contacts-toolbar-meta">
          {!loading && total > 0 ? (
            <ContactPagination
              page={page}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          ) : null}
          <ContactsToolbarAiSearch
            value={aiQuery}
            onChange={setAiQuery}
            onSearch={handleAiSearch}
            searching={aiSearching}
            disabled={loading}
          />
        </div>
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
            options={[...CONTACTS_DT_PAGE_SIZE_OPTIONS]}
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
      filtersAriaLabel="Contact filters"
      filterDrawerTitleId="c360-filter-drawer-title"
      filtersPeekRail
      filtersPeekScope="contacts"
      filtersPinExtra={filtersPinExtra}
      className="c360-contacts-page"
    >
      <SavedSearchesMenu {...contactSavedSearchMenuProps} />
      <Modal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title="Contact distribution"
        size="xl"
        className="c360-contacts-map-modal"
      >
        <p className="c360-text-sm c360-text-muted c360-mb-3">
          Countries reflect your current filters and search (same cohort as the
          list). Hover for counts; click a shaded country to filter the contact
          table.
        </p>
        {countryMapError ? (
          <Alert
            variant="danger"
            title="Could not load map data"
            className="c360-mb-4"
          >
            {countryMapError}
          </Alert>
        ) : null}
        {countryGeoMeta ? (
          <div className="c360-contacts-metadata c360-mb-4 c360-flex c360-flex-wrap c360-gap-4">
            <div className="c360-contacts-metadata__item">
              <span className="c360-contacts-metadata__label">
                Filtered total
              </span>
              <span className="c360-contacts-metadata__value">
                {countryGeoMeta.total.toLocaleString()}
              </span>
            </div>
            <div className="c360-contacts-metadata__item">
              <span className="c360-contacts-metadata__label">
                Countries shown
              </span>
              <span className="c360-contacts-metadata__value">
                {countryData.length.toLocaleString()}
              </span>
            </div>
            {mapTopCountry ? (
              <div className="c360-contacts-metadata__item">
                <span className="c360-contacts-metadata__label">
                  Top country
                </span>
                <span className="c360-contacts-metadata__value">
                  {mapTopCountry.name} ({mapTopCountry.count.toLocaleString()})
                </span>
              </div>
            ) : null}
            {countryGeoMeta.unmappedCount > 0 ? (
              <div className="c360-contacts-metadata__item">
                <span className="c360-contacts-metadata__label">
                  Unmapped country
                </span>
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
          onCountrySelect={handleMapCountrySelect}
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
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Mail size={14} />}
              loading={bulkFindingEmails}
              onClick={() => void handleBulkFindEmails()}
            >
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
        <div className="c360-p-0">
          <ContactsDataTable
            contacts={contacts}
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
            onVisibleColumnsResolved={handleVisibleColumnsResolved}
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
            onOpenCompanyDrawer={handleOpenCompanyDrawer}
          />
        </div>
      </Card>

      <CompanyDrawerPanel
        anchor={companyDrawerAnchor}
        isOpen={!!companyDrawerAnchor}
        onClose={() => setCompanyDrawerAnchor(null)}
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
                await contactsService.delete(id);
                deleted += 1;
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                if (
                  msg.includes("ERR_CONTACT_NOT_FOUND") ||
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
                `${failures.length} contact(s) failed: ${preview}${more}`,
              );
            }
            if (alreadyGone > 0 && deleted === 0 && failures.length === 0) {
              toast.info(
                `${alreadyGone} contact(s) were already deleted or missing.`,
              );
            } else if (alreadyGone > 0 && deleted > 0) {
              toast.success(
                `Deleted ${deleted} contact(s). ${alreadyGone} were already removed.`,
              );
            } else if (deleted > 0) {
              toast.success(`Deleted ${deleted} contact(s).`);
            }
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
