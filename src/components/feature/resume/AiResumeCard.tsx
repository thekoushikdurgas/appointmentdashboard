"use client";

import Link from "next/link";
import { FileText, Crown, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ResumeSummaryAi } from "@/lib/resumeAiClient";

interface AiResumeCardProps {
  resume: ResumeSummaryAi;
  detailHref: string;
  onDelete: (id: string) => void;
  onSetMaster?: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AiResumeCard({
  resume,
  detailHref,
  onDelete,
  onSetMaster,
}: AiResumeCardProps) {
  const title =
    resume.title?.trim() ||
    resume.filename?.replace(/\.[^.]+$/, "") ||
    resume.resume_id.slice(0, 8);

  const status = resume.processing_status;

  return (
    <div className="c360-stat-card">
      <div className="c360-resume-card__header">
        <span className="c360-text-primary">
          <FileText size={20} />
        </span>
        <span className="c360-font-semibold">{title}</span>
        {resume.is_master && (
          <span className="c360-badge c360-badge--sm c360-badge--blue c360-ml-2" title="Master résumé">
            <Crown size={12} className="c360-mr-1" />
            Master
          </span>
        )}
      </div>
      <p className="c360-text-muted c360-text-sm">
        Status: <code className="c360-mono">{status}</code>
      </p>
      <p className="c360-text-muted c360-text-sm">
        Updated {formatDate(resume.updated_at)}
      </p>
      <div className="c360-resume-card__actions">
        <Link
          href={detailHref}
          className="c360-btn c360-btn--primary c360-btn--sm"
        >
          <ExternalLink size={14} className="c360-mr-1" />
          Tailor & edit
        </Link>
        {onSetMaster && !resume.is_master && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onSetMaster(resume.resume_id)}
          >
            Set master
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} />}
          onClick={() => onDelete(resume.resume_id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
