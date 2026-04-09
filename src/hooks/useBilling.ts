"use client";
import { useState, useEffect, useCallback } from "react";
import {
  billingService,
  type BillingInfoRow,
  type Invoice,
  type AddonPackage,
  type SubscriptionPlanRow,
} from "@/services/graphql/billingService";
import {
  readTTLCache,
  writeTTLCache,
  clearTTLCache,
} from "@/lib/ttlLocalStorageCache";

const INVOICE_PAGE_SIZE = 10;
const BILLING_CACHE_KEY = "c360:billing:v1";
const BILLING_TTL_MS = 10 * 60 * 1000;

interface BillingCache {
  billingInfo: BillingInfoRow | null;
  plans: SubscriptionPlanRow[];
  addons: AddonPackage[];
}

export function useBilling() {
  const [billingInfo, setBillingInfo] = useState<BillingInfoRow | null>(
    () => readTTLCache<BillingCache>(BILLING_CACHE_KEY)?.billingInfo ?? null,
  );
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>(
    () => readTTLCache<BillingCache>(BILLING_CACHE_KEY)?.plans ?? [],
  );
  const [addons, setAddons] = useState<AddonPackage[]>(
    () => readTTLCache<BillingCache>(BILLING_CACHE_KEY)?.addons ?? [],
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [invoicePage, setInvoicePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (invalidateCache = false) => {
      if (invalidateCache) clearTTLCache(BILLING_CACHE_KEY);

      setLoading(true);
      setError(null);
      try {
        // Plans and addons change rarely; use cache for them
        const cachedStatic = invalidateCache
          ? null
          : readTTLCache<BillingCache>(BILLING_CACHE_KEY);

        const [infoRes, plansRes, addonsRes, invoicesRes] =
          await Promise.allSettled([
            billingService.getBillingInfo(),
            cachedStatic ? Promise.resolve(null) : billingService.getPlans(),
            cachedStatic ? Promise.resolve(null) : billingService.getAddons(),
            billingService.getInvoices({
              limit: INVOICE_PAGE_SIZE,
              offset: (invoicePage - 1) * INVOICE_PAGE_SIZE,
            }),
          ]);

        let newBillingInfo: BillingInfoRow | null = billingInfo;
        let newPlans: SubscriptionPlanRow[] = plans;
        let newAddons: AddonPackage[] = addons;

        if (infoRes.status === "fulfilled" && infoRes.value) {
          newBillingInfo = infoRes.value.billing.billing;
          setBillingInfo(newBillingInfo);
        }
        if (plansRes.status === "fulfilled" && plansRes.value) {
          newPlans = plansRes.value.billing.plans;
          setPlans(newPlans);
        } else if (cachedStatic) {
          newPlans = cachedStatic.plans;
        }
        if (addonsRes.status === "fulfilled" && addonsRes.value) {
          newAddons = addonsRes.value.billing.addons;
          setAddons(newAddons);
        } else if (cachedStatic) {
          newAddons = cachedStatic.addons;
        }
        if (invoicesRes.status === "fulfilled") {
          setInvoices(invoicesRes.value.billing.invoices.items);
          setTotalInvoices(invoicesRes.value.billing.invoices.total);
        }

        // Persist static billing data to localStorage
        writeTTLCache<BillingCache>(
          BILLING_CACHE_KEY,
          { billingInfo: newBillingInfo, plans: newPlans, addons: newAddons },
          BILLING_TTL_MS,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoicePage],
  );

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const subscribe = useCallback(
    async (tier: string, period: string) => {
      const res = await billingService.subscribe({ tier, period });
      await fetchAll(true);
      return res.billing.subscribe;
    },
    [fetchAll],
  );

  const cancelSubscription = useCallback(async () => {
    const res = await billingService.cancelSubscription();
    await fetchAll(true);
    return res.billing.cancelSubscription;
  }, [fetchAll]);

  const purchaseAddon = useCallback(
    async (packageId: string) => {
      const res = await billingService.purchaseAddon({ packageId });
      await fetchAll(true);
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
    refresh: () => fetchAll(true),
  };
}
