/** Non-suspending fallback for app-shell Suspense boundaries (useSearchParams, etc.). */
export function ShellSuspenseFallback() {
  return (
    <div className="c360-shell c360-flex c360-items-center c360-justify-center c360-min-h-screen">
      <div className="c360-spinner" aria-label="Loading…" />
    </div>
  );
}
