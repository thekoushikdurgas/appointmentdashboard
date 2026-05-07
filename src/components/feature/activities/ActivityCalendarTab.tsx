"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { applyVars } from "@/hooks/useCSSVars";
import {
  CalendarView,
  sameCalendarDay,
  type CalendarEvent,
} from "@/components/shared/CalendarView";

interface ActivityCalendarTabProps {
  events: CalendarEvent[];
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatEventTimeRange(ev: CalendarEvent): string {
  const s = new Date(ev.start);
  const e = ev.end ? new Date(ev.end) : s;
  const tOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  if (ev.end && !Number.isNaN(e.getTime()) && e.getTime() !== s.getTime()) {
    return `${s.toLocaleTimeString(undefined, tOpts)} – ${e.toLocaleTimeString(undefined, tOpts)}`;
  }
  return s.toLocaleTimeString(undefined, tOpts);
}

export function ActivityCalendarTab({ events }: ActivityCalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfLocalDay(new Date()),
  );

  const dayEvents = useMemo(() => {
    return events
      .filter((ev) => sameCalendarDay(new Date(ev.start), selectedDate))
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
  }, [events, selectedDate]);

  const footer = (
    <div className="c360-activity-calendar-tab__footer-inner">
      <div className="c360-activity-calendar-tab__footer-head">
        <span className="c360-activity-calendar-tab__selected-label">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="c360-activity-calendar-tab__add-btn"
          disabled
          title="Add event (coming soon)"
          aria-label="Add event (coming soon)"
        >
          <Plus size={16} aria-hidden />
        </Button>
      </div>
      <div className="c360-activity-calendar-tab__event-list">
        {dayEvents.length === 0 ? (
          <p className="c360-activity-calendar-tab__empty c360-m-0">
            No events on this day.
          </p>
        ) : (
          dayEvents.map((ev) => (
            <div
              key={ev.id}
              className="c360-activity-calendar-tab__event-slot"
              ref={(el) =>
                applyVars(el, {
                  "--c360-cal-slot-accent": ev.color ?? null,
                })
              }
            >
              <div className="c360-activity-calendar-tab__event-title">
                {ev.title}
              </div>
              <div className="c360-activity-calendar-tab__event-time">
                {formatEventTimeRange(ev)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Card
      className="c360-card--activity-calendar-tab"
      // title="Activity Calendar"
      // subtitle="Events mapped to calendar days"
      padding="none"
      footer={footer}
    >
      <div className="c360-activity-calendar-tab__calendar-wrap">
        <CalendarView
          events={events}
          height={360}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
    </Card>
  );
}
