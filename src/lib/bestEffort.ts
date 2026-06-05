/**
 * Best-effort async/sync operations: silent in production, debug-logged in development.
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("bestEffort");

function logBestEffortFailure(label: string, error: unknown): void {
  log.debug(label, { error });
}

/** Run sync work; failures are swallowed (dev: logger debug). */
export function swallowBestEffortSync(label: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    logBestEffortFailure(label, error);
  }
}

/** Fire-and-forget async work; rejections are swallowed (dev: logger debug). */
export function swallowBestEffort(
  label: string,
  fn: () => void | Promise<void>,
): void {
  try {
    const result = fn();
    if (
      result != null &&
      typeof (result as Promise<void>).then === "function"
    ) {
      void (result as Promise<void>).catch((error) => {
        logBestEffortFailure(label, error);
      });
    }
  } catch (error) {
    logBestEffortFailure(label, error);
  }
}

/** Await async work; failures are swallowed (dev: logger debug). */
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
