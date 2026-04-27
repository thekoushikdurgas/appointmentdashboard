"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { jobsService, type JobTicketRow } from "@/services/graphql/jobsService";
import { toast } from "sonner";
import { parseOperationError } from "@/lib/errorParser";
import type { ReviewDrawerPreset } from "@/context/ReviewDrawerContext";

const SEVERITY_OPTS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const SOURCE_OPTS = [
  { value: "scheduler", label: "Scheduler job" },
  { value: "scrape", label: "Scrape job (hiring signals)" },
];

interface ReviewWorkspaceProps {
  openSeq: number;
  preset: ReviewDrawerPreset | null;
}

export function ReviewWorkspace({ openSeq, preset }: ReviewWorkspaceProps) {
  const [tickets, setTickets] = useState<JobTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [jobSource, setJobSource] = useState<"scheduler" | "scrape">(
    "scheduler",
  );
  const [externalJobId, setExternalJobId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("normal");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobsService.listMyJobTickets({
        limit: 50,
        offset: 0,
      });
      setTickets(res.tickets);
    } catch (e) {
      const msg = parseOperationError(e, "jobs");
      toast.error(msg.userMessage || "Could not load job tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [openSeq, loadTickets]);

  useEffect(() => {
    if (preset) {
      setJobSource(preset.jobSource);
      setExternalJobId(preset.externalJobId);
    }
  }, [openSeq, preset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalJobId.trim() || !title.trim() || !description.trim()) {
      toast.error("Job id, title, and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      await jobsService.createJobTicket({
        jobSource,
        externalJobId: externalJobId.trim(),
        title: title.trim(),
        description: description.trim(),
        severity,
      });
      toast.success("Ticket submitted");
      setTitle("");
      setDescription("");
      if (!preset) {
        setExternalJobId("");
      }
      await loadTickets();
    } catch (err) {
      const msg = parseOperationError(err, "jobs");
      toast.error(msg.userMessage || "Could not create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="c360-review-workspace">
      <section className="c360-review-workspace__section">
        <h3 className="c360-review-workspace__h">New job ticket</h3>
        <p className="c360-review-workspace__hint">
          Link issues to a scheduler job ID (from Jobs) or a scrape job UUID
          (hiring signals). Our team will review open tickets.
        </p>
        <form className="c360-section-stack" onSubmit={handleSubmit}>
          <Select
            label="Job type"
            value={jobSource}
            onChange={(e) =>
              setJobSource(e.target.value as "scheduler" | "scrape")
            }
            options={SOURCE_OPTS}
          />
          <Input
            label={
              jobSource === "scheduler" ? "Scheduler job ID" : "Scrape job ID"
            }
            value={externalJobId}
            onChange={(e) => setExternalJobId(e.target.value)}
            placeholder={
              jobSource === "scheduler"
                ? "e.g. job id from the Jobs list"
                : "UUID of the scrape job"
            }
            required
          />
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary"
            required
          />
          <div className="c360-field">
            <label className="c360-field__label" htmlFor="c360-ticket-desc">
              Description
            </label>
            <textarea
              id="c360-ticket-desc"
              className="c360-input c360-input--md"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What went wrong? Include steps if helpful."
              required
            />
          </div>
          <Select
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={SEVERITY_OPTS}
          />
          <Button type="submit" loading={submitting}>
            Submit ticket
          </Button>
        </form>
      </section>

      <section className="c360-review-workspace__section">
        <h3 className="c360-review-workspace__h">Your tickets</h3>
        {loading ? (
          <p className="c360-text-sm c360-text-muted">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="c360-text-sm c360-text-muted">No tickets yet.</p>
        ) : (
          <ul className="c360-review-workspace__list">
            {tickets.map((t) => (
              <li key={t.id} className="c360-review-workspace__item">
                <div className="c360-review-workspace__item-head">
                  <span className="c360-review-workspace__badge">
                    {t.status}
                  </span>
                  <span className="c360-text-2xs c360-text-muted">
                    {new Date(t.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="c360-review-workspace__title">{t.title}</p>
                <p className="c360-text-xs c360-text-muted">
                  {t.jobSource} · {t.externalJobId}
                  {t.jobType ? ` · ${t.jobType}` : ""}
                </p>
                {t.adminNotes ? (
                  <p className="c360-text-sm c360-mt-2">
                    <strong>Team:</strong> {t.adminNotes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
