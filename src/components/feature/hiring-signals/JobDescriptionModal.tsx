"use client";

import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  employmentTypeBadgeColor,
  formatHireSignalPostedDate,
  sanitizeJobDescriptionHtml,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";

function hrefIfHttp(url: string): string | null {
  const t = url.trim();
  if (!t || !/^https?:\/\//i.test(t)) return null;
  return t;
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
  const safeHtml = job ? sanitizeJobDescriptionHtml(job.descriptionHtml) : "";
  const listingHref = job ? hrefIfHttp(job.jobUrl) : null;
  const applyHref = job ? hrefIfHttp(job.applyUrl) : null;
  const sameListingAndApply = Boolean(
    listingHref && applyHref && listingHref === applyHref,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job ? job.title : "Job description"}
      size="lg"
      footer={
        <div className="c360-flex c360-w-full c360-flex-wrap c360-items-center c360-justify-end c360-gap-2">
          {sameListingAndApply && listingHref ? (
            <Button asChild variant="primary" size="sm" className="c360-gap-1">
              <a href={listingHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
                Open job
              </a>
            </Button>
          ) : (
            <>
              {applyHref ? (
                <Button
                  asChild
                  variant="primary"
                  size="sm"
                  className="c360-gap-1"
                >
                  <a href={applyHref} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} />
                    Apply
                  </a>
                </Button>
              ) : null}
              {listingHref && (!applyHref || applyHref !== listingHref) ? (
                <Button
                  asChild
                  variant={applyHref ? "secondary" : "primary"}
                  size="sm"
                  className="c360-gap-1"
                >
                  <a
                    href={listingHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={16} />
                    Open on LinkedIn
                  </a>
                </Button>
              ) : null}
            </>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {job ? (
        <div className="c360-hs-jd-modal-stack">
          <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2 c360-text-sm c360-text-ink-muted">
            <span className="c360-font-medium c360-text-ink">
              {job.companyName || "—"}
            </span>
            {job.location ? (
              <>
                <span aria-hidden>·</span>
                <span>{job.location}</span>
              </>
            ) : null}
            {job.postedAt ? (
              <>
                <span aria-hidden>·</span>
                <span>
                  Posted{" "}
                  {formatHireSignalPostedDate(job.postedAt, {
                    withTime: true,
                    emptyAsDash: false,
                  })}
                </span>
              </>
            ) : null}
          </div>
          <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2 c360-hs-jd-modal-meta-row">
            {job.employmentType ? (
              <Badge
                color={employmentTypeBadgeColor(job.employmentType)}
                size="sm"
              >
                {job.employmentType}
              </Badge>
            ) : null}
            {job.seniority ? (
              <Badge color="gray" size="sm">
                {job.seniority}
              </Badge>
            ) : null}
            {job.remoteAllowed &&
            String(job.remoteAllowed).toLowerCase() !== "false" &&
            String(job.remoteAllowed).trim() !== "" ? (
              <Badge color="emerald" size="sm">
                Remote friendly
              </Badge>
            ) : null}
          </div>
          <div
            className={cn(
              "c360-overflow-auto c360-rounded c360-border c360-border-ink-8 c360-p-3",
              "c360-text-sm c360-leading-relaxed c360-text-ink",
              "c360-hs-jd-modal-desc-scroll",
            )}
          >
            {safeHtml ? (
              <div
                className="c360-job-desc-html"
                // job.server-sourced HTML; stripped scripts/on* handlers
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            ) : (
              <p className="c360-text-ink-muted">
                No description HTML was stored for this listing.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
