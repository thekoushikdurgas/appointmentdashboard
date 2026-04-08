"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/shared/Skeleton";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { useResumeOne } from "@/hooks/useResumeOne";
import { resumeService } from "@/services/graphql/resumeService";
import { getResumeDisplayTitle } from "@/lib/resumeDisplay";
import { isResumeServiceUnavailableMessage } from "@/lib/resumeErrors";
import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : undefined;

  const { record, loading, error, refresh, clearError } = useResumeOne(id);
  const [jsonText, setJsonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (record) {
      setJsonText(JSON.stringify(record.resumeData ?? {}, null, 2));
    }
  }, [record]);

  const title = useMemo(() => {
    if (!record) return "Resume";
    return getResumeDisplayTitle(
      record.resumeData as Record<string, unknown>,
      record.id,
    );
  }, [record]);

  const handleSave = async () => {
    if (!record) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      toast.error("Invalid JSON — fix syntax and try again.");
      return;
    }
    setSaving(true);
    try {
      await resumeService.save({ resumeData: parsed, id: record.id });
      toast.success("Resume saved");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    setDeleting(true);
    try {
      await resumeService.delete(record.id);
      toast.success("Resume deleted");
      router.push(ROUTES.RESUME);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const overviewBasics = record?.resumeData
    ? ((record.resumeData as Record<string, unknown>).basics as
        | Record<string, unknown>
        | undefined)
    : undefined;

  if (!id) {
    return (
      <DashboardPageLayout>
        <Alert variant="danger">Invalid resume id.</Alert>
      </DashboardPageLayout>
    );
  }

  const unavailable = error && isResumeServiceUnavailableMessage(error);

  return (
    <DashboardPageLayout>
      <PageHeader
        title={loading ? "Resume" : title}
        subtitle="Edit JSON stored via the Resume AI service (GraphQL CRUD)"
        actions={
          <div className="c360-badge-row">
            <Link href={ROUTES.RESUME}>
              <Button variant="ghost" size="sm" type="button">
                <ArrowLeft size={15} />
                All resumes
              </Button>
            </Link>
            {record && (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  loading={saving}
                  leftIcon={<Save size={14} />}
                  onClick={() => void handleSave()}
                >
                  Save JSON
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <Alert
          variant={unavailable ? "warning" : "danger"}
          className="c360-mb-4"
          onClose={() => clearError()}
        >
          {unavailable
            ? "Resume service may be unavailable (gateway/proxy or resumeai). Try again later."
            : error}
        </Alert>
      )}

      {loading ? (
        <Skeleton height={320} />
      ) : !record ? (
        <Card>
          <p className="c360-text-muted">Resume not found or failed to load.</p>
          <Link href={ROUTES.RESUME}>Back to list</Link>
        </Card>
      ) : (
        <Tabs defaultValue="overview" variant="underline">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="c360-mt-4">
            <Card>
              <div className="c360-card-inner-pad">
                <p className="c360-text-sm c360-text-muted c360-mb-3">
                  Derived from <code className="c360-mono">resumeData</code>.
                  For full structure see JSON tab or resumeai models.
                </p>
                {overviewBasics && typeof overviewBasics === "object" ? (
                  <dl className="c360-section-stack c360-gap-2">
                    {["name", "email", "label", "summary"].map((k) =>
                      overviewBasics[k] != null ? (
                        <div key={k}>
                          <dt className="c360-text-xs c360-text-muted">{k}</dt>
                          <dd className="c360-text-sm">
                            {String(overviewBasics[k])}
                          </dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                ) : (
                  <p className="c360-text-sm c360-text-muted">
                    No <code className="c360-mono">basics</code> object in{" "}
                    <code className="c360-mono">resumeData</code>. Use the JSON
                    tab to add JSON Resume fields.
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="json" className="c360-mt-4">
            <Card>
              <div className="c360-card-inner-pad">
                <label
                  className="c360-label c360-mb-2"
                  htmlFor="resume-json-editor"
                >
                  resumeData (JSON)
                </label>
                <textarea
                  id="resume-json-editor"
                  className="c360-input c360-resume-json-textarea"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete resume"
        footer={
          <>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>Delete this resume permanently? This cannot be undone.</p>
      </Modal>
    </DashboardPageLayout>
  );
}
