"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DashboardLineChart } from "@/components/shared/DashboardLineChart";
import {
  DashboardActivityFeed,
  type ActivityItem,
} from "./DashboardActivityFeed";

export interface AreaDataPoint {
  time: string;
  contacts: number;
  emails: number;
}

interface DashboardChartSectionProps {
  liveData?: AreaDataPoint[];
  activity: ActivityItem[];
}

export function DashboardChartSection({
  activity,
}: DashboardChartSectionProps) {
  return (
    <div className="c360-dashboard-layout__charts">
      <Card
        title="Email Activity"
        subtitle="Daily finds & verifications (last 30 days)"
      >
        <DashboardLineChart />
      </Card>

      <Card title="Recent Activity" subtitle="Latest events">
        <DashboardActivityFeed items={activity} />
      </Card>
    </div>
  );
}

interface DashboardLiveChartProps {
  liveData: AreaDataPoint[];
}

export function DashboardLiveChart({ liveData }: DashboardLiveChartProps) {
  return (
    <Card
      title="Live Activity Stream"
      subtitle="Real-time contacts & emails (updates every 8s)"
      className="c360-mb-4"
      actions={
        <Badge color="green" dot>
          Live
        </Badge>
      }
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={liveData}>
          <defs>
            <linearGradient id="liveContacts" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--c360-primary)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--c360-primary)"
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="liveEmails" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--c360-success)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--c360-success)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--c360-border)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "var(--c360-text-muted)" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "var(--c360-text-muted)" }} />
          <Tooltip
            contentStyle={{
              background: "var(--c360-card-bg)",
              border: "1px solid var(--c360-border)",
              borderRadius: "var(--c360-radius-sm)",
              fontSize: 12,
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="contacts"
            name="Contacts"
            stroke="var(--c360-primary)"
            fill="url(#liveContacts)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="emails"
            name="Emails"
            stroke="var(--c360-success)"
            fill="url(#liveEmails)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
