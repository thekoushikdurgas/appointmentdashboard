"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { FEATURE_GATES } from "@/lib/featureAccess";
import { useRole } from "@/context/RoleContext";
import { campaignsService } from "@/services/graphql/campaignsService";
import { TemplatePicker } from "@/components/feature/campaigns/TemplatePicker";

const STEPS = ["Details", "Audience", "Content", "Review"];

export default function NewCampaignPage() {
  const { checkAccess } = useRole();
  const canAccess = checkAccess("campaigns");
  const router = useRouter();

  const templateLabel = (id: string) => (id.trim() ? id : "—");

  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    fromName: "",
    fromEmail: "",
    audience: "all",
    templateId: "",
    scheduleType: "now",
    scheduledAt: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canNext = () => {
    if (step === 0)
      return (
        form.name.trim() &&
        form.subject.trim() &&
        form.fromName.trim() &&
        form.fromEmail.trim()
      );
    return true;
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await campaignsService.createCampaign({
        name: form.name,
        subject: form.subject,
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        templateId: form.templateId || null,
        audience: form.audience || null,
        scheduleType: form.scheduleType || null,
        scheduledAt:
          form.scheduleType === "scheduled" && form.scheduledAt
            ? form.scheduledAt
            : null,
      });
      toast.success("Campaign created successfully!");
      router.push(ROUTES.CAMPAIGNS);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create campaign.",
      );
    } finally {
      setLaunching(false);
    }
  };

  if (!canAccess) {
    return (
      <DashboardPageLayout>
        <div className="c360-p-6 c360-mx-auto c360-max-w-760">
          <h1 className="c360-standalone-header__title">New Campaign</h1>
          <Alert variant="warning" className="c360-mt-4">
            {FEATURE_GATES.campaigns.label} is available on{" "}
            <strong>Professional</strong> and <strong>Enterprise</strong> plans.{" "}
            <Link href={ROUTES.BILLING}>View billing</Link> to upgrade.
          </Alert>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout>
      <div className="c360-p-6 c360-mx-auto c360-max-w-760">
        <div className="c360-flex c360-items-center c360-gap-3 c360-mb-6">
          <Link href={ROUTES.CAMPAIGNS}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={15} />
              Back
            </Button>
          </Link>
          <h1 className="c360-standalone-header__title c360-mb-0">
            New Campaign
          </h1>
        </div>

        {/* Step indicator */}
        <div className="c360-campaign-wizard">
          {STEPS.map((s, i) => (
            <div key={s} className="c360-campaign-wizard__segment">
              <div
                className={cn(
                  "c360-campaign-wizard__segment-inner",
                  i < step && "c360-campaign-wizard__segment-inner--clickable",
                )}
                onClick={() => i < step && setStep(i)}
              >
                <div
                  className={cn(
                    "c360-campaign-wizard-step-circle",
                    i < step && "c360-campaign-wizard-step-circle--done",
                    i === step && "c360-campaign-wizard-step-circle--active",
                  )}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span
                  className={cn(
                    "c360-campaign-wizard-step-label",
                    i < step && "c360-campaign-wizard-step-label--done",
                    i === step && "c360-campaign-wizard-step-label--active",
                  )}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "c360-campaign-wizard-step-rule",
                    i < step && "c360-campaign-wizard-step-rule--done",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <div className="c360-card-inner-pad--lg">
            {/* Step 0: Details */}
            {step === 0 && (
              <div className="c360-section-stack">
                <h2 className="c360-step-title">Campaign Details</h2>
                <Input
                  label="Campaign Name"
                  placeholder="e.g. Welcome Series Q2"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
                <Input
                  label="Email Subject"
                  placeholder="e.g. Welcome to Contact360!"
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                />
                <div className="c360-2col-grid">
                  <Input
                    label="From Name"
                    placeholder="Your Name or Company"
                    value={form.fromName}
                    onChange={(e) => update("fromName", e.target.value)}
                  />
                  <Input
                    label="From Email"
                    type="email"
                    placeholder="hello@yourcompany.com"
                    value={form.fromEmail}
                    onChange={(e) => update("fromEmail", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Audience */}
            {step === 1 && (
              <div className="c360-section-stack">
                <h2 className="c360-step-title">Audience</h2>
                <Select
                  label="Audience Segment"
                  value={form.audience}
                  onChange={(e) => update("audience", e.target.value)}
                  options={[
                    { value: "all", label: "All Contacts" },
                    { value: "new", label: "New (last 30 days)" },
                    { value: "inactive", label: "Inactive (90+ days)" },
                    { value: "pro", label: "Pro plan users" },
                  ]}
                />
                <div className="c360-audience-box">
                  <div className="c360-audience-box__label">
                    Estimated recipients
                  </div>
                  <div className="c360-audience-box__value">
                    {form.audience === "all"
                      ? "8,420"
                      : form.audience === "new"
                        ? "1,240"
                        : form.audience === "inactive"
                          ? "3,100"
                          : "2,200"}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Content */}
            {step === 2 && (
              <div className="c360-section-stack">
                <h2 className="c360-step-title">Content & Schedule</h2>
                <TemplatePicker
                  label="Email Template"
                  value={form.templateId}
                  onSelect={(t) => update("templateId", t.id)}
                  onClear={() => update("templateId", "")}
                />
                <Select
                  label="Schedule"
                  value={form.scheduleType}
                  onChange={(e) => update("scheduleType", e.target.value)}
                  options={[
                    { value: "now", label: "Send immediately" },
                    { value: "scheduled", label: "Schedule for later" },
                  ]}
                />
                {form.scheduleType === "scheduled" && (
                  <Input
                    label="Send At"
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => update("scheduledAt", e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="c360-section-stack">
                <h2 className="c360-step-title">Review & Launch</h2>
                {[
                  ["Campaign Name", form.name],
                  ["Subject", form.subject],
                  ["From", `${form.fromName} <${form.fromEmail}>`],
                  ["Audience", form.audience],
                  ["Template", templateLabel(form.templateId)],
                  [
                    "Schedule",
                    form.scheduleType === "now"
                      ? "Send immediately"
                      : form.scheduledAt,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="c360-review-row">
                    <span className="c360-text-sm c360-text-muted">
                      {label}
                    </span>
                    <span className="c360-text-sm c360-font-medium">
                      {value || <Badge color="secondary">Not set</Badge>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="c360-card-footer">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft size={15} />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
              >
                Next
                <ArrowRight size={15} />
              </Button>
            ) : (
              <Button
                variant="primary"
                loading={launching}
                onClick={() => void handleLaunch()}
              >
                <Check size={15} />
                Launch Campaign
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
