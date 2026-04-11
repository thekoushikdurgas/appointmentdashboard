"use client";

import { Button } from "@/components/ui/Button";
import type { VqlQueryInput } from "@/graphql/generated/types";

export function VqlQueryPreview({ query }: { query: Partial<VqlQueryInput> }) {
  const json = JSON.stringify(query, null, 2);
  return (
    <div className="c360-vql-preview">
      <div className="c360-flex c360-justify-end c360-mb-2">
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
