"use client";

import Link from "next/link";
import { FileText, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ResumeRecord } from "@/services/graphql/resumeService";
import { getResumeDisplayTitle } from "@/lib/resumeDisplay";

interface ResumeCardProps {
  resume: ResumeRecord;
  onEdit: (r: ResumeRecord) => void;
  onDelete: (id: string) => void;
  detailHref?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ResumeCard({
  resume,
  onEdit,
  onDelete,
  detailHref,
}: ResumeCardProps) {
  const title = getResumeDisplayTitle(
    resume.resumeData as Record<string, unknown>,
    resume.id,
  );

  return (
    <div className="c360-stat-card">
      <div className="c360-resume-card__header">
        <span className="c360-text-primary">
          <FileText size={20} />
        </span>
        <span className="c360-font-semibold">{title}</span>
      </div>
      <p className="c360-text-muted c360-text-sm">
        Created {formatDate(resume.createdAt)}
      </p>
      {resume.updatedAt && (
        <p className="c360-text-muted c360-text-sm">
          Updated {formatDate(resume.updatedAt)}
        </p>
      )}
      <div className="c360-resume-card__actions">
        {detailHref && (
          <Link
            href={detailHref}
            className="c360-btn c360-btn--primary c360-btn--sm"
          >
            <ExternalLink size={14} className="c360-mr-1" />
            Open
          </Link>
        )}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Edit2 size={14} />}
          onClick={() => onEdit(resume)}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} />}
          onClick={() => onDelete(resume.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
