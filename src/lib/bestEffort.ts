/**
 * Best-effort async/sync operations: silent in production, debug-logged in development.
 */

function logBestEffortFailure(label: string, error: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  console.debug(`[bestEffort] ${label}`, error);
}

/** Run sync work; failures are swallowed (dev: console.debug). */
export function swallowBestEffortSync(label: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    logBestEffortFailure(label, error);
  }
}

/** Fire-and-forget async work; rejections are swallowed (dev: console.debug). */
export function swallowBestEffort(label: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result != null && typeof (result as Promise<void>).then === "function") {
      void (result as Promise<void>).catch((error) => {
        logBestEffortFailure(label, error);
      });
    }
  } catch (error) {
    logBestEffortFailure(label, error);
  }
}

/** Await async work; failures are swallowed (dev: console.debug). */
export async function swallowBestEffortAsync(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logBestEffortFailure(label, error);
  }
}
