"use client";

import { useMemo, useState } from "react";
import {
  DatePicker,
  parseDate,
  type DateValue,
} from "@ark-ui/react/date-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Invoice } from "@/graphql/generated/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const NUM_OF_MONTHS = 2;

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateValueToKey(dv: DateValue, timeZone: string): string {
  return localDateKey(dv.toDate(timeZone));
}

function buildActivityByDay(
  invoices: Invoice[],
): Record<string, { net: number; items: Invoice[] }> {
  const map: Record<string, { net: number; items: Invoice[] }> = {};
  for (const inv of invoices) {
    const d = new Date(inv.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = localDateKey(d);
    if (!map[key]) map[key] = { net: 0, items: [] };
    map[key].net += inv.amount;
    map[key].items.push(inv);
  }
  for (const entry of Object.values(map)) {
    entry.items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  return map;
}

export interface CreditHistoryCalendarProps {
  invoices: Invoice[];
}

export function CreditHistoryCalendar({
  invoices,
}: CreditHistoryCalendarProps) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const activityByDay = useMemo(() => buildActivityByDay(invoices), [invoices]);

  const [value, setValue] = useState<DateValue[]>(() => [
    parseDate(new Date()),
  ]);

  const selectedKey = value[0]
    ? dateValueToKey(value[0], timeZone)
    : localDateKey(new Date());
  const selectedBucket = activityByDay[selectedKey];

  return (
    <div className="c360-credit-cal">
      <p className="c360-credit-cal__hint c360-text-sm c360-text-muted c360-mb-3">
        Browse two months at a time. Days with billing activity show the net
        amount for that day; tap a day for details.
      </p>

      <DatePicker.Root
        inline
        value={value}
        onValueChange={(d) => setValue(d.value)}
        timeZone={timeZone}
        numOfMonths={NUM_OF_MONTHS}
        closeOnSelect={false}
      >
        <DatePicker.Content className="c360-credit-cal__content">
          <DatePicker.View view="day" className="c360-credit-cal__day-view">
            <nav
              className="c360-credit-cal__nav"
              aria-label="Calendar navigation"
            >
              <DatePicker.PrevTrigger className="c360-credit-cal__nav-btn">
                <ChevronLeft className="c360-credit-cal__icon" aria-hidden />
              </DatePicker.PrevTrigger>
              <DatePicker.NextTrigger className="c360-credit-cal__nav-btn">
                <ChevronRight className="c360-credit-cal__icon" aria-hidden />
              </DatePicker.NextTrigger>
            </nav>
            <DatePicker.Context>
              {(api) =>
                Array.from({ length: NUM_OF_MONTHS }).map((_, index) => {
                  const offset = api.getOffset({ months: index });
                  return (
                    <div key={index} className="c360-credit-cal__month-col">
                      <DatePicker.ViewControl className="c360-credit-cal__month-title-row">
                        <DatePicker.ViewTrigger className="c360-credit-cal__month-title">
                          <span>
                            {new Intl.DateTimeFormat("default", {
                              month: "long",
                            }).format(
                              offset.visibleRange.start.toDate(timeZone),
                            )}{" "}
                            {offset.visibleRange.start.year}
                          </span>
                        </DatePicker.ViewTrigger>
                      </DatePicker.ViewControl>
                      <DatePicker.Table className="c360-credit-cal__table">
                        <DatePicker.TableHead>
                          <DatePicker.TableRow>
                            {api.weekDays.map((weekDay, wid) => (
                              <DatePicker.TableHeader
                                key={wid}
                                className="c360-credit-cal__weekday"
                              >
                                {weekDay.narrow}
                              </DatePicker.TableHeader>
                            ))}
                          </DatePicker.TableRow>
                        </DatePicker.TableHead>
                        <DatePicker.TableBody>
                          {offset.weeks.map((week, wid) => (
                            <DatePicker.TableRow key={wid}>
                              {week.map((day, did) => {
                                const dateKey = localDateKey(
                                  day.toDate(timeZone),
                                );
                                const bucket = activityByDay[dateKey];
                                const net = bucket?.net;
                                return (
                                  <DatePicker.TableCell
                                    key={did}
                                    value={day}
                                    className="c360-credit-cal__cell"
                                    visibleRange={offset.visibleRange}
                                  >
                                    <DatePicker.TableCellTrigger
                                      className={cn(
                                        "c360-credit-cal__cell-trigger",
                                        net != null &&
                                          net >= 0 &&
                                          "c360-credit-cal__cell-trigger--net-pos",
                                        net != null &&
                                          net < 0 &&
                                          "c360-credit-cal__cell-trigger--net-neg",
                                      )}
                                    >
                                      <span>{day.day}</span>
                                      {net != null ? (
                                        <span className="c360-credit-cal__cell-amount">
                                          {net >= 0 ? "+" : "−"}
                                          {formatCurrency(Math.abs(net))}
                                        </span>
                                      ) : null}
                                    </DatePicker.TableCellTrigger>
                                  </DatePicker.TableCell>
                                );
                              })}
                            </DatePicker.TableRow>
                          ))}
                        </DatePicker.TableBody>
                      </DatePicker.Table>
                    </div>
                  );
                })
              }
            </DatePicker.Context>
          </DatePicker.View>

          <DatePicker.View view="month">
            <DatePicker.Context>
              {(api) => (
                <>
                  <DatePicker.ViewControl className="c360-credit-cal__drill-controls">
                    <DatePicker.PrevTrigger className="c360-credit-cal__nav-btn">
                      <ChevronLeft
                        className="c360-credit-cal__icon"
                        aria-hidden
                      />
                    </DatePicker.PrevTrigger>
                    <DatePicker.ViewTrigger className="c360-credit-cal__drill-title">
                      <DatePicker.RangeText />
                    </DatePicker.ViewTrigger>
                    <DatePicker.NextTrigger className="c360-credit-cal__nav-btn">
                      <ChevronRight
                        className="c360-credit-cal__icon"
                        aria-hidden
                      />
                    </DatePicker.NextTrigger>
                  </DatePicker.ViewControl>
                  <DatePicker.Table className="c360-credit-cal__grid-table">
                    <DatePicker.TableBody>
                      {api
                        .getMonthsGrid({ columns: 4, format: "short" })
                        .map((months, rowId) => (
                          <DatePicker.TableRow key={rowId}>
                            {months.map((month, mid) => (
                              <DatePicker.TableCell
                                key={mid}
                                value={month.value}
                              >
                                <DatePicker.TableCellTrigger className="c360-credit-cal__grid-cell">
                                  {month.label}
                                </DatePicker.TableCellTrigger>
                              </DatePicker.TableCell>
                            ))}
                          </DatePicker.TableRow>
                        ))}
                    </DatePicker.TableBody>
                  </DatePicker.Table>
                </>
              )}
            </DatePicker.Context>
          </DatePicker.View>

          <DatePicker.View view="year">
            <DatePicker.Context>
              {(api) => (
                <>
                  <DatePicker.ViewControl className="c360-credit-cal__drill-controls">
                    <DatePicker.PrevTrigger className="c360-credit-cal__nav-btn">
                      <ChevronLeft
                        className="c360-credit-cal__icon"
                        aria-hidden
                      />
                    </DatePicker.PrevTrigger>
                    <DatePicker.ViewTrigger className="c360-credit-cal__drill-title">
                      <DatePicker.RangeText />
                    </DatePicker.ViewTrigger>
                    <DatePicker.NextTrigger className="c360-credit-cal__nav-btn">
                      <ChevronRight
                        className="c360-credit-cal__icon"
                        aria-hidden
                      />
                    </DatePicker.NextTrigger>
                  </DatePicker.ViewControl>
                  <DatePicker.Table className="c360-credit-cal__grid-table">
                    <DatePicker.TableBody>
                      {api.getYearsGrid({ columns: 4 }).map((years, rowId) => (
                        <DatePicker.TableRow key={rowId}>
                          {years.map((year, yid) => (
                            <DatePicker.TableCell key={yid} value={year.value}>
                              <DatePicker.TableCellTrigger className="c360-credit-cal__grid-cell">
                                {year.label}
                              </DatePicker.TableCellTrigger>
                            </DatePicker.TableCell>
                          ))}
                        </DatePicker.TableRow>
                      ))}
                    </DatePicker.TableBody>
                  </DatePicker.Table>
                </>
              )}
            </DatePicker.Context>
          </DatePicker.View>
        </DatePicker.Content>
      </DatePicker.Root>

      <div className="c360-credit-cal__detail">
        <div className="c360-credit-cal__detail-head">
          <span className="c360-credit-cal__detail-date">
            {value[0]
              ? formatDate(value[0].toDate(timeZone))
              : formatDate(new Date())}
          </span>
          {selectedBucket ? (
            <span
              className={cn(
                "c360-credit-cal__detail-net",
                selectedBucket.net >= 0
                  ? "c360-text-success"
                  : "c360-text-danger",
              )}
            >
              Net {selectedBucket.net >= 0 ? "+" : "−"}
              {formatCurrency(Math.abs(selectedBucket.net))}
            </span>
          ) : (
            <span className="c360-text-muted c360-text-sm">No activity</span>
          )}
        </div>

        {selectedBucket && selectedBucket.items.length > 0 ? (
          <ul className="c360-credit-cal__detail-list">
            {selectedBucket.items.map((row) => (
              <li key={row.id} className="c360-credit-cal__detail-row">
                <div className="c360-credit-cal__detail-main">
                  <span className="c360-credit-cal__detail-desc">
                    {row.description ?? "Invoice"}
                  </span>
                  <span className="c360-credit-cal__detail-time c360-text-muted">
                    {new Date(row.createdAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="c360-credit-cal__detail-side">
                  <span
                    className={cn(
                      "c360-font-semibold c360-text-sm",
                      row.amount >= 0
                        ? "c360-text-success"
                        : "c360-text-danger",
                    )}
                  >
                    {row.amount >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(row.amount))}
                  </span>
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
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="c360-credit-cal__detail-empty c360-text-sm c360-text-muted c360-m-0">
            {invoices.length === 0
              ? "No credit history yet. Purchases and adjustments will appear here."
              : "No transactions on this day. Choose another date on the calendar."}
          </p>
        )}
      </div>
    </div>
  );
}
