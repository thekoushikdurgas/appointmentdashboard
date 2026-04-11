"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Download,
  Trash2,
  Mail,
  Filter,
  Upload,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { parseOperationError } from "@/lib/errorParser";
import { PageHeader } from "@/components/patterns/PageHeader";
import { WorldMap } from "@/components/shared/WorldMap";
import { useContacts } from "@/hooks/useContacts";
import { useContactFilters } from "@/hooks/useContactFilters";
import { useCountryAggregates } from "@/hooks/useCountryAggregates";
import { useRole } from "@/context/RoleContext";
import {
  ContactsDataTable,
  CONTACTS_DT_COLUMN_IDS,
  CONTACTS_DT_DEFAULT_COLUMNS,
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
    refresh,
  } = useContacts();

  const { data: countryData, loading: countryLoading } = useCountryAggregates();

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
  const [facetValues, setFacetValues] = useState<Record<string, string>>({});
  const { sections: filterSections, loadFilterData } = useContactFilters();
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
    for (const [key, val] of Object.entries(facetValues)) {
      if (val != null && String(val).trim() !== "") {
        sidebar.push(sidebarCond(key, "eq", String(val).trim()));
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
        onFacetChange={(key, val) =>
          setFacetValues((prev) => ({ ...prev, [key]: val }))
        }
        onSectionExpand={loadFilterData}
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
    ],
  );

  return (
    <DataPageLayout filters={filtersSidebar} className="c360-contacts-page">
      <PageHeader
        title="Contacts"
        subtitle={`${total.toLocaleString()} contacts`}
        actions={
          <>
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
                onClick={clearVqlQuery}
                title="Clear advanced filters"
              >
                ✕ Clear
              </Button>
            ) : null}
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
              variant="secondary"
              size="sm"
              leftIcon={<Globe size={16} />}
              onClick={() => setMapModalOpen(true)}
            >
              Map View
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setCreateOpen(true)}
            >
              Add Contact
            </Button>
          </>
        }
      />

      <Modal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title="Contact distribution"
        size="xl"
        className="c360-contacts-map-modal"
      >
        <p className="c360-text-sm c360-text-muted c360-mb-4">
          Contacts by country. Hover a region for counts.
        </p>
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
      />

      <ContactExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        vqlForExport={exportVql}
        visibleColumnIds={visibleColumns}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        variant="dashboard"
        className="c360-mb-4"
      >
        <TabsList>
          {CONTACT_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {t.value === "total" ? ` (${total.toLocaleString()})` : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="c360-stat-grid c360-mb-4">
        <div className="c360-stat-tile">
          <div className="c360-stat-tile__label">Total (list)</div>
          <div className="c360-stat-tile__value">{total.toLocaleString()}</div>
        </div>
        <div className="c360-stat-tile">
          <div className="c360-stat-tile__label">Verified on page</div>
          <div className="c360-stat-tile__value">{verifiedOnPage}</div>
        </div>
        <div className="c360-stat-tile">
          <div className="c360-stat-tile__label">Rows this page</div>
          <div className="c360-stat-tile__value">{contacts.length}</div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="c360-floating-bar">
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

      <Card title="Contacts" padding="none" className="c360-mb-4">
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
