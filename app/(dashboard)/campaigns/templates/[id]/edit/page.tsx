"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ROUTES } from "@/lib/routes";
import { useCampaignTemplates } from "@/hooks/useCampaignTemplates";
import { templateHtmlBody } from "@/lib/templateListMapping";
import { campaignsService } from "@/services/graphql/campaignsService";
import { toast } from "sonner";

/** Go-style merge fields from `25_CAMPAIGN_TEMPLATES_MODULE.md` */
const MERGE_TOKENS: { label: string; token: string }[] = [
  { label: "First name", token: "{{.FirstName}}" },
  { label: "Last name", token: "{{.LastName}}" },
  { label: "Email", token: "{{.Email}}" },
  { label: "Company", token: "{{.Company}}" },
  { label: "Unsubscribe URL", token: "{{.UnsubscribeURL}}" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "— None —" },
  { value: "welcome", label: "Welcome" },
  { value: "newsletter", label: "Newsletter" },
  { value: "promo", label: "Promo" },
  { value: "followup", label: "Follow-up" },
  { value: "custom", label: "Custom" },
];

export default function TemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { templates, loading: templatesLoading } = useCampaignTemplates();

  const row = templates.find((t) => t.id === id);

  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: "",
    category: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!row) return;
    setForm({
      name: row.name,
      subject: row.subject ?? "",
      body: templateHtmlBody(row.raw),
      category: row.category ?? "",
    });
    setDirty(false);
  }, [row]);

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const insertToken = (token: string) => {
    setForm((f) => ({ ...f, body: f.body + token }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await campaignsService.updateCampaignTemplate(id, {
        name: form.name || undefined,
        subject: form.subject || undefined,
        body: form.body || undefined,
        category: form.category || undefined,
      });
      toast.success("Template saved.");
      setDirty(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save template.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await campaignsService.deleteCampaignTemplate(id);
      toast.success("Template deleted.");
      router.push(ROUTES.CAMPAIGNS_TEMPLATES);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete template.",
      );
      setDeleting(false);
    }
  };

  if (templatesLoading) {
    return (
      <DashboardPageLayout>
        <div className="c360-page-header">
          <p className="c360-text-muted">Loading template…</p>
        </div>
      </DashboardPageLayout>
    );
  }

  if (!row) {
    return (
      <DashboardPageLayout>
        <div className="c360-page-header">
          <Alert variant="warning">
            Template <code>{id}</code> not found in the list from the satellite.
            It may have been deleted, or the satellite may not be configured.
          </Alert>
          <Link href={ROUTES.CAMPAIGNS_TEMPLATES}>
            <Button variant="secondary" size="sm">
              <ArrowLeft size={14} /> Back to templates
            </Button>
          </Link>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout>
      <div className="c360-p-6 c360-mx-auto c360-max-w-800">
        <div className="c360-flex c360-items-center c360-gap-3 c360-mb-6">
          <Link href={ROUTES.CAMPAIGNS_TEMPLATES}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={15} />
              Templates
            </Button>
          </Link>
          <h1 className="c360-standalone-header__title c360-mb-0">
            Edit Template
          </h1>
          {dirty && (
            <span className="c360-text-xs c360-text-muted">
              (unsaved changes)
            </span>
          )}
        </div>

        <div className="c360-section-stack">
          <Card>
            <div className="c360-card-inner-pad--lg">
              <div className="c360-section-stack">
                <Input
                  label="Template name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Welcome Email"
                />
                <Input
                  label="Default subject line"
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  placeholder="e.g. Welcome to Contact360!"
                />
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  options={CATEGORY_OPTIONS}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="c360-card-inner-pad--lg">
              <div className="c360-flex c360-items-center c360-justify-between c360-mb-3">
                <span className="c360-text-sm c360-font-semibold">
                  HTML body
                </span>
                <div className="c360-flex c360-flex-wrap c360-gap-1">
                  {MERGE_TOKENS.map(({ label, token }) => (
                    <button
                      key={token}
                      type="button"
                      title={`Insert ${token}`}
                      onClick={() => insertToken(token)}
                      className="c360-var-token"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="c360-input c360-textarea-code"
                rows={16}
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                placeholder="<p>Hello {{.FirstName}},</p>"
              />
            </div>
          </Card>

          <div className="c360-flex c360-items-center c360-justify-between">
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              leftIcon={<Trash2 size={14} />}
              onClick={() => void handleDelete()}
            >
              Delete template
            </Button>
            <Button
              variant="primary"
              loading={saving}
              leftIcon={<Save size={14} />}
              disabled={!dirty}
              onClick={() => void handleSave()}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
