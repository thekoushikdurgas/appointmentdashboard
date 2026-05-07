"use client";

import { Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Invoice, AddonPackage } from "@/graphql/generated/types";
import { CreditHistoryCalendar } from "./CreditHistoryCalendar";

interface BillingCreditSummaryProps {
  invoices: Invoice[];
  addons: AddonPackage[];
  purchasingAddon: string | null;
  onPurchaseAddon: (addonId: string) => Promise<void>;
}

export function BillingCreditSummary({
  invoices,
  addons,
  purchasingAddon,
  onPurchaseAddon,
}: BillingCreditSummaryProps) {
  return (
    <>
      <Card
        title="Credit History"
        subtitle="Calendar view of billing activity; open month or year from the month label"
      >
        <CreditHistoryCalendar invoices={invoices} />
      </Card>

      <Card
        title="Credit Add-on Packages"
        subtitle="Purchase additional credits without changing your plan"
        className="c360-mt-4"
      >
        {addons.length === 0 ? (
          <div className="c360-empty-state">
            <p className="c360-empty-state__desc">
              No add-on packages available.
            </p>
          </div>
        ) : (
          <div className="c360-plan-grid">
            {addons.map((addon) => (
              <div key={addon.id} className="c360-card">
                <div className="c360-card__body c360-text-center">
                  <Package size={28} className="c360-text-primary c360-mb-3" />
                  <p className="c360-font-bold c360-text-lg c360-mb-1">
                    {addon.name}
                  </p>
                  <p className="c360-page-subtitle c360-mb-3">
                    {addon.credits.toLocaleString()} credits
                  </p>
                  <p className="c360-font-bold c360-text-xl c360-text-primary c360-mb-4">
                    ${addon.price}
                  </p>
                  <p className="c360-dropzone__hint c360-mb-4">
                    ${addon.ratePerCredit.toFixed(4)} / credit
                  </p>
                  <Button
                    size="sm"
                    className="c360-w-full"
                    loading={purchasingAddon === addon.id}
                    onClick={() => onPurchaseAddon(addon.id)}
                  >
                    Purchase
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
