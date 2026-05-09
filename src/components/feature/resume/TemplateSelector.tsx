"use client";

const OPTIONS: Array<{ id: string; label: string }> = [
  { id: "swiss-single", label: "Classic single column" },
  { id: "modern", label: "Modern single column" },
  { id: "swiss-two-column", label: "Classic two column" },
  { id: "modern-two-column", label: "Modern two column" },
];

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <fieldset className="c360-space-y-2">
      <legend className="c360-label">PDF template</legend>
      <div className="c360-flex c360-flex-wrap c360-gap-3">
        {OPTIONS.map((o) => (
          <label
            key={o.id}
            className="c360-flex c360-items-center c360-gap-2 c360-text-sm"
          >
            <input
              type="radio"
              name="resume-template"
              checked={value === o.id}
              onChange={() => onChange(o.id)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
