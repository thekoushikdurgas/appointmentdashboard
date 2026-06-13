"use client";

import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { RunsSessionsFilter } from "@/components/feature/hiring-signals/runsSessionsFilter";

export type { RunsSessionsFilter } from "@/components/feature/hiring-signals/runsSessionsFilter";

export interface RunsSessionsToolbarProps {
  title: string;
  description: string;
  filter: RunsSessionsFilter;
  onFilterChange: (filter: RunsSessionsFilter) => void;
  runsLoading: boolean;
  onReload: () => void;
  trailingActions?: ReactNode;
}

export function RunsSessionsToolbar({
  title,
  description,
  filter,
  onFilterChange,
  runsLoading,
  onReload,
  trailingActions,
}: RunsSessionsToolbarProps) {
  return (
    <div className="c360-hs-runs-sessions-toolbar c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
      <div className="c360-hs-runs-sessions-toolbar__lead c360-flex c360-min-w-0">
        <div>
          <h2 className="c360-m-0 c360-text-sm c360-font-semibold c360-text-ink">
            {title}
          </h2>
          <p className="c360-m-0 c360-mt-1 c360-text-2xs c360-text-muted">
            {description}
          </p>
        </div>
        <div className="c360-flex c360-flex-wrap c360-gap-2">
          <Button
            type="button"
            size="sm"
            variant={filter === "active" ? "primary" : "outline"}
            onClick={() => onFilterChange("active")}
          >
            Active
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === "running" ? "primary" : "outline"}
            onClick={() => onFilterChange("running")}
          >
            Running
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === "all" ? "primary" : "outline"}
            onClick={() => onFilterChange("all")}
          >
            All
          </Button>
        </div>
      </div>
      <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="c360-gap-2"
          onClick={onReload}
          disabled={runsLoading}
          leftIcon={
            <RefreshCw size={15} className={cn(runsLoading && "c360-spin")} />
          }
        >
          Reload
        </Button>
        {trailingActions}
      </div>
    </div>
  );
}
