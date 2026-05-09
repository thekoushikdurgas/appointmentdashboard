"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/shared/Skeleton";
import { PageHeader } from "@/components/patterns/PageHeader";
import { TailorPanel } from "@/components/feature/resume/TailorPanel";
import { DiffPreviewModal } from "@/components/feature/resume/DiffPreviewModal";
import { ResumePreview } from "@/components/feature/resume/ResumePreview";
import { TemplateSelector } from "@/components/feature/resume/TemplateSelector";
import { KeywordScore } from "@/components/feature/resume/KeywordScore";
import { CoverLetterPanel } from "@/components/feature/resume/CoverLetterPanel";
import { EnrichmentPanel } from "@/components/feature/resume/EnrichmentPanel";
import { isResumeAiConfigured } from "@/lib/config";
import type { ImproveResumeResponse } from "@/lib/resumeAiClient";
import {
  resumeAiConfirmImprove,
  resumeAiExportPdf,
  resumeAiCoverLetterPdf,
  resumeAiGenerateCoverLetter,
  resumeAiGet,
  resumeAiPreviewImprove,
  resumeAiScore,
  resumeAiUploadJobs,
} from "@/lib/resumeAiClient";
import { DEFAULT_IMPROVE_PROMPT_ID } from "@/lib/resumeAiPrompts";
import { ROUTES, resumeRoute } from "@/lib/routes";
import { toast } from "sonner";

function jobStorageKey(resumeId: string) {
  return `c360_resume_job_${resumeId}`;
}

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<Awaited<
    ReturnType<typeof resumeAiGet>
  > | null>(null);

  const [jobDescription, setJobDescription] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState(DEFAULT_IMPROVE_PROMPT_ID);
  const [savingJob, setSavingJob] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<ImproveResumeResponse | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [score, setScore] = useState<number | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  const [templateId, setTemplateId] = useState("swiss-single");
  const [coverLetter, setCoverLetter] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [clPdfLoading, setClPdfLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!id || !isResumeAiConfigured()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await resumeAiGet(id);
      setRecord(data);
      setCoverLetter(data.cover_letter ?? "");
      const stored =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(jobStorageKey(id))
          : null;
      setJobId(stored);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persistJobId = (jid: string) => {
    setJobId(jid);
    if (id && typeof window !== "undefined") {
      window.sessionStorage.setItem(jobStorageKey(id), jid);
    }
  };

  const saveJob = async () => {
    if (!id || !jobDescription.trim()) return;
    setSavingJob(true);
    try {
      const ids = await resumeAiUploadJobs([jobDescription.trim()], id);
      persistJobId(ids[0] ?? "");
      toast.success("Job description saved for this session");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save job");
    } finally {
      setSavingJob(false);
    }
  };

  const runPreview = async () => {
    if (!id || !jobId) return;
    setPreviewLoading(true);
    try {
      const res = await resumeAiPreviewImprove({
        resume_id: id,
        job_id: jobId,
        prompt_id: promptId,
      });
      setPreview(res);
      setDiffOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const runConfirm = async () => {
    if (!id || !jobId || !preview) return;
    setConfirming(true);
    try {
      const res = await resumeAiConfirmImprove({
        resume_id: id,
        job_id: jobId,
        improved_data: preview.data.resume_preview as Record<string, unknown>,
        improvements: preview.data.improvements,
      });
      toast.success("Tailored résumé saved");
      setDiffOpen(false);
      const newId = res.data.resume_id;
      if (newId && newId !== id) {
        router.push(resumeRoute(newId));
      } else {
        await refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Confirm failed");
    } finally {
      setConfirming(false);
    }
  };

  const computeScore = async () => {
    if (!id || !jobId) return;
    setScoreLoading(true);
    try {
      const s = await resumeAiScore(id, jobId);
      setScore(s.match_percentage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Score failed");
    } finally {
      setScoreLoading(false);
    }
  };

  const downloadResumePdf = async () => {
    if (!id) return;
    setPdfLoading(true);
    try {
      const blob = await resumeAiExportPdf(id, {
        template: templateId,
        pageSize: "A4",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setPdfLoading(false);
    }
  };

  const runCoverLetterGen = async () => {
    if (!id) return;
    setGenLoading(true);
    try {
      const r = await resumeAiGenerateCoverLetter(id);
      setCoverLetter(r.content);
      toast.success(r.message || "Cover letter generated");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenLoading(false);
    }
  };

  const downloadCoverPdf = async () => {
    if (!id) return;
    setClPdfLoading(true);
    try {
      const blob = await resumeAiCoverLetterPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cover PDF failed");
    } finally {
      setClPdfLoading(false);
    }
  };

  if (!id) {
    return (
      <DashboardPageLayout>
        <Alert variant="danger">Invalid résumé id.</Alert>
      </DashboardPageLayout>
    );
  }

  const processed = record?.processed_resume as Record<string, unknown> | null;
  const isTailored = Boolean(record?.parent_id);
  const title =
    record?.title?.trim() ||
    (processed?.personalInfo as { name?: string } | undefined)?.name ||
    id.slice(0, 8);

  return (
    <DashboardPageLayout>
      <PageHeader
        title={loading ? "Résumé" : String(title)}
        subtitle="Tailor with AI, enrich bullets, export PDF — served via `/resume/v1` on the API gateway"
        actions={
          <Link href={ROUTES.RESUME}>
            <Button variant="ghost" size="sm" type="button">
              <ArrowLeft size={15} />
              All résumés
            </Button>
          </Link>
        }
      />

      {!isResumeAiConfigured() && (
        <Alert variant="warning" className="c360-mb-4">
          Résumé AI is not configured for this environment.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="c360-mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton height={360} />
      ) : !record ? (
        <Card>
          <p className="c360-text-muted">Résumé not found.</p>
          <Link href={ROUTES.RESUME}>Back</Link>
        </Card>
      ) : (
        <Tabs defaultValue="tailor" variant="underline">
          <TabsList>
            <TabsTrigger value="tailor">Tailor</TabsTrigger>
            <TabsTrigger value="resume">Résumé</TabsTrigger>
            <TabsTrigger value="export">Cover letter & PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="tailor" className="c360-mt-4">
            <TailorPanel
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              selectedPromptId={promptId}
              onPromptChange={setPromptId}
              onSaveJob={() => void saveJob()}
              onPreview={() => void runPreview()}
              jobId={jobId}
              savingJob={savingJob}
              previewLoading={previewLoading}
              disabled={
                !isResumeAiConfigured() || record.raw_resume.processing_status !== "ready"
              }
            />
            {record.raw_resume.processing_status !== "ready" && (
              <p className="c360-text-sm c360-text-muted c360-mt-2">
                Parsing status:{" "}
                <code className="c360-mono">{record.raw_resume.processing_status}</code>
              </p>
            )}
          </TabsContent>

          <TabsContent value="resume" className="c360-mt-4 c360-space-y-4">
            <KeywordScore
              jobId={jobId}
              score={score}
              loading={scoreLoading}
              onCompute={() => void computeScore()}
            />
            <TemplateSelector value={templateId} onChange={setTemplateId} />
            <div className="c360-flex c360-flex-wrap c360-gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={pdfLoading}
                disabled={!processed}
                onClick={() => void downloadResumePdf()}
              >
                Download résumé PDF
              </Button>
            </div>
            {processed ? (
              <>
                <ResumePreview data={processed} />
                <EnrichmentPanel resumeId={id} disabled={!isResumeAiConfigured()} />
              </>
            ) : (
              <Card>
                <p className="c360-text-muted c360-text-sm">
                  No structured data yet — wait for parsing or fix upload.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="export" className="c360-mt-4">
            <CoverLetterPanel
              text={coverLetter}
              onChange={setCoverLetter}
              onGenerate={() => void runCoverLetterGen()}
              onDownloadPdf={() => void downloadCoverPdf()}
              generating={genLoading}
              downloading={clPdfLoading}
              canGenerate={isTailored}
            />
          </TabsContent>
        </Tabs>
      )}

      <DiffPreviewModal
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
        changes={preview?.data.detailed_changes}
        onConfirm={() => void runConfirm()}
        confirming={confirming}
      />
    </DashboardPageLayout>
  );
}
