"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { DataState } from "@/components/shared/DataState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ResumeCard } from "@/components/feature/resume/ResumeCard";
import { useResume } from "@/hooks/useResume";
import { type ResumeRecord } from "@/services/graphql/resumeService";
import { isResumeServiceUnavailableMessage } from "@/lib/resumeErrors";
import { resumeRoute } from "@/lib/routes";
import { toast } from "sonner";

export default function ResumePage() {
  const { resumes, loading, error, save, remove, clearError } = useResume();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ResumeRecord | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setTitleInput("");
    setModalOpen(true);
  };

  const openEdit = (r: ResumeRecord) => {
    setEditing(r);
    setTitleInput((r.resumeData as { title?: string })?.title ?? "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!titleInput.trim()) return;
    setSaving(true);
    try {
      await save(
        {
          ...((editing?.resumeData as Record<string, unknown>) ?? {}),
          title: titleInput.trim(),
        },
        editing?.id,
      );
      toast.success(editing ? "Resume updated" : "Resume created");
      setModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget);
      toast.success("Resume deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete resume");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const unavailable = error && isResumeServiceUnavailableMessage(error);

  return (
    <DashboardPageLayout>
      <PageHeader
        title="Resume"
        subtitle="Manage résumés via GraphQL (resumeai proxy). AI parse/ATS endpoints are not in the gateway yet."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            New Resume
          </Button>
        }
      />

      {error && (
        <Alert
          variant={unavailable ? "warning" : "danger"}
          className="c360-mb-4"
          onClose={() => clearError()}
        >
          {unavailable
            ? "Resume service may be unavailable (check RESUME_AI_* on the gateway or resumeai health)."
            : error}
        </Alert>
      )}

      <DataState
        loading={loading}
        empty={!loading && resumes.length === 0}
        emptyTitle="No resumes yet"
        emptyMessage="Click 'New Resume' to create your first one."
      />

      {!loading && resumes.length > 0 && (
        <div className="c360-widget-grid">
          {resumes.map((r) => (
            <ResumeCard
              key={r.id}
              resume={r}
              detailHref={resumeRoute(r.id)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit title" : "New Resume"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {editing ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="c360-form-group">
          <label className="c360-label" htmlFor="resume-title">
            Display title
          </label>
          <input
            id="resume-title"
            className="c360-input"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="e.g. Software Engineer Resume"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <p className="c360-text-xs c360-text-muted c360-mt-2">
            Stored in <code className="c360-mono">resumeData.title</code>. Open
            the resume to edit full JSON (basics, experience, …).
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Resume"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete this resume? This cannot be undone.
        </p>
      </Modal>
    </DashboardPageLayout>
  );
}
