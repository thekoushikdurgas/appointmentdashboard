"use client";

import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  plan: string;
  amount: number;
  currency?: string;
  status: "paid" | "pending" | "overdue";
  companyName?: string;
  companyEmail?: string;
  billingAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface InvoiceCardProps {
  invoice: InvoiceData;
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const currency = invoice.currency ?? "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

  return (
    <div id="invoice-printable" className="c360-invoice-card">
      <div className="c360-invoice-card__header">
        <div>
          <div className="c360-invoice-card__brand-row">
            <div className="c360-invoice-card__logo">
              <span className="c360-invoice-card__logo-letter">C</span>
            </div>
            <span className="c360-invoice-card__brand-name">Contact360</span>
          </div>
          {invoice.companyEmail && (
            <div className="c360-invoice-card__brand-email">
              {invoice.companyEmail}
            </div>
          )}
        </div>
        <div className="c360-invoice-card__header-right">
          <div className="c360-invoice-card__title">INVOICE</div>
          <div className="c360-invoice-card__number">
            #{invoice.invoiceNumber}
          </div>
          <div
            className="c360-invoice-card__status-badge"
            data-status={invoice.status}
          >
            {invoice.status}
          </div>
        </div>
      </div>

      <div className="c360-invoice-card__meta">
        <div>
          <div className="c360-invoice-card__section-label">Bill To</div>
          {invoice.companyName && (
            <div className="c360-invoice-card__company-name">
              {invoice.companyName}
            </div>
          )}
          {invoice.billingAddress && (
            <div className="c360-invoice-card__address">
              {invoice.billingAddress}
            </div>
          )}
        </div>
        <div>
          <div className="c360-invoice-card__section-label">
            Invoice Details
          </div>
          <div className="c360-invoice-card__details-stack">
            <div className="c360-invoice-card__detail-row">
              <span className="c360-invoice-card__detail-label">
                Issue date:
              </span>
              <span>{formatDate(invoice.date)}</span>
            </div>
            {invoice.dueDate && (
              <div className="c360-invoice-card__detail-row">
                <span className="c360-invoice-card__detail-label">
                  Due date:
                </span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
            )}
            <div className="c360-invoice-card__detail-row">
              <span className="c360-invoice-card__detail-label">Plan:</span>
              <span className="c360-invoice-card__detail-strong">
                {invoice.plan}
              </span>
            </div>
          </div>
        </div>
      </div>

      <table className="c360-invoice-card__table">
        <thead>
          <tr className="c360-invoice-card__thead-row">
            <th className="c360-invoice-card__th c360-invoice-card__th--left">
              Description
            </th>
            <th className="c360-invoice-card__th c360-invoice-card__th--center">
              Qty
            </th>
            <th className="c360-invoice-card__th c360-invoice-card__th--right">
              Unit Price
            </th>
            <th className="c360-invoice-card__th c360-invoice-card__th--right">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} className="c360-invoice-card__row">
              <td className="c360-invoice-card__td">{item.description}</td>
              <td className="c360-invoice-card__td c360-invoice-card__td--center c360-invoice-card__td--muted">
                {item.quantity}
              </td>
              <td className="c360-invoice-card__td c360-invoice-card__td--right c360-invoice-card__td--muted">
                {fmt(item.unitPrice)}
              </td>
              <td className="c360-invoice-card__td c360-invoice-card__td--right c360-invoice-card__td--amount">
                {fmt(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="c360-invoice-card__total-label">
              Total:
            </td>
            <td className="c360-invoice-card__total-value">
              {fmt(invoice.amount)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="c360-invoice-card__footer">
        Thank you for your business. For questions about this invoice, please
        contact support@contact360.io.
      </div>
    </div>
  );
}

export function InvoicePrintActions({ invoiceId }: { invoiceId: string }) {
  return (
    <div className="c360-flex c360-gap-2">
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Printer size={14} />}
        title={`Print invoice ${invoiceId}`}
        onClick={() => window.print()}
      >
        Print
      </Button>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Download size={14} />}
        title={`Save as PDF (print dialog) — invoice ${invoiceId}`}
        onClick={() => window.print()}
      >
        Download PDF
      </Button>
    </div>
  );
}
