"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  InvoiceCard,
  InvoicePrintActions,
  type InvoiceData,
} from "@/components/shared/InvoiceCard";
import type { Invoice } from "@/services/graphql/billingService";
import { formatDate } from "@/lib/utils";

interface BillingInvoiceListProps {
  invoices: Invoice[];
  totalInvoices: number;
  invoicePage: number;
  invoicePageSize: number;
  onPageChange: (page: number) => void;
  /** Shown only when there are no API invoices (demo printable). */
  sampleInvoice?: InvoiceData | null;
}

function mapInvoiceToPrintable(inv: Invoice): InvoiceData {
  const st = inv.status.toLowerCase();
  const status =
    st === "paid" ? "paid" : st === "pending" ? "pending" : "overdue";
  return {
    invoiceNumber: inv.id,
    date: inv.createdAt,
    plan: inv.description ?? "Invoice",
    amount: inv.amount,
    status,
    items: [
      {
        description: inv.description ?? "Billing item",
        quantity: 1,
        unitPrice: inv.amount,
        total: inv.amount,
      },
    ],
  };
}

function isManualPaymentInvoiceId(id: string): boolean {
  return id.startsWith("PS-");
}

export function BillingInvoiceList({
  invoices,
  totalInvoices,
  invoicePage,
  invoicePageSize,
  onPageChange,
  sampleInvoice,
}: BillingInvoiceListProps) {
  const totalPages = Math.max(1, Math.ceil(totalInvoices / invoicePageSize));
  const printable =
    invoices.length > 0 ? mapInvoiceToPrintable(invoices[0]) : sampleInvoice;

  return (
    <>
      <p className="c360-text-muted c360-text-sm c360-mb-2">
        Subscription billing and approved manual UPI payments both appear here as
        invoices. Rows with ID starting with{" "}
        <span className="c360-font-mono">PS-</span> are manual payments
        confirmed by our team.
      </p>
      <p className="c360-page-subtitle c360-mb-4">
        {totalInvoices} invoice(s) total (page {invoicePage} of {totalPages}).
      </p>
      <div className="c360-flex c360-items-center c360-justify-between c360-flex-wrap c360-gap-2 c360-mb-4">
        <div className="c360-flex c360-gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={invoicePage <= 1}
            onClick={() => onPageChange(Math.max(1, invoicePage - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={invoicePage * invoicePageSize >= totalInvoices}
            onClick={() => onPageChange(invoicePage + 1)}
          >
            Next
          </Button>
        </div>
        {printable && (
          <InvoicePrintActions invoiceId={printable.invoiceNumber} />
        )}
      </div>

      {invoices.length > 0 ? (
        <div className="c360-table-wrapper c360-mb-6">
          <table className="c360-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="c360-text-sm">
                    <span className="c360-inline-flex c360-items-center c360-gap-2 c360-flex-wrap">
                      <span className="c360-font-mono">{inv.id}</span>
                      {isManualPaymentInvoiceId(inv.id) ? (
                        <Badge color="secondary" size="sm">
                          Manual
                        </Badge>
                      ) : null}
                    </span>
                  </td>
                  <td className="c360-text-sm c360-text-muted">
                    {formatDate(inv.createdAt)}
                  </td>
                  <td>${inv.amount.toFixed(2)}</td>
                  <td>{inv.status}</td>
                  <td className="c360-text-sm">{inv.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="c360-text-muted c360-mb-4">No invoices returned yet.</p>
      )}

      {printable && <InvoiceCard invoice={printable} />}
    </>
  );
}
