"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit2, Mail, X, RefreshCw, Sparkles, Plus } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";
import { FEATURE_GATES } from "@/lib/featureAccess";
import { useRole } from "@/context/RoleContext";
import { useCampaignTemplates } from "@/hooks/useCampaignTemplates";
import { templateHtmlBody } from "@/lib/templateListMapping";
import { campaignsService } from "@/services/graphql/campaignsService";

const CATEGORY_COLOR: Record<string, string> = {
  welcome: "green",
  newsletter: "blue",
  promo: "yellow",
  followup: "gray",
  custom: "gray",
};

/** Go-style merge fields from `25_CAMPAIGN_TEMPLATES_MODULE.md` (copy for editors). */
const MERGE_TOKENS: { label: string; token: string }[] = [
  { label: "First name", token: "{{.FirstName}}" },
  { label: "Last name", token: "{{.LastName}}" },
  { label: "Email", token: "{{.Email}}" },
  { label: "Company", token: "{{.Company}}" },
  { label: "Unsubscribe URL", token: "{{.UnsubscribeURL}}" },
];

export default function CampaignTemplatesPage() {
  const { checkAccess } = useRole();
  const canAccess = checkAccess("campaigns");
  const { templates, loading, error, notConfigured, refresh, clearError } =
    useCampaignTemplates();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    subject: "",
    body: "",
    category: "",
  });
  const [creating, setCreating] = useState(false);

  const previewRow = templates.find((t) => t.id === previewId);

  const CATEGORY_OPTIONS = [
    { value: "", label: "— None —" },
    { value: "welcome", label: "Welcome" },
    { value: "newsletter", label: "Newsletter" },
    { value: "promo", label: "Promo" },
    { value: "followup", label: "Follow-up" },
    { value: "custom", label: "Custom" },
  ];

  const handleCreate = async () => {
    if (!newForm.name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    setCreating(true);
    try {
      await campaignsService.createCampaignTemplate({
        name: newForm.name,
        subject: newForm.subject || null,
        body: newForm.body || null,
        category: newForm.category || null,
      });
      toast.success("Template created.");
      setNewOpen(false);
      setNewForm({ name: "", subject: "", body: "", category: "" });
      void refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create template.",
      );
    } finally {
      setCreating(false);
    }
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Copied merge token");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (!canAccess) {
    return (
      <DashboardPageLayout>
        <div className="c360-p-6">
          <h1 className="c360-standalone-header__title">Email Templates</h1>
          <Alert variant="warning" className="c360-mt-4">
            {FEATURE_GATES.campaigns.label} (including templates) is available
            on <strong>Professional</strong> and <strong>Enterprise</strong>{" "}
            plans. <Link href={ROUTES.BILLING}>View billing</Link> to upgrade.
          </Alert>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout>
      <div className="c360-p-6">
        <div className="c360-page-header">
          <div className="c360-standalone-header c360-mb-0">
            <h1 className="c360-standalone-header__title">Email Templates</h1>
            <p className="c360-standalone-header__subtitle">
              Email templates from the campaign satellite.
            </p>
          </div>
          <div className="c360-badge-row">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
              Refresh
            </Button>
            <Link href={ROUTES.CAMPAIGNS}>
              <Button variant="outline" size="sm" type="button">
                Campaigns
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => setNewOpen(true)}
            >
              <Plus size={14} />
              New template
            </Button>
          </div>
        </div>

        {error && (
          <Alert
            variant="danger"
            className="c360-mb-4"
            onClose={() => clearError()}
          >
            {error}
          </Alert>
        )}

        {notConfigured && (
          <Alert variant="warning" className="c360-mb-4">
            Campaign service is not configured (CAMPAIGN_API_URL not set).
            Templates will appear here once the satellite service is connected.
          </Alert>
        )}

        {loading ? (
          <p className="c360-page-subtitle">Loading templates…</p>
        ) : !notConfigured && templates.length === 0 ? (
          <Card>
            <div className="c360-empty-state">
              <Mail size={36} className="c360-mb-4 c360-opacity-30" />
              <p>No templates returned from the campaign service.</p>
            </div>
          </Card>
        ) : (
          <div className="c360-widget-grid">
            {templates.map((row) => (
              <Card key={row.id}>
                <div className="c360-card-inner-pad">
                  <div className="c360-flex c360-items-start c360-justify-between c360-mb-3">
                    <div className="c360-flex c360-items-center c360-gap-2">
                      <Mail size={16} className="c360-text-primary" />
                      <span className="c360-text-sm c360-font-semibold">
                        {row.name}
                      </span>
                    </div>
                    <div className="c360-flex c360-items-center c360-gap-1">
                      {row.isAiGenerated && (
                        <Badge
                          color="primary"
                          title="AI-generated (satellite flag)"
                        >
                          <Sparkles size={12} className="c360-mr-1" />
                          AI
                        </Badge>
                      )}
                      {row.category && (
                        <Badge
                          color={
                            (CATEGORY_COLOR[String(row.category)] ?? "gray") as
                              | "green"
                              | "blue"
                              | "yellow"
                              | "gray"
                          }
                        >
                          {String(row.category)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {row.subject && (
                    <div className="c360-text-sm c360-text-muted c360-mb-1">
                      <strong>Subject:</strong> {row.subject}
                    </div>
                  )}
                  {row.createdAt && (
                    <div className="c360-text-xs c360-text-muted c360-mb-3">
                      Created {formatRelativeTime(String(row.createdAt))}
                    </div>
                  )}
                  <div className="c360-flex c360-flex-wrap c360-gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="c360-flex-1"
                      onClick={() => setPreviewId(row.id)}
                    >
                      <Edit2 size={13} /> Preview
                    </Button>
                    <Link
                      href={`${ROUTES.CAMPAIGNS_TEMPLATES}/${encodeURIComponent(row.id)}/edit`}
                    >
                      <Button variant="secondary" size="sm" type="button">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {previewId && previewRow && (
          <div className="c360-editor-overlay">
            <div className="c360-editor-modal">
              <div className="c360-editor-modal__header">
                <h3 className="c360-editor-modal__title">
                  Preview: {previewRow.name}
                </h3>
                <button
                  type="button"
                  aria-label="Close preview"
                  title="Close"
                  onClick={() => setPreviewId(null)}
                  className="c360-icon-btn"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="c360-editor-modal__body">
                <div className="c360-mb-3">
                  <label className="c360-form-label-block c360-font-semibold c360-mb-1-5">
                    Subject line
                  </label>
                  <div className="c360-input c360-opacity-95">
                    {previewRow.subject ?? "—"}
                  </div>
                </div>
                <div className="c360-mb-3">
                  <div className="c360-flex c360-items-center c360-justify-between c360-flex-wrap c360-mb-1-5 c360-gap-2">
                    <label className="c360-text-sm c360-font-semibold">
                      Merge tokens (copy)
                    </label>
                    <div className="c360-flex-row-wrap c360-gap-1">
                      {MERGE_TOKENS.map(({ label, token }) => (
                        <button
                          key={token}
                          type="button"
                          title={`Copy ${token}`}
                          onClick={() => void copyToken(token)}
                          className="c360-var-token"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="c360-text-sm c360-font-semibold c360-block c360-mb-1-5">
                    HTML body (from satellite)
                  </label>
                  <div className="c360-tiptap__editor-wrap c360-template-preview-html">
                    {templateHtmlBody(previewRow.raw).trim() ? (
                      templateHtmlBody(previewRow.raw)
                    ) : (
                      <span className="c360-text-muted">
                        No HTML body in this payload (satellite may omit body in
                        list responses).
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="c360-editor-modal__footer">
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => setPreviewId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Template Modal */}
      <Modal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        title="New Template"
        size="sm"
      >
        <div className="c360-section-stack">
          <Input
            label="Template name"
            value={newForm.name}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="e.g. Welcome Email"
            required
          />
          <Input
            label="Subject line"
            value={newForm.subject}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, subject: e.target.value }))
            }
            placeholder="e.g. Welcome to Contact360!"
          />
          <Select
            label="Category"
            value={newForm.category}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, category: e.target.value }))
            }
            options={CATEGORY_OPTIONS}
          />
          <div className="c360-field">
            <label className="c360-label">HTML body (optional)</label>
            <textarea
              className="c360-input c360-textarea-code"
              rows={6}
              value={newForm.body}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, body: e.target.value }))
              }
              placeholder="<p>Hello {{.FirstName}},</p>"
            />
          </div>
          <div className="c360-modal-actions">
            <Button variant="secondary" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button loading={creating} onClick={() => void handleCreate()}>
              Create template
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardPageLayout>
  );
}
