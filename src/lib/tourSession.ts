export const TOUR_COMPLETED_KEY = "c360_onboarding_completed";
export const TOUR_ACTIVE_KEY = "c360_onboarding_active";
export const TOUR_STEP_KEY = "c360_onboarding_step";

export function readTourResumeStep(): number {
  if (typeof window === "undefined") return 0;
  const raw = sessionStorage.getItem(TOUR_STEP_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function writeTourResumeStep(stepIdx: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOUR_ACTIVE_KEY, "1");
  sessionStorage.setItem(TOUR_STEP_KEY, String(stepIdx));
}

export function clearTourSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOUR_ACTIVE_KEY);
  sessionStorage.removeItem(TOUR_STEP_KEY);
}

export function isTourSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(TOUR_ACTIVE_KEY) === "1";
}
