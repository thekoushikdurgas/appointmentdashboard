"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Star,
  CreditCard,
  Receipt,
  History,
  Package,
  Upload,
  ClipboardList,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useRole } from "@/context/RoleContext";
import {
  billingService,
  type PaymentInstructions,
} from "@/services/graphql/billingService";
import { useBilling } from "@/hooks/useBilling";
import { toast } from "sonner";
import { parseOperationError } from "@/lib/errorParser";
import {
  BillingPlanCards,
  type BillingPlanCard,
} from "@/components/feature/billing/BillingPlanCards";
import { BillingCheckoutWizard } from "@/components/feature/billing/BillingCheckoutWizard";
import { BillingInvoiceList } from "@/components/feature/billing/BillingInvoiceList";
import { BillingCreditSummary } from "@/components/feature/billing/BillingCreditSummary";
import { BillingPaymentProofForm } from "@/components/feature/billing/BillingPaymentProofForm";
import { BillingMyPaymentRequests } from "@/components/feature/billing/BillingMyPaymentRequests";
import type { InvoiceData } from "@/components/shared/InvoiceCard";
import { Progress } from "@/components/ui/Progress";
import { Alert } from "@/components/ui/Alert";

const SUBSCRIPTION_END_WARNING_DAYS = 7;

const SAMPLE_INVOICE: InvoiceData = {
  invoiceNumber: "INV-2026-0042",
  date: new Date(Date.now() - 2592000000).toISOString(),
  dueDate: new Date(Date.now() - 2505600000).toISOString(),
  plan: "Starter",
  amount: 29,
  currency: "USD",
  status: "paid",
  companyName: "Acme Corp",
  companyEmail: "billing@acmecorp.com",
  billingAddress: "123 Main St, San Francisco, CA 94102",
  items: [
    {
      description: "Starter Plan — Monthly subscription",
      quantity: 1,
      unitPrice: 29,
      total: 29,
    },
  ],
};

const PLAN_ACCENTS = [
  { bg: "var(--c360-primary-light)", color: "var(--c360-primary)" },
  { bg: "rgba(43,193,85,0.12)", color: "var(--c360-success)" },
  { bg: "rgba(255,109,77,0.12)", color: "var(--c360-warning)" },
  { bg: "rgba(181,25,236,0.12)", color: "var(--c360-accent)" },
];

export default function BillingPage() {
  const { plan } = useRole();
  const {
    billingInfo,
    plans: apiPlans,
    addons,
    invoices,
    totalInvoices,
    invoicePage,
    invoicePageSize,
    setInvoicePage,
    loading: billingLoading,
    purchaseAddon: hookPurchaseAddon,
    refresh: refreshBilling,
  } = useBilling();

  const PLANS = useMemo(
    (): BillingPlanCard[] =>
      apiPlans.map((p, i) => {
        const a = PLAN_ACCENTS[i % PLAN_ACCENTS.length];
        const monthly = p.periods?.monthly;
        const quarterly = p.periods?.quarterly;
        const yearly = p.periods?.yearly;
        const price = typeof monthly?.price === "number" ? monthly.price : null;
        const features: string[] = [];
        if (p.category) features.push(`Category: ${p.category}`);
        if (monthly?.credits != null)
          features.push(`${monthly.credits.toLocaleString()} credits / month`);
        if (yearly?.savings?.percentage != null)
          features.push(
            `Yearly option: save ~${yearly.savings.percentage}% vs monthly`,
          );
        if (features.length === 0) features.push("See checkout for pricing");
        return {
          id: p.tier,
          name: p.name,
          price,
          pricesByPeriod: {
            monthly: monthly?.price,
            quarterly: quarterly?.price,
            yearly: yearly?.price,
          },
          creditsByPeriod: {
            monthly: monthly?.credits,
            quarterly: quarterly?.credits,
            yearly: yearly?.credits,
          },
          features,
          bg: a.bg,
          color: a.color,
          icon: <Star size={20} />,
          popular: /professional|pro/i.test(p.tier),
        };
      }),
    [apiPlans],
  );

  const [uploadingProof, setUploadingProof] = useState(false);
  const [livePlan, setLivePlan] = useState<string | null>(null);
  const [creditsInfo, setCreditsInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("plans");
  const [purchasingAddon, setPurchasingAddon] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentInstructions, setPaymentInstructions] =
    useState<PaymentInstructions | null>(null);
  const [payInstrLoading, setPayInstrLoading] = useState(true);
  const [payInstrError, setPayInstrError] = useState<string | null>(null);
  const [requestsRefresh, setRequestsRefresh] = useState(0);

  const loadPaymentInstructions = useCallback(() => {
    setPayInstrLoading(true);
    setPayInstrError(null);
    billingService
      .getPaymentInstructions()
      .then((r) => setPaymentInstructions(r.billing.paymentInstructions))
      .catch((err: unknown) => {
        setPaymentInstructions(null);
        setPayInstrError(parseOperationError(err, "billing").userMessage);
      })
      .finally(() => setPayInstrLoading(false));
  }, []);

  useEffect(() => {
    void loadPaymentInstructions();
  }, [loadPaymentInstructions]);

  useEffect(() => {
    if (billingInfo) {
      setLivePlan(billingInfo.subscriptionPlan);
      setCreditsInfo(`${billingInfo.credits} / ${billingInfo.creditsLimit}`);
    }
  }, [billingInfo]);

  const effectivePlan = (livePlan ?? plan).toLowerCase();

  const subscriptionPeriodBanner = useMemo(() => {
    if (!billingInfo?.subscriptionEndsAt) return null;
    const tier = (billingInfo.subscriptionPlan || "free").toLowerCase();
    if (tier === "free" || tier === "unlimited") return null;
    const end = new Date(billingInfo.subscriptionEndsAt);
    if (Number.isNaN(end.getTime())) return null;
    const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86400000);
    return { end, daysLeft };
  }, [billingInfo]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setActiveTab("checkout");
  };

  const handleSubmitPaymentRequest = async (payload: {
    amount: number;
    screenshotS3Key: string;
    creditsToAdd: number;
    planTier?: string;
    planPeriod?: string;
    addonPackageId?: string;
  }) => {
    await billingService.submitPaymentProof({
      amount: payload.amount,
      screenshotS3Key: payload.screenshotS3Key,
      creditsToAdd: payload.creditsToAdd,
      planTier: payload.planTier,
      planPeriod: payload.planPeriod,
      addonPackageId: payload.addonPackageId,
    });
    toast.success(
      "Payment request submitted. An admin will review and apply your plan or credits.",
    );
    await refreshBilling();
    setRequestsRefresh((k) => k + 1);
    setSelectedPlanId(null);
    setActiveTab("requests");
  };

  const handlePurchaseAddon = async (packageId: string) => {
    setPurchasingAddon(packageId);
    try {
      const r = await hookPurchaseAddon(packageId);
      toast.success(
        r
          ? `${r.message} — ${r.creditsAdded} credits (balance ${r.totalCredits}).`
          : "Add-on purchased!",
      );
      await refreshBilling();
      const d = await billingService.getBillingInfo();
      setCreditsInfo(
        `${d.billing.billing.credits} credits · ${d.billing.billing.subscriptionStatus}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setPurchasingAddon(null);
    }
  };

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-title">Billing</h1>
          <p className="c360-page-subtitle">
            Manage your subscription and payment methods
            {totalInvoices > 0 && (
              <span className="c360-block c360-mt-1">
                {totalInvoices} invoice(s) on file
              </span>
            )}
          </p>
          {billingInfo && billingInfo.creditsLimit > 0 && (
            <div className="c360-billing-page__credits-meter">
              <div className="c360-text-xs c360-text-muted c360-mb-1">
                Credit usage ({billingInfo.creditsUsed.toLocaleString()} /{" "}
                {billingInfo.creditsLimit.toLocaleString()})
              </div>
              <Progress value={billingInfo.usagePercentage} />
            </div>
          )}
          {subscriptionPeriodBanner && (
            <div className="c360-mt-3 c360-max-w-720">
              <Alert
                variant={
                  subscriptionPeriodBanner.daysLeft <=
                  SUBSCRIPTION_END_WARNING_DAYS
                    ? "warning"
                    : "info"
                }
                title="Current billing period"
              >
                <p className="c360-m-0">
                  Your paid period ends on{" "}
                  <strong>
                    {subscriptionPeriodBanner.end.toLocaleDateString(
                      undefined,
                      {
                        dateStyle: "long",
                      },
                    )}
                  </strong>
                  {subscriptionPeriodBanner.daysLeft >= 0 &&
                    subscriptionPeriodBanner.daysLeft <=
                      SUBSCRIPTION_END_WARNING_DAYS && (
                      <>
                        {" "}
                        (
                        {subscriptionPeriodBanner.daysLeft === 0
                          ? "last day"
                          : `${subscriptionPeriodBanner.daysLeft} day${
                              subscriptionPeriodBanner.daysLeft === 1 ? "" : "s"
                            } left`}
                        ).
                      </>
                    )}
                </p>
                <p className="c360-mt-2 c360-mb-0 c360-text-muted c360-text-sm">
                  When this period ends, your plan returns to Free and any
                  remaining plan credits and add-on balance are reset to zero.
                </p>
              </Alert>
            </div>
          )}
        </div>
        <div className="c360-billing-page__header-aside">
          {billingLoading && <span className="c360-spinner c360-spinner--20" />}
          <Badge color={effectivePlan === "free" ? "gray" : "blue"} dot>
            {effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1)}{" "}
            Plan
          </Badge>
          {creditsInfo && (
            <span className="c360-dropzone__hint">{creditsInfo}</span>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} variant="dashboard">
        <TabsList>
          <TabsTrigger value="plans" icon={<Star size={14} />}>
            Plans
          </TabsTrigger>
          <TabsTrigger value="checkout" icon={<CreditCard size={14} />}>
            Checkout
          </TabsTrigger>
          <TabsTrigger value="requests" icon={<ClipboardList size={14} />}>
            Requests
          </TabsTrigger>
          <TabsTrigger value="invoice" icon={<Receipt size={14} />}>
            Invoice
          </TabsTrigger>
          <TabsTrigger value="history" icon={<History size={14} />}>
            Credit History
          </TabsTrigger>
          <TabsTrigger value="addons" icon={<Package size={14} />}>
            Add-ons
          </TabsTrigger>
          <TabsTrigger value="payment-proof" icon={<Upload size={14} />}>
            Payment Proof
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <BillingPlanCards
            plans={PLANS}
            effectivePlan={effectivePlan}
            onSelectPlan={handleSelectPlan}
            uploadingProof={uploadingProof}
            onUploadProof={() => {
              setUploadingProof(false);
              setActiveTab("payment-proof");
            }}
          />
        </TabsContent>

        <TabsContent value="checkout">
          <BillingCheckoutWizard
            plans={PLANS}
            addons={addons}
            effectivePlan={effectivePlan}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            paymentInstructions={paymentInstructions}
            paymentInstructionsLoading={payInstrLoading}
            paymentInstructionsError={payInstrError}
            onRetryPaymentInstructions={() => void loadPaymentInstructions()}
            onSubmitPaymentRequest={handleSubmitPaymentRequest}
          />
        </TabsContent>

        <TabsContent value="requests">
          <BillingMyPaymentRequests refreshKey={requestsRefresh} />
        </TabsContent>

        <TabsContent value="invoice">
          <BillingInvoiceList
            invoices={invoices}
            totalInvoices={totalInvoices}
            invoicePage={invoicePage}
            invoicePageSize={invoicePageSize}
            onPageChange={setInvoicePage}
            sampleInvoice={invoices.length === 0 ? SAMPLE_INVOICE : null}
          />
        </TabsContent>

        <TabsContent value="history">
          <BillingCreditSummary
            invoices={invoices}
            addons={addons}
            purchasingAddon={purchasingAddon}
            onPurchaseAddon={handlePurchaseAddon}
          />
        </TabsContent>

        <TabsContent value="addons">
          <BillingCreditSummary
            invoices={[]}
            addons={addons}
            purchasingAddon={purchasingAddon}
            onPurchaseAddon={handlePurchaseAddon}
          />
        </TabsContent>

        <TabsContent value="payment-proof">
          <BillingPaymentProofForm
            onSubmitted={() => {
              void refreshBilling();
              setRequestsRefresh((k) => k + 1);
            }}
          />
        </TabsContent>
      </Tabs>
    </DashboardPageLayout>
  );
}
