"use client";

import { Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDate } from "@/lib/utils";
import type { Invoice, AddonPackage } from "@/graphql/generated/types";

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
        subtitle="All credit transactions on your account"
      >
        <div className="c360-table-wrapper">
          <table className="c360-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Credits</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="c360-text-center c360-text-muted c360-p-8"
                  >
                    No credit history yet.
                  </td>
                </tr>
              ) : (
                invoices.map((row) => (
                  <tr key={row.id}>
                    <td className="c360-text-sm c360-text-muted">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="c360-text-sm">
                      {row.description ?? "Invoice"}
                    </td>
                    <td>
                      <span
                        className={cn(
                          "c360-font-semibold c360-text-sm",
                          row.amount >= 0
                            ? "c360-text-success"
                            : "c360-text-danger",
                        )}
                      >
                        {row.amount >= 0 ? "+" : ""}$
                        {Math.abs(row.amount).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <Badge
                        color={
                          row.status === "paid"
                            ? "green"
                            : row.status === "pending"
                              ? "yellow"
                              : "gray"
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
