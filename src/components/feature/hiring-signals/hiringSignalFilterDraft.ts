export type HiringSignalFilterDraft = {
  /** Role keywords / full titles — multi-select, OR within this field when applied. */
  titles: string[];
  companies: string[];
  locations: string[];
  employmentType: string;
  seniorityPreset: string;
  seniorityCustom: string;
  functionPreset: string;
  functionCustom: string;
  postedAfter: string;
  postedBefore: string;
};

export const EMPTY_HIRING_SIGNAL_DRAFT: HiringSignalFilterDraft = {
  titles: [],
  companies: [],
  locations: [],
  employmentType: "",
  seniorityPreset: "",
  seniorityCustom: "",
  functionPreset: "",
  functionCustom: "",
  postedAfter: "",
  postedBefore: "",
};

export type HiringSignalDraftField = keyof HiringSignalFilterDraft;

/** Trim, drop empty, dedupe (preserve order). */
export function normalizeHiringSignalTokenList(arr: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of arr) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
