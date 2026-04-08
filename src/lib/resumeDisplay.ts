/**
 * Helpers for `resumeData` JSON (JSON Resume–style `basics`, plus app `title`).
 * @see docs/backend/graphql.modules/29_RESUME_AI_REST_SERVICE.md
 */

export function getResumeDisplayTitle(
  resumeData: Record<string, unknown> | null | undefined,
  resumeId: string,
): string {
  if (!resumeData || typeof resumeData !== "object") {
    return shortId(resumeId);
  }
  const title = resumeData.title;
  if (typeof title === "string" && title.trim()) return title.trim();

  const basics = resumeData.basics as Record<string, unknown> | undefined;
  if (basics && typeof basics === "object") {
    const name = basics.name;
    if (typeof name === "string" && name.trim()) return name.trim();
    const label = basics.label;
    if (typeof label === "string" && label.trim()) return label.trim();
  }

  return shortId(resumeId);
}

function shortId(id: string): string {
  const s = id.replace(/-/g, "");
  return `Resume ${s.slice(0, 8)}`;
}
