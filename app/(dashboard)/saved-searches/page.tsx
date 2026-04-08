"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, Plus, RefreshCw } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  savedSearchesService,
  type SavedSearch,
} from "@/services/graphql/savedSearchesService";
import { SavedSearchFilterBar } from "@/components/feature/saved-searches/SavedSearchFilterBar";
import { SavedSearchTable } from "@/components/feature/saved-searches/SavedSearchTable";
import {
  SavedSearchCreateModal,
  SavedSearchEditModal,
  SavedSearchDeleteModal,
  type SavedSearchFormState,
} from "@/components/feature/saved-searches/SavedSearchFormModal";
import { cn } from "@/lib/utils";

const EMPTY_FORM: SavedSearchFormState = {
  name: "",
  type: "contact",
  description: "",
  searchTerm: "",
};

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] =
    useState<SavedSearchFormState>(EMPTY_FORM);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<SavedSearch | null>(null);
  const [editForm, setEditForm] = useState<SavedSearchFormState>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSearches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await savedSearchesService.list({
        type: typeFilter || undefined,
        limit: 100,
      });
      setSearches(res.savedSearches.listSavedSearches.searches);
      setTotal(res.savedSearches.listSavedSearches.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    void fetchSearches();
  }, [fetchSearches]);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.type) return;
    setCreating(true);
    try {
      await savedSearchesService.create({
        name: createForm.name,
        type: createForm.type,
        description: createForm.description || null,
        searchTerm: createForm.searchTerm || null,
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      await fetchSearches();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (s: SavedSearch) => {
    setEditTarget(s);
    setEditForm({
      name: s.name,
      type: s.type,
      description: s.description ?? "",
      searchTerm: s.searchTerm ?? "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditing(true);
    try {
      await savedSearchesService.update(editTarget.id, {
        name: editForm.name,
        description: editForm.description || null,
        searchTerm: editForm.searchTerm || null,
      });
      setEditOpen(false);
      setEditTarget(null);
      await fetchSearches();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await savedSearchesService.delete(deleteTarget);
      setDeleteTarget(null);
      await fetchSearches();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = searches.filter(
    (s) =>
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">
            <Bookmark size={22} className="c360-inline-icon c360-mr-2" />
            Saved Searches
          </h1>
          <p className="c360-page-header__subtitle">
            {total.toLocaleString()} saved searches
          </p>
        </div>
        <div className="c360-badge-row">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
            }
            onClick={fetchSearches}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            New Search
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          className="c360-mb-4"
        >
          {error}
        </Alert>
      )}

      <SavedSearchFilterBar
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        onSearchChange={setSearchQuery}
        onTypeChange={setTypeFilter}
      />

      <SavedSearchTable
        searches={filtered}
        loading={loading}
        onNew={() => setCreateOpen(true)}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <SavedSearchCreateModal
        open={createOpen}
        form={createForm}
        loading={creating}
        onClose={() => {
          setCreateOpen(false);
          setCreateForm(EMPTY_FORM);
        }}
        onChange={setCreateForm}
        onSubmit={handleCreate}
      />

      <SavedSearchEditModal
        open={editOpen}
        form={editForm}
        loading={editing}
        onClose={() => {
          setEditOpen(false);
          setEditTarget(null);
        }}
        onChange={setEditForm}
        onSubmit={handleEdit}
      />

      <SavedSearchDeleteModal
        open={!!deleteTarget}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </DashboardPageLayout>
  );
}
