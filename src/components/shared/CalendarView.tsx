"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { applyVars, useCSSVars } from "@/hooks/useCSSVars";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color?: string;
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  height?: number | string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Lightweight calendar rendered with CSS grid. Shows a month grid
 * with event indicator bars per day. No jQuery/FullCalendar dependency.
 */
export function CalendarView({ events = [], height = 420 }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonthRaw] = useState(today.getMonth());

  const setMonth = (m: number) => {
    if (m < 0) {
      setYear((y) => y - 1);
      setMonthRaw(11);
    } else if (m > 11) {
      setYear((y) => y + 1);
      setMonthRaw(0);
    } else {
      setMonthRaw(m);
    }
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const ev of events) {
    const d = new Date(ev.start);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      eventsByDay[day] = [...(eventsByDay[day] ?? []), ev];
    }
  }

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDay =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : -1;

  const rootRef = useCSSVars<HTMLDivElement>({
    "--c360-calendar-view-h":
      typeof height === "number" ? `${height}px` : String(height),
  });

  return (
    <div ref={rootRef} className="c360-calendar-view">
      <div className="c360-calendar-view__nav">
        <button
          type="button"
          onClick={() => setMonth(month - 1)}
          className="c360-btn c360-btn--ghost c360-btn--sm c360-calendar-view__nav-btn"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="c360-calendar-view__title">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setMonth(month + 1)}
          className="c360-btn c360-btn--ghost c360-btn--sm c360-calendar-view__nav-btn"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="c360-calendar-view__weekdays">
        {DAYS.map((d) => (
          <div key={d} className="c360-calendar-view__weekday">
            {d}
          </div>
        ))}
      </div>

      <div className="c360-calendar-view__grid">
        {cells.map((day, i) => {
          const evs = day ? (eventsByDay[day] ?? []) : [];
          const isToday = day === todayDay;
          return (
            <div
              key={i}
              className={cn(
                "c360-calendar-view__cell",
                day == null && "c360-calendar-view__cell--empty",
                day != null && !isToday && "c360-calendar-view__cell--day",
                isToday && "c360-calendar-view__cell--today",
              )}
            >
              {day != null && (
                <>
                  <span
                    className={cn(
                      "c360-calendar-view__day-num",
                      isToday
                        ? "c360-calendar-view__day-num--today"
                        : "c360-calendar-view__day-num--day",
                    )}
                  >
                    {day}
                  </span>
                  <div className="c360-calendar-view__events">
                    {evs.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        title={ev.title}
                        className="c360-calendar-view__event-bar"
                        ref={(el) =>
                          applyVars(el, {
                            "--c360-cal-event-bg": ev.color ?? null,
                          })
                        }
                      />
                    ))}
                    {evs.length > 2 && (
                      <span
                        className={cn(
                          "c360-calendar-view__more",
                          isToday
                            ? "c360-calendar-view__more--today"
                            : "c360-calendar-view__more--muted",
                        )}
                      >
                        +{evs.length - 2}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
