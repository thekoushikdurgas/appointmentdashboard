import { Suspense } from "react";

export default function ActivitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="c360-p-6 c360-text-muted c360-text-sm">Loading…</div>
      }
    >
      {children}
    </Suspense>
  );
}
