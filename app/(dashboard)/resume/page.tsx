"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { DataState } from "@/components/shared/DataState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { AiResumeCard } from "@/components/feature/resume/AiResumeCard";
import { ResumeUploadDropzone } from "@/components/feature/resume/ResumeUploadDropzone";
import { isResumeAiConfigured } from "@/lib/config";
import {
  resumeAiDelete,
  resumeAiList,
  resumeAiSetMaster,
  resumeAiUpload,
} from "@/lib/resumeAiClient";
import { resumeRoute } from "@/lib/routes";
import { toast } from "sonner";

export default function ResumePage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof resumeAiList>>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isResumeAiConfigured()) {
      setError(
        "Résumé AI is disabled: set NEXT_PUBLIC_API_URL on production builds, or NEXT_PUBLIC_RESUME_AI_URL for a direct scraper host.",
      );
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await resumeAiList(true);
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await resumeAiUpload(file);
      toast.success(res.message);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resumeAiDelete(deleteTarget);
      toast.success("Résumé deleted");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const promoteMaster = async (id: string) => {
    try {
      await resumeAiSetMaster(id);
      toast.success("Master résumé updated");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set master");
    }
  };

  return (
    <DashboardPageLayout>
      <PageHeader
        title="Résumé AI"
        subtitle="Upload, tailor to job postings, score keywords, and export PDF. Requests go to `/resume/v1` on the API gateway (Bearer JWT). Dev uses a Next.js rewrite; override with NEXT_PUBLIC_RESUME_AI_URL for a direct scraper host."
      />

      {!isResumeAiConfigured() && (
        <Alert variant="warning" className="c360-mb-4">
          Résumé AI is not configured: set NEXT_PUBLIC_API_URL (production) or
          NEXT_PUBLIC_RESUME_AI_URL (optional direct scraper URL).
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          className="c360-mb-4"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <section className="c360-mb-8">
        <h2 className="c360-font-semibold c360-mb-3">Upload master résumé</h2>
        <ResumeUploadDropzone
          disabled={uploading || !isResumeAiConfigured()}
          onFile={onUpload}
        />
      </section>

      <DataState
        loading={loading}
        empty={!loading && items.length === 0}
        emptyTitle="No résumés yet"
        emptyMessage="Upload a PDF or DOCX above. The first successful upload becomes master unless you change it."
      />

      {!loading && items.length > 0 && (
        <div className="c360-widget-grid">
          {items.map((r) => (
            <AiResumeCard
              key={r.resume_id}
              resume={r}
              detailHref={resumeRoute(r.resume_id)}
              onDelete={setDeleteTarget}
              onSetMaster={promoteMaster}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete résumé"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>Delete this résumé from the AI store? This cannot be undone.</p>
      </Modal>
    </DashboardPageLayout>
  );
}
