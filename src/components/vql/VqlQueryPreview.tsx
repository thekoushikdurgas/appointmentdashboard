"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { VqlQueryInput } from "@/graphql/generated/types";

type PreviewMode = "advanced" | "full";

export function VqlQueryPreview({
  query,
  fullQuery,
}: {
  query: Partial<VqlQueryInput>;
  /** When set (e.g. merged list request from the contacts page), user can switch previews. */
  fullQuery?: Partial<VqlQueryInput> | null;
}) {
  const [mode, setMode] = useState<PreviewMode>(
    fullQuery && Object.keys(fullQuery).length > 0 ? "full" : "advanced",
  );

  const activeQuery = useMemo(() => {
    if (mode === "full" && fullQuery && Object.keys(fullQuery).length > 0) {
      return fullQuery;
    }
    return query;
  }, [mode, fullQuery, query]);

  const json = JSON.stringify(activeQuery, null, 2);

  const showToggle = fullQuery != null && Object.keys(fullQuery).length > 0;

  return (
    <div className="c360-vql-preview">
      <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2 c360-mb-2">
        {showToggle ? (
          <div
            className="c360-flex c360-gap-1"
            role="group"
            aria-label="Preview source"
          >
            <button
              type="button"
              className={`c360-btn-ghost c360-text-xs ${mode === "advanced" ? "c360-font-semibold" : ""}`}
              onClick={() => setMode("advanced")}
            >
              Advanced only
            </button>
            <button
              type="button"
              className={`c360-btn-ghost c360-text-xs ${mode === "full" ? "c360-font-semibold" : ""}`}
              onClick={() => setMode("full")}
            >
              Full list query
            </button>
          </div>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void navigator.clipboard.writeText(json)}
        >
          Copy JSON
        </Button>
      </div>
      <pre className="c360-p-3 c360-rounded c360-text-xs c360-max-h-80 c360-overflow-auto c360-vql-json-preview">
        {json}
      </pre>
    </div>
  );
}
