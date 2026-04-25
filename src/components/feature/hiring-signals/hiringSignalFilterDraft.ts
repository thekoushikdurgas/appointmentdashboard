export type HiringSignalFilterDraft = {
  title: string;
  company: string;
  location: string;
  employmentType: string;
  seniorityPreset: string;
  seniorityCustom: string;
  functionPreset: string;
  functionCustom: string;
  postedAfter: string;
  postedBefore: string;
};

export const EMPTY_HIRING_SIGNAL_DRAFT: HiringSignalFilterDraft = {
  title: "",
  company: "",
  location: "",
  employmentType: "",
  seniorityPreset: "",
  seniorityCustom: "",
  functionPreset: "",
  functionCustom: "",
  postedAfter: "",
  postedBefore: "",
};

export type HiringSignalDraftField = keyof HiringSignalFilterDraft;
