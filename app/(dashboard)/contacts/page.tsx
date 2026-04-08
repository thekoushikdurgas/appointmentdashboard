"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Download, Trash2, Mail, Filter, Upload } from "lucide-react";
import { toast } from "sonner";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { parseOperationError } from "@/lib/errorParser";
import { PageHeader } from "@/components/patterns/PageHeader";
import { WorldMap } from "@/components/shared/WorldMap";
import { useContacts } from "@/hooks/useContacts";
import { useContactFilters } from "@/hooks/useContactFilters";
import { useCountryAggregates } from "@/hooks/useCountryAggregates";
import { useRole } from "@/context/RoleContext";
import { ContactsDataTable } from "@/components/feature/contacts/ContactsDataTable";
import { ContactFilterBar } from "@/components/feature/contacts/ContactFilterBar";
import { ContactCreateModal } from "@/components/feature/contacts/ContactCreateModal";
import { ContactExportModal } from "@/components/feature/contacts/ContactExportModal";
import { ContactImportModal } from "@/components/feature/contacts/ContactImportModal";
import { contactsService } from "@/services/graphql/contactsService";
import dynamic from "next/dynamic";
import type { VQLQuery } from "@/components/contacts/VQLQueryBuilder";

const VQLQueryBuilder = dynamic(
  () =>
    import("@/components/contacts/VQLQueryBuilder").then(
      (m) => m.VQLQueryBuilder,
    ),
  { ssr: false },
);

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
  const [showMap, setShowMap] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [vqlOpen, setVqlOpen] = useState(false);
  const [activeVqlQuery, setActiveVqlQuery] = useState<VQLQuery | null>(null);
  const [facetValues, setFacetValues] = useState<Record<string, string>>({});
  const { sections: filterSections, loadFilterData } = useContactFilters();
  const { isSuperAdmin } = useRole();
  const [importOpen, setImportOpen] = useState(false);

  const handleVqlApply = (query: VQLQuery) => {
    setActiveVqlQuery(query);
    const filters = query.filters;
    if (!filters) {
      applyVqlQuery({});
      return;
    }
    const conditions = [
      ...(filters.and ?? []).filter(
        (c): c is { field: string; operator: string; value: string | null } =>
          "field" in c,
      ),
      ...(filters.or ?? []).filter(
        (c): c is { field: string; operator: string; value: string | null } =>
          "field" in c,
      ),
    ].map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.value as unknown as Record<string, unknown>,
    }));
    const useAllOf = (filters.and?.length ?? 0) > 0;
    applyVqlQuery({
      filters: useAllOf
        ? { allOf: [{ conditions }] }
        : { anyOf: [{ conditions }] },
    });
  };

  const clearVqlQuery = () => {
    setActiveVqlQuery(null);
    applyVqlQuery({});
  };

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
    const conditions: Array<{
      field: string;
      operator: string;
      value: unknown;
    }> = [];
    if (search.trim())
      conditions.push({
        field: "email",
        operator: "contains",
        value: search.trim(),
      });
    if (statusFilter !== "All" && STATUS_MAP[statusFilter]) {
      conditions.push({
        field: "emailStatus",
        operator: "eq",
        value: STATUS_MAP[statusFilter],
      });
    }
    const sort = SORT_MAP[sortBy] ?? SORT_MAP.newest;
    applyVqlQuery({
      filters:
        conditions.length > 0
          ? {
              conditions:
                conditions as import("@/graphql/generated/types").VqlConditionInput[],
            }
          : undefined,
      sortBy: sort.field,
      sortDirection: sort.direction,
    });
  }, [search, statusFilter, sortBy, applyVqlQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <DataPageLayout>
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
              {activeVqlQuery ? "Edit Filters" : "Advanced Filter"}
            </Button>
            {activeVqlQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearVqlQuery}
                title="Clear advanced filters"
              >
                ✕ Clear
              </Button>
            )}
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
              Add Contact
            </Button>
          </>
        }
      />

      <VQLQueryBuilder
        open={vqlOpen}
        onClose={() => setVqlOpen(false)}
        onApply={handleVqlApply}
        initialQuery={activeVqlQuery}
      />

      <ContactExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        vqlForExport={exportVql}
      />

      <Card
        title="Contact Distribution"
        subtitle="Contacts by country"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMap((v) => !v)}
          >
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
        }
        className="c360-mb-4"
      >
        {showMap && (
          <WorldMap
            data={countryData}
            height={countryLoading && countryData.length === 0 ? 60 : 300}
          />
        )}
      </Card>

      <ContactFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterSections={filterSections}
        filterValues={facetValues}
        onFilterChange={(key, val) =>
          setFacetValues((prev) => ({ ...prev, [key]: val }))
        }
        onSectionExpand={loadFilterData}
      />

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
