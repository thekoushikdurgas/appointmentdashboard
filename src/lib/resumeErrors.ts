/**
 * Gateway maps resumeai 502/503/504 to ServiceUnavailableError (503).
 */
export function isResumeServiceUnavailableMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("service unavailable") ||
    m.includes("service_unavailable") ||
    m.includes("503") ||
    m.includes("502") ||
    m.includes("504") ||
    m.includes("resume service") ||
    m.includes("resumeai")
  );
}
