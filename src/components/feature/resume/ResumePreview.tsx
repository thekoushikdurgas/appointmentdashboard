"use client";

/** Renders structured résumé JSON (Resume Matcher ``ResumeData`` shape). */
export function ResumePreview({ data }: { data: Record<string, unknown> }) {
  const pi = (data.personalInfo ?? {}) as Record<string, unknown>;
  const summary = String(data.summary ?? "");

  const wx = Array.isArray(data.workExperience)
    ? (data.workExperience as Record<string, unknown>[])
    : [];

  return (
    <div className="c360-stat-card c360-p-4 c360-space-y-4">
      <header>
        <h3 className="c360-text-lg c360-font-semibold">
          {String(pi.name ?? "")}
        </h3>
        <p className="c360-text-muted">{String(pi.title ?? "")}</p>
        <p className="c360-text-sm">
          {[pi.email, pi.phone, pi.location].filter(Boolean).join(" · ")}
        </p>
      </header>
      {summary && (
        <section>
          <h4 className="c360-font-semibold c360-mb-2">Summary</h4>
          <p className="c360-text-sm c360-whitespace-pre-wrap">{summary}</p>
        </section>
      )}
      {wx.length > 0 && (
        <section>
          <h4 className="c360-font-semibold c360-mb-2">Experience</h4>
          <ul className="c360-space-y-3">
            {wx.map((exp, i) => (
              <li key={i} className="c360-text-sm">
                <div className="c360-font-medium">
                  {String(exp.title ?? "")} — {String(exp.company ?? "")}
                </div>
                <div className="c360-text-muted">{String(exp.years ?? "")}</div>
                <BulletList value={exp.description} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function BulletList({ value }: { value: unknown }) {
  const lines = Array.isArray(value)
    ? value.map(String)
    : value
      ? [String(value)]
      : [];
  if (!lines.length) return null;
  return (
    <ul style={{ listStyle: "disc", paddingLeft: "1.25rem" }} className="c360-mt-1">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}
