"use client";

import { Fragment, useState } from "react";
import {
  Linkedin,
  Save,
  RefreshCw,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileJson,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { DataState } from "@/components/shared/DataState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useSalesNavigator } from "@/hooks/useSalesNavigator";
import { toast } from "sonner";
import type { SalesNavigatorProfile } from "@/services/graphql/salesNavigatorService";
import type { UserScrapingRecord } from "@/services/graphql/salesNavigatorService";
import { SALES_NAV_SAVE_MAX_PROFILES } from "@/lib/salesNavigatorBulk";

export default function SalesNavigatorPage() {
  const {
    records,
    total,
    hasNext,
    hasPrevious,
    offset,
    limit,
    loading,
    saving,
    error,
    saveProfiles,
    saveProfilesBulkJson,
    refresh,
    nextPage,
    prevPage,
  } = useSalesNavigator({ limit: 50 });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState("");

  const [form, setForm] = useState<Partial<SalesNavigatorProfile>>({
    name: "",
    title: "",
    company: "",
    location: "",
    profileUrl: "",
    companyUrl: "",
    connectionDegree: "",
    email: "",
    mobilePhone: "",
  });

  const handleSaveProfile = async () => {
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    const profile: SalesNavigatorProfile = {
      name: form.name.trim(),
      title: form.title ?? null,
      company: form.company ?? null,
      location: form.location ?? null,
      profileUrl: form.profileUrl ?? null,
      companyUrl: form.companyUrl?.trim() || null,
      connectionDegree: form.connectionDegree?.trim() || null,
      email: form.email?.trim() || null,
      mobilePhone: form.mobilePhone?.trim() || null,
      imageUrl: null,
    };
    try {
      const result = await saveProfiles([profile]);
      const msg = result.errors?.length
        ? `Saved ${result.savedCount} of ${result.totalProfiles} — ${result.errors.join("; ")}`
        : `Saved ${result.savedCount} of ${result.totalProfiles} profile(s)`;
      toast.success(msg);
      setAddOpen(false);
      setForm({
        name: "",
        title: "",
        company: "",
        location: "",
        profileUrl: "",
        companyUrl: "",
        connectionDegree: "",
        email: "",
        mobilePhone: "",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleBulkImport = async () => {
    try {
      const result = await saveProfilesBulkJson(bulkJson);
      const msg = result.errors.length
        ? `Saved ${result.savedCount} of ${result.totalProfiles} — ${result.errors.slice(0, 5).join("; ")}${result.errors.length > 5 ? "…" : ""}`
        : `Saved ${result.savedCount} of ${result.totalProfiles} profile(s)`;
      toast.success(msg);
      setBulkOpen(false);
      setBulkJson("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk import failed");
    }
  };

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">
            <Linkedin size={22} className="c360-inline-icon c360-mr-2" />
            Sales Navigator
          </h1>
          <p className="c360-page-header__subtitle">
            Saved LinkedIn profiles and scraping records (gateway + satellite)
          </p>
        </div>
        <div className="c360-badge-row">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
            }
            onClick={refresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileJson size={14} />}
            onClick={() => setBulkOpen(true)}
          >
            Import JSON
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setAddOpen(true)}
          >
            Add Profile
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="c360-mb-4">
          {error}
        </Alert>
      )}

      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Sales Navigator Profile"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              leftIcon={<Save size={14} />}
              loading={saving}
              onClick={() => void handleSaveProfile()}
            >
              Save Profile
            </Button>
          </>
        }
      >
        <div className="c360-section-stack c360-gap-3">
          <Input
            label="Name *"
            value={form.name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
          />
          <Input
            label="Title"
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Job title"
          />
          <Input
            label="Company"
            value={form.company ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, company: e.target.value }))
            }
            placeholder="Company name"
          />
          <Input
            label="Location"
            value={form.location ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
            placeholder="City, Country"
          />
          <Input
            label="Profile URL"
            value={form.profileUrl ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, profileUrl: e.target.value }))
            }
            placeholder="https://www.linkedin.com/sales/lead/… or /in/…"
          />
          <Input
            label="Company URL"
            value={form.companyUrl ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyUrl: e.target.value }))
            }
            placeholder="https://www.linkedin.com/sales/company/…"
          />
          <Input
            label="Connection degree"
            value={form.connectionDegree ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, connectionDegree: e.target.value }))
            }
            placeholder="e.g. 1st, 2nd"
          />
          <Input
            label="Email"
            value={form.email ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Optional"
          />
          <Input
            label="Mobile phone"
            value={form.mobilePhone ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, mobilePhone: e.target.value }))
            }
            placeholder="Optional"
          />
        </div>
      </Modal>

      <Modal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Import profiles (JSON array)"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBulkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              leftIcon={<FileJson size={14} />}
              loading={saving}
              onClick={() => void handleBulkImport()}
            >
              Import
            </Button>
          </>
        }
      >
        <p className="c360-text-sm c360-text-muted c360-mb-3">
          Paste a JSON array of profile objects (snake_case per satellite:{" "}
          <code className="c360-mono">profile_url</code>,{" "}
          <code className="c360-mono">company_url</code>, etc.). Max{" "}
          {SALES_NAV_SAVE_MAX_PROFILES} per request; larger pastes are chunked
          automatically.
        </p>
        <textarea
          className="c360-input c360-textarea-mono-md"
          rows={12}
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          placeholder='[{"name":"…","profile_url":"https://…"}]'
        />
      </Modal>

      <div className="c360-flex-row-wrap c360-gap-4 c360-mb-6">
        <Card padding="sm" className="c360-flex-1-1-160">
          <div className="c360-stat-mini">
            <Users size={24} className="c360-stat-mini__icon" />
            <p className="c360-stat-mini__value">{total}</p>
            <p className="c360-stat-mini__label">Total Records</p>
          </div>
        </Card>
      </div>

      <Card
        title="Scraping Records"
        subtitle={`${total.toLocaleString()} total records · showing ${offset + 1}–${Math.min(offset + limit, total)}`}
      >
        <DataState
          loading={loading}
          empty={!loading && records.length === 0}
          emptyTitle="No Sales Navigator records yet"
          emptyMessage="Use the Chrome extension to save LinkedIn profiles and they will appear here."
        />
        {!loading && records.length > 0 && (
          <>
            <div className="c360-table-wrapper">
              <table className="c360-table">
                <thead>
                  <tr>
                    <th className="c360-w-8" />
                    <th>Record ID</th>
                    <th>Source</th>
                    <th>Version</th>
                    <th>Created</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r: UserScrapingRecord) => (
                    <Fragment key={r.id}>
                      <tr>
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId((prev) =>
                                prev === r.id ? null : r.id,
                              )
                            }
                            title={expandedId === r.id ? "Collapse" : "Expand"}
                            className="c360-icon-btn c360-p-0-5"
                          >
                            {expandedId === r.id ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        </td>
                        <td className="c360-mono c360-text-xs">
                          {r.id.slice(0, 8)}…
                        </td>
                        <td className="c360-text-sm">{r.source}</td>
                        <td className="c360-text-sm c360-text-muted">
                          {r.version}
                        </td>
                        <td className="c360-text-sm c360-text-muted">
                          {formatRelativeTime(r.createdAt)}
                        </td>
                        <td>
                          <Badge color="green" className="c360-text-xs">
                            Saved
                          </Badge>
                        </td>
                      </tr>
                      {expandedId === r.id && (
                        <tr>
                          <td colSpan={6} className="c360-p-0">
                            <pre className="c360-code-preview">
                              {JSON.stringify(
                                {
                                  id: r.id,
                                  userId: r.userId,
                                  timestamp: r.timestamp,
                                  source: r.source,
                                  version: r.version,
                                  searchContext: r.searchContext,
                                  pagination: r.pagination,
                                  userInfo: r.userInfo,
                                  applicationInfo: r.applicationInfo,
                                  createdAt: r.createdAt,
                                  updatedAt: r.updatedAt,
                                },
                                null,
                                2,
                              )}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="c360-table-footer">
              <span className="c360-text-sm c360-text-muted">
                {offset + 1}–{Math.min(offset + limit, total)} of{" "}
                {total.toLocaleString()}
              </span>
              <div className="c360-badge-row">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft size={14} />}
                  onClick={prevPage}
                  disabled={!hasPrevious || loading}
                  type="button"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNext || loading}
                  type="button"
                >
                  Next
                  <ChevronRight size={14} className="c360-ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </DashboardPageLayout>
  );
}
