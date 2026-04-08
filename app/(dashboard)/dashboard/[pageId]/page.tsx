"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { pageApi } from "@/lib/pageApi";
import { DynamicPage, DynamicPageBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/shared/Skeleton";

function BlockRenderer({ block }: { block: DynamicPageBlock }) {
  switch (block.type) {
    case "text":
      return (
        <div
          className="c360-dynamic-block-text"
          dangerouslySetInnerHTML={{
            __html: String(block.data.html ?? block.data.content ?? ""),
          }}
        />
      );
    case "stat":
      return (
        <div className="c360-dynamic-stats">
          {(block.data.stats as Array<{ label: string; value: string }>)?.map(
            (s, i) => (
              <div key={i} className="c360-dynamic-stat-card">
                <div className="c360-dynamic-stat-value">{s.value}</div>
                <div className="c360-dynamic-stat-label">{s.label}</div>
              </div>
            ),
          )}
        </div>
      );
    case "embed":
      return (
        <div className="c360-dynamic-embed">
          <iframe
            src={String(block.data.url ?? "")}
            className="c360-dynamic-embed-frame"
            title={String(block.data.title ?? "embed")}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      );
    default:
      return (
        <div className="c360-dynamic-stub">
          Block type &quot;{block.type}&quot; — renderer not yet implemented.
        </div>
      );
  }
}

export default function DynamicPageRoute() {
  const params = useParams<{ pageId: string }>();
  const [page, setPage] = useState<DynamicPage | null | undefined>(undefined);

  useEffect(() => {
    if (!params?.pageId) return;
    pageApi.getPage(params.pageId).then((p) => setPage(p));
  }, [params?.pageId]);

  if (page === undefined) {
    return (
      <div className="c360-p-6">
        <Skeleton className="c360-mb-4" height={48} width={320} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (page === null) {
    notFound();
  }

  return (
    <div className="c360-p-6 c360-mx-auto c360-max-w-960">
      <div className="c360-mb-6">
        <h1 className="c360-page-title">{page.title}</h1>
        {page.description && (
          <p className="c360-page-subtitle">{page.description}</p>
        )}
      </div>

      <div className="c360-flex c360-flex-col c360-gap-4">
        {page.content.length === 0 ? (
          <Card>
            <div className="c360-p-8 c360-text-center c360-text-muted">
              This page has no content yet.
            </div>
          </Card>
        ) : (
          page.content.map((block) => (
            <Card key={block.id}>
              <div className="c360-p-4">
                <BlockRenderer block={block} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
