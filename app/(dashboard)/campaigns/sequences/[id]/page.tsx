"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitBranch,
  Plus,
  Trash2,
  Mail,
  Clock,
  Edit3,
  Play,
  RefreshCw,
  Loader2,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ROUTES } from "@/lib/routes";
import {
  campaignsService,
  type AddSequenceStepInput,
  type TriggerSequenceInput,
} from "@/services/graphql/campaignsService";
import { campaignSatelliteService } from "@/services/graphql/campaignSatelliteService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SequenceStep {
  id: string;
  stepType: string;
  step_type?: string;
  delayHours?: number;
  delay_hours?: number;
  templateId?: string;
  template_id?: string;
  subject?: string;
  body?: string;
  [key: string]: unknown;
}

interface SequenceDetail {
  id: string;
  name: string;
  status: string;
  steps: SequenceStep[];
  activeContacts?: number;
  active_contacts?: number;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

const STEP_TYPE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "wait", label: "Wait" },
  { value: "sms", label: "SMS" },
  { value: "task", label: "Task" },
];

const STATUS_COLOR: Record<string, "green" | "yellow" | "gray"> = {
  active: "green",
  paused: "yellow",
  draft: "gray",
};

function normaliseStep(
  raw: Record<string, unknown>,
  index: number,
): SequenceStep {
  return {
    id: String(raw.id ?? raw.uuid ?? `step-${index}`),
    stepType: String(raw.stepType ?? raw.step_type ?? "email"),
    delayHours:
      typeof (raw.delayHours ?? raw.delay_hours) === "number"
        ? Number(raw.delayHours ?? raw.delay_hours)
        : undefined,
    templateId: String(raw.templateId ?? raw.template_id ?? ""),
    subject: typeof raw.subject === "string" ? raw.subject : undefined,
    body: typeof raw.body === "string" ? raw.body : undefined,
  };
}

function normaliseSequence(raw: Record<string, unknown>): SequenceDetail {
  const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];
  return {
    id: String(raw.id ?? raw.uuid ?? ""),
    name: String(raw.name ?? raw.title ?? "Untitled"),
    status: String(raw.status ?? raw.state ?? "draft").toLowerCase(),
    steps: rawSteps.map((s, i) =>
      normaliseStep(s as Record<string, unknown>, i),
    ),
    activeContacts:
      typeof (raw.activeContacts ?? raw.active_contacts) === "number"
        ? Number(raw.activeContacts ?? raw.active_contacts)
        : 0,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}

/* ─────────── Add Step Modal ─────────── */
function AddStepModal({
  sequenceId,
  onAdded,
  onClose,
}: {
  sequenceId: string;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AddSequenceStepInput>({
    stepType: "email",
    delayHours: 0,
    templateId: "",
    subject: "",
    body: "",
  });
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof AddSequenceStepInput>(
    k: K,
    v: AddSequenceStepInput[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await campaignsService.addSequenceStep(sequenceId, {
        ...form,
        delayHours: Number(form.delayHours) || 0,
        templateId: form.templateId || null,
        subject: form.subject || null,
        body: form.body || null,
      });
      toast.success("Step added.");
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add step.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add Step" size="sm">
      <div className="c360-section-stack">
        <Select
          label="Step type"
          value={form.stepType}
          onChange={(e) => update("stepType", e.target.value)}
          options={STEP_TYPE_OPTIONS}
        />
        <Input
          label="Delay (hours)"
          type="number"
          min={0}
          value={String(form.delayHours ?? 0)}
          onChange={(e) => update("delayHours", Number(e.target.value))}
        />
        {form.stepType === "email" && (
          <>
            <Input
              label="Template ID (optional)"
              value={form.templateId ?? ""}
              onChange={(e) => update("templateId", e.target.value)}
              placeholder="Leave blank for custom body"
            />
            <Input
              label="Subject (optional)"
              value={form.subject ?? ""}
              onChange={(e) => update("subject", e.target.value)}
            />
          </>
        )}
        <div className="c360-modal-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => void handleSave()}>
            Add step
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────── Edit Step Modal ─────────── */
function EditStepModal({
  sequenceId,
  step,
  onSaved,
  onClose,
}: {
  sequenceId: string;
  step: SequenceStep;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    stepType: step.stepType,
    delayHours: step.delayHours ?? 0,
    templateId: step.templateId ?? "",
    subject: step.subject ?? "",
    body: step.body ?? "",
  });
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await campaignsService.updateSequenceStep(sequenceId, step.id, {
        stepType: form.stepType,
        delayHours: Number(form.delayHours) || 0,
        templateId: form.templateId || null,
        subject: form.subject || null,
        body: form.body || null,
      });
      toast.success("Step updated.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update step.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Step" size="sm">
      <div className="c360-section-stack">
        <Select
          label="Step type"
          value={form.stepType}
          onChange={(e) => update("stepType", e.target.value)}
          options={STEP_TYPE_OPTIONS}
        />
        <Input
          label="Delay (hours)"
          type="number"
          min={0}
          value={String(form.delayHours)}
          onChange={(e) => update("delayHours", Number(e.target.value))}
        />
        {form.stepType === "email" && (
          <>
            <Input
              label="Template ID (optional)"
              value={form.templateId}
              onChange={(e) => update("templateId", e.target.value)}
            />
            <Input
              label="Subject (optional)"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
            />
          </>
        )}
        <div className="c360-modal-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => void handleSave()}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────── Trigger Sequence Wizard ─────────── */
function TriggerSequenceModal({
  sequenceId,
  onClose,
}: {
  sequenceId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TriggerSequenceInput>({
    email: "",
    contactId: "",
  });
  const [triggering, setTriggering] = useState(false);
  const [done, setDone] = useState(false);

  const handleTrigger = async () => {
    const email = form.email?.trim() ?? "";
    const contactId = form.contactId?.trim() ?? "";
    if (!email && !contactId) {
      toast.error("Provide an email address or contact ID.");
      return;
    }
    setTriggering(true);
    try {
      await campaignsService.triggerSequence(sequenceId, {
        email: email || null,
        contactId: contactId || null,
      });
      setDone(true);
      toast.success("Contact enrolled in sequence.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to trigger sequence.",
      );
    } finally {
      setTriggering(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Enroll contact in sequence"
      size="sm"
    >
      {done ? (
        <div className="c360-section-stack">
          <Alert variant="success">Contact successfully enrolled.</Alert>
          <div className="c360-modal-actions">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : (
        <div className="c360-section-stack">
          <p className="c360-text-muted c360-text-sm">
            Provide an email address <em>or</em> a Contact ID to enroll into
            this sequence.
          </p>
          <Input
            label="Email address"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="contact@example.com"
          />
          <p className="c360-text-muted c360-text-sm c360-text-center">
            — or —
          </p>
          <Input
            label="Contact ID (UUID)"
            value={form.contactId ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactId: e.target.value }))
            }
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
          <div className="c360-modal-actions">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button loading={triggering} onClick={() => void handleTrigger()}>
              <Play size={14} />
              Enroll
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─────────── Step card ─────────── */
function StepCard({
  step,
  index,
  sequenceId,
  onRefresh,
}: {
  step: SequenceStep;
  index: number;
  sequenceId: string;
  onRefresh: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Delete this step?")) return;
    setDeleting(true);
    try {
      await campaignsService.deleteSequenceStep(sequenceId, step.id);
      toast.success("Step removed.");
      onRefresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete step.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="c360-seq-step-card">
        <div className="c360-seq-step-card__index">{index + 1}</div>
        <div className="c360-seq-step-card__icon">
          {step.stepType === "email" ? <Mail size={14} /> : <Clock size={14} />}
        </div>
        <div className="c360-seq-step-card__body">
          <span className="c360-seq-step-card__type">{step.stepType}</span>
          {step.delayHours !== undefined && step.delayHours > 0 && (
            <span className="c360-text-muted c360-text-sm">
              &nbsp;· wait {step.delayHours}h
            </span>
          )}
          {step.subject && (
            <span className="c360-text-muted c360-text-sm">
              &nbsp;· {step.subject}
            </span>
          )}
        </div>
        <div className="c360-badge-row">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            title="Edit step"
            onClick={() => setEditOpen(true)}
          >
            <Edit3 size={13} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            title="Delete step"
            loading={deleting}
            onClick={() => void handleDelete()}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
      {index < 9999 && (
        <div className="c360-seq-step-connector" aria-hidden="true" />
      )}
      {editOpen && (
        <EditStepModal
          sequenceId={sequenceId}
          step={step}
          onSaved={onRefresh}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

/* ─────────── Main page ─────────── */
export default function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [sequence, setSequence] = useState<SequenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [triggerOpen, setTriggerOpen] = useState(false);

  const fetchSequence = useCallback(
    async (options?: { soft?: boolean }) => {
      const soft = options?.soft === true;
      if (soft) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await campaignSatelliteService.getSequence(id);
        const raw = (res?.campaignSatellite?.sequence ?? {}) as Record<
          string,
          unknown
        >;
        setSequence(normaliseSequence(raw));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load sequence.");
      } finally {
        if (soft) setRefreshing(false);
        else setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void fetchSequence();
  }, [fetchSequence]);

  if (loading) {
    return (
      <DashboardPageLayout>
        <div className="c360-detail-loading">
          <Loader2 size={24} className="spinning" />
          <span className="c360-text-muted">Loading sequence…</span>
        </div>
      </DashboardPageLayout>
    );
  }

  if (error) {
    return (
      <DashboardPageLayout>
        <div className="c360-p-6">
          <Alert variant="danger">{error}</Alert>
          <Button
            variant="secondary"
            className="c360-mt-4"
            onClick={() => router.back()}
          >
            <ArrowLeft size={14} />
            Back
          </Button>
        </div>
      </DashboardPageLayout>
    );
  }

  if (!sequence) return null;

  const steps = sequence.steps ?? [];
  const status = sequence.status;

  return (
    <DashboardPageLayout>
      <div className="c360-p-6">
        {/* Header */}
        <div className="c360-page-header c360-mb-4">
          <div className="c360-flex c360-items-center c360-gap-3">
            <Link href={ROUTES.CAMPAIGNS_SEQUENCES}>
              <Button variant="ghost" size="sm" type="button">
                <ArrowLeft size={14} />
              </Button>
            </Link>
            <div className="c360-seq-icon-box">
              <GitBranch size={18} className="c360-text-primary" />
            </div>
            <div>
              <h1 className="c360-standalone-header__title c360-mb-0">
                {sequence.name}
              </h1>
              <p className="c360-page-subtitle c360-mt-0-5">
                {steps.length} step{steps.length !== 1 ? "s" : ""} ·{" "}
                {sequence.activeContacts ?? 0} active contacts
              </p>
            </div>
            <Badge color={STATUS_COLOR[status] ?? "gray"}>{status}</Badge>
          </div>
          <div className="c360-badge-row">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={refreshing}
              onClick={() => void fetchSequence({ soft: true })}
            >
              <RefreshCw size={13} className={cn(refreshing && "c360-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setTriggerOpen(true)}
            >
              <Play size={13} />
              Enroll contact
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={13} />
              Add step
            </Button>
          </div>
        </div>

        <Tabs defaultValue="steps" variant="underline">
          <TabsList>
            <TabsTrigger value="steps" icon={<GitBranch size={14} />}>
              Steps ({steps.length})
            </TabsTrigger>
            <TabsTrigger value="overview" icon={<Mail size={14} />}>
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="c360-mt-4">
            {steps.length === 0 ? (
              <Card>
                <div className="c360-empty-state">
                  <GitBranch size={32} className="c360-opacity-25 c360-mb-3" />
                  <p>
                    No steps yet. Click <strong>Add step</strong> to build this
                    sequence.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="c360-mt-3"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus size={13} />
                    Add first step
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="c360-seq-step-list">
                {steps.map((step, idx) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={idx}
                    sequenceId={id}
                    onRefresh={() => void fetchSequence({ soft: true })}
                  />
                ))}
                <div className="c360-seq-step-add-row">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus size={13} />
                    Add another step
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="c360-mt-4">
            <Card>
              <dl className="c360-detail-grid">
                <div>
                  <dt>Sequence ID</dt>
                  <dd className="c360-font-mono">{sequence.id}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <Badge color={STATUS_COLOR[status] ?? "gray"}>
                      {status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt>Steps</dt>
                  <dd>{steps.length}</dd>
                </div>
                <div>
                  <dt>Active contacts</dt>
                  <dd>{sequence.activeContacts ?? 0}</dd>
                </div>
                {sequence.createdAt && (
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(sequence.createdAt).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {addOpen && (
        <AddStepModal
          sequenceId={id}
          onAdded={() => void fetchSequence({ soft: true })}
          onClose={() => setAddOpen(false)}
        />
      )}
      {triggerOpen && (
        <TriggerSequenceModal
          sequenceId={id}
          onClose={() => setTriggerOpen(false)}
        />
      )}
    </DashboardPageLayout>
  );
}
