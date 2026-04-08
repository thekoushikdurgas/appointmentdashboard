"use client";

import { Card } from "@/components/ui/Card";
import {
  CalendarView,
  type CalendarEvent,
} from "@/components/shared/CalendarView";

interface ActivityCalendarTabProps {
  events: CalendarEvent[];
}

export function ActivityCalendarTab({ events }: ActivityCalendarTabProps) {
  return (
    <Card title="Activity Calendar" subtitle="Events mapped to calendar days">
      <CalendarView events={events} height={460} />
    </Card>
  );
}
