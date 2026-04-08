"use client";
import { useState, useEffect, useCallback } from "react";
import {
  billingService,
  type BillingInfoRow,
  type Invoice,
  type AddonPackage,
  type SubscriptionPlanRow,
} from "@/services/graphql/billingService";

const INVOICE_PAGE_SIZE = 10;

export function useBilling() {
  const [billingInfo, setBillingInfo] = useState<BillingInfoRow | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [addons, setAddons] = useState<AddonPackage[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [invoicePage, setInvoicePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [infoRes, plansRes, addonsRes, invoicesRes] =
        await Promise.allSettled([
          billingService.getBillingInfo(),
          billingService.getPlans(),
          billingService.getAddons(),
          billingService.getInvoices({
            limit: INVOICE_PAGE_SIZE,
            offset: (invoicePage - 1) * INVOICE_PAGE_SIZE,
          }),
        ]);

      if (infoRes.status === "fulfilled") {
        setBillingInfo(infoRes.value.billing.billing);
      }
      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value.billing.plans);
      }
      if (addonsRes.status === "fulfilled") {
        setAddons(addonsRes.value.billing.addons);
      }
      if (invoicesRes.status === "fulfilled") {
        setInvoices(invoicesRes.value.billing.invoices.items);
        setTotalInvoices(invoicesRes.value.billing.invoices.total);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [invoicePage]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const subscribe = useCallback(
    async (tier: string, period: string) => {
      const res = await billingService.subscribe({ tier, period });
      await fetchAll();
      return res.billing.subscribe;
    },
    [fetchAll],
  );

  const cancelSubscription = useCallback(async () => {
    const res = await billingService.cancelSubscription();
    await fetchAll();
    return res.billing.cancelSubscription;
  }, [fetchAll]);

  const purchaseAddon = useCallback(
    async (packageId: string) => {
      const res = await billingService.purchaseAddon({ packageId });
      await fetchAll();
      return res.billing.purchaseAddon;
    },
    [fetchAll],
  );

  return {
    billingInfo,
    plans,
    addons,
    invoices,
    totalInvoices,
    invoicePage,
    invoicePageSize: INVOICE_PAGE_SIZE,
    setInvoicePage,
    loading,
    error,
    subscribe,
    cancelSubscription,
    purchaseAddon,
    refresh: fetchAll,
  };
}
