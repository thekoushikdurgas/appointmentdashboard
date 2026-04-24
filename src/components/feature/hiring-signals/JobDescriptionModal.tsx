"use client";

import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

function stripTags(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/(p|div|br|li|h1|h2|h3)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface JobDescriptionModalProps {
  job: LinkedInJobRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobDescriptionModal({
  job,
  isOpen,
  onClose,
}: JobDescriptionModalProps) {
  const plain = job ? stripTags(job.descriptionHtml) : "";
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job ? job.title : "Job description"}
      size="lg"
      footer={
        job?.jobUrl ? (
          <div className="c360-flex c360-w-full c360-justify-end">
            <Button asChild variant="primary" size="sm" className="c360-gap-1">
              <a href={job.jobUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
                Open on LinkedIn
              </a>
            </Button>
          </div>
        ) : undefined
      }
    >
      {job ? (
        <div className="c360-space-y-2">
          <p className="c360-text-sm c360-text-ink-muted">
            {job.companyName}
            {job.location ? ` · ${job.location}` : ""}
          </p>
          <pre
            className={cn(
              "c360-max-h-[min(60vh,28rem)] c360-overflow-auto c360-whitespace-pre-wrap",
              "c360-text-sm c360-leading-relaxed c360-text-ink",
            )}
          >
            {plain || "No description text was stored for this listing."}
          </pre>
        </div>
      ) : null}
    </Modal>
  );
}
