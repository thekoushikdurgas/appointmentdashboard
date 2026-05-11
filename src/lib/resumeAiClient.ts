/**
 * REST client for Résumé Matcher (`/resume/v1`).
 *
 * Default target is the contact360 API gateway (same origin in dev via Next rewrite,
 * or `API_URL` in production). Sends `Authorization: Bearer` when an access token exists.
 */

import { RESUME_AI_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/tokenManager";

function base(): string {
  return RESUME_AI_URL;
}

function withAuth(headers?: HeadersInit): Headers {
  const h = new Headers(headers);
  const token = getAccessToken();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as {
      detail?: string | unknown;
      error?: string | unknown;
    };
    if (typeof j.error === "string") return j.error;
    if (typeof j.detail === "string") return j.detail;
    return JSON.stringify(j.detail ?? j.error ?? text);
  } catch {
    return text || res.statusText;
  }
}

export interface ResumeSummaryAi {
  resume_id: string;
  filename: string | null;
  is_master: boolean;
  parent_id: string | null;
  processing_status: string;
  created_at: string;
  updated_at: string;
  title: string | null;
}

export interface ResumeListAiResponse {
  request_id: string;
  data: ResumeSummaryAi[];
}

export interface RawResumeAi {
  content: string;
  content_type: string;
  created_at: string;
  processing_status: string;
}

export interface ResumeFetchAiResponse {
  request_id: string;
  data: {
    resume_id: string;
    raw_resume: RawResumeAi;
    processed_resume: Record<string, unknown> | null;
    cover_letter?: string | null;
    outreach_message?: string | null;
    parent_id?: string | null;
    title?: string | null;
  };
}

export interface ResumeUploadAiResponse {
  message: string;
  request_id: string;
  resume_id: string;
  processing_status: string;
  is_master: boolean;
}

export interface JobUploadAiResponse {
  message: string;
  job_id: string[];
  request: Record<string, unknown>;
}

export interface ImprovementSuggestion {
  suggestion: string;
  lineNumber?: number | null;
}

export interface ResumeFieldDiff {
  field_path: string;
  field_type: string;
  change_type: "added" | "removed" | "modified";
  original_value?: string | null;
  new_value?: string | null;
  confidence?: string;
}

export interface ImproveResumeData {
  request_id: string;
  resume_id: string | null;
  job_id: string;
  resume_preview: Record<string, unknown>;
  improvements: ImprovementSuggestion[];
  markdownOriginal?: string | null;
  markdownImproved?: string | null;
  diff_summary?: Record<string, unknown> | null;
  detailed_changes?: ResumeFieldDiff[] | null;
  warnings?: string[];
}

export interface ImproveResumeResponse {
  request_id: string;
  data: ImproveResumeData;
}

export interface ScoreResponse {
  resume_id: string;
  job_id: string;
  match_percentage: number;
  job_keywords: Record<string, unknown>;
}

export async function resumeAiList(
  includeMaster = true,
): Promise<ResumeSummaryAi[]> {
  const res = await fetch(
    `${base()}/resume/v1/resumes/list?include_master=${includeMaster}`,
    { headers: withAuth() },
  );
  if (!res.ok) throw new Error(await parseError(res));
  const body = (await res.json()) as ResumeListAiResponse;
  return body.data;
}

export async function resumeAiGet(
  resumeId: string,
): Promise<ResumeFetchAiResponse["data"]> {
  const q = new URLSearchParams({ resume_id: resumeId });
  const res = await fetch(`${base()}/resume/v1/resumes?${q}`, {
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const body = (await res.json()) as ResumeFetchAiResponse;
  return body.data;
}

export async function resumeAiUpload(
  file: File,
): Promise<ResumeUploadAiResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${base()}/resume/v1/resumes/upload`, {
    method: "POST",
    headers: withAuth(),
    body: fd,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ResumeUploadAiResponse>;
}

export async function resumeAiDelete(resumeId: string): Promise<void> {
  const res = await fetch(`${base()}/resume/v1/resumes/${resumeId}`, {
    method: "DELETE",
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function resumeAiSetMaster(resumeId: string): Promise<void> {
  const res = await fetch(`${base()}/resume/v1/resumes/${resumeId}/master`, {
    method: "PUT",
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function resumeAiUploadJobs(
  descriptions: string[],
  resumeId?: string | null,
): Promise<string[]> {
  const res = await fetch(`${base()}/resume/v1/jobs/upload`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      job_descriptions: descriptions,
      resume_id: resumeId ?? null,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const body = (await res.json()) as JobUploadAiResponse;
  return body.job_id;
}

export async function resumeAiPreviewImprove(params: {
  resume_id: string;
  job_id: string;
  prompt_id?: string;
}): Promise<ImproveResumeResponse> {
  const res = await fetch(`${base()}/resume/v1/resumes/improve/preview`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ImproveResumeResponse>;
}

export async function resumeAiConfirmImprove(params: {
  resume_id: string;
  job_id: string;
  improved_data: Record<string, unknown>;
  improvements: ImprovementSuggestion[];
}): Promise<ImproveResumeResponse> {
  const res = await fetch(`${base()}/resume/v1/resumes/improve/confirm`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ImproveResumeResponse>;
}

export async function resumeAiScore(
  resumeId: string,
  jobId: string,
): Promise<ScoreResponse> {
  const q = new URLSearchParams({ job_id: jobId });
  const res = await fetch(
    `${base()}/resume/v1/resumes/${resumeId}/score?${q}`,
    {
      headers: withAuth(),
    },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ScoreResponse>;
}

export async function resumeAiGenerateCoverLetter(resumeId: string): Promise<{
  content: string;
  message: string;
}> {
  const res = await fetch(
    `${base()}/resume/v1/resumes/${resumeId}/generate-cover-letter`,
    { method: "POST", headers: withAuth() },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ content: string; message: string }>;
}

export async function resumeAiExportPdf(
  resumeId: string,
  opts?: {
    template?: string;
    pageSize?: "A4" | "LETTER";
  },
): Promise<Blob> {
  const p = new URLSearchParams();
  p.set("template", opts?.template ?? "swiss-single");
  p.set("pageSize", opts?.pageSize ?? "A4");
  const res = await fetch(`${base()}/resume/v1/resumes/${resumeId}/pdf?${p}`, {
    method: "POST",
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.blob();
}

export async function resumeAiCoverLetterPdf(
  resumeId: string,
  pageSize: "A4" | "LETTER" = "A4",
): Promise<Blob> {
  const res = await fetch(
    `${base()}/resume/v1/resumes/${resumeId}/cover-letter/pdf?pageSize=${pageSize}`,
    { headers: withAuth() },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.blob();
}

export async function resumeAiHealth(): Promise<unknown> {
  const res = await fetch(`${base()}/resume/v1/health`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** Enrichment: analyze weak bullets (POST ``/enrichment/analyze/{resume_id}``). */
export async function resumeAiEnrichmentAnalyze(
  resumeId: string,
): Promise<unknown> {
  const res = await fetch(
    `${base()}/resume/v1/enrichment/analyze/${resumeId}`,
    {
      method: "POST",
      headers: withAuth(),
    },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
