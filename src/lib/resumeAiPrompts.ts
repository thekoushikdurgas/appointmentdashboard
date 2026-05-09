/** Mirrors backend ``IMPROVE_PROMPT_OPTIONS`` (resume.prompts.templates). */
export const IMPROVE_PROMPT_OPTIONS: Array<{
  id: string;
  label: string;
  description: string;
}> = [
  {
    id: "nudge",
    label: "Light nudge",
    description: "Minimal edits to better align existing experience.",
  },
  {
    id: "keywords",
    label: "Keyword enhance",
    description: "Blend in relevant keywords without changing role or scope.",
  },
  {
    id: "full",
    label: "Full tailor",
    description: "Comprehensive tailoring using the job description.",
  },
];

export const DEFAULT_IMPROVE_PROMPT_ID = "keywords";
