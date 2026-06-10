"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { applyVars } from "@/lib/applyCssVars";
import { computeTourPosition, type TooltipPos } from "@/lib/tourPosition";
import { dispatchTourPrepare, type TourPrepareAction } from "@/lib/tourPrepare";
import {
  routeMatches,
  waitForPath,
  waitForRectStable,
  waitForSelector,
} from "@/lib/tourNavigation";
import {
  TOUR_COMPLETED_KEY,
  clearTourSession,
  isTourSessionActive,
  readTourResumeStep,
  writeTourResumeStep,
} from "@/lib/tourSession";
import { X, ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export { DEFAULT_TOUR_STEPS } from "@/lib/tourSteps";

export interface TourStep {
  id: string;
  /** CSS selector of the element to highlight */
  target?: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  /** Navigate here before highlighting (cross-page tour). */
  route?: string;
  routeMatch?: "exact" | "prefix";
  /** Page-specific setup (e.g. open filter sidebar on hiring signals). */
  prepare?: TourPrepareAction;
}

interface OnboardingTourProps {
  steps: TourStep[];
  /** Force show even if already completed (for re-triggers) */
  forceShow?: boolean;
  onComplete?: () => void;
}

const PREPARE_WAIT_MS = 380;
const DRAWER_PREPARE_WAIT_MS = 520;
const SELECTOR_WAIT_MS = 8000;

const DRAWER_PREPARE_ACTIONS = new Set([
  "hs-open-company-contacts",
  "hs-open-saved-searches",
]);

export function OnboardingTour({
  steps,
  forceShow = false,
  onComplete,
}: OnboardingTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [portalMounted, setPortalMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [stepReady, setStepReady] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({
    top: 0,
    left: 0,
    placement: "bottom",
  });
  const highlightRef = useRef<HTMLDivElement>(null);
  const tourTipRef = useRef<HTMLDivElement>(null);
  const refinedStepRef = useRef(-1);
  const scrolledStepRef = useRef(-1);
  const reflowTimerRef = useRef<number | null>(null);
  const enterTokenRef = useRef(0);
  const stepIdxRef = useRef(stepIdx);
  const pathnameRef = useRef(pathname);

  pathnameRef.current = pathname;
  stepIdxRef.current = stepIdx;

  useEffect(() => setPortalMounted(true), []);

  useEffect(() => {
    if (!portalMounted) return;
    document.body.classList.toggle("c360-tour-active", active);
    return () => document.body.classList.remove("c360-tour-active");
  }, [active, portalMounted]);

  useEffect(() => {
    if (forceShow) {
      setActive(true);
      setStepIdx(0);
      writeTourResumeStep(0);
      return;
    }
    const done = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (done) return;
    if (isTourSessionActive()) {
      setActive(true);
      setStepIdx(readTourResumeStep());
      return;
    }
    setActive(true);
    setStepIdx(0);
    writeTourResumeStep(0);
  }, [forceShow]);

  const updatePosition = useCallback(
    (idx: number, measuredSize?: { width: number; height: number }) => {
      if (idx !== stepIdxRef.current) return;
      const step = steps[idx];
      if (!step) return;
      refinedStepRef.current = measuredSize ? idx : -1;
      const el = step.target ? document.querySelector(step.target) : null;
      if (step.target && !el) return;
      if (el && scrolledStepRef.current !== idx) {
        scrolledStepRef.current = idx;
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      const pos = computeTourPosition(
        el,
        step.position,
        { width: window.innerWidth, height: window.innerHeight },
        measuredSize,
      );
      setTooltipPos(pos);
    },
    [steps],
  );

  useEffect(() => {
    if (!active) return;
    const step = steps[stepIdx];
    if (!step) return;

    const token = ++enterTokenRef.current;
    setStepReady(false);
    refinedStepRef.current = -1;
    scrolledStepRef.current = -1;
    writeTourResumeStep(stepIdx);

    void (async () => {
      const routeMode = step.routeMatch ?? "prefix";
      const currentPath = pathnameRef.current;
      if (step.route && !routeMatches(currentPath, step.route, routeMode)) {
        router.push(step.route);
        await waitForPath(step.route, routeMode);
      }

      if (enterTokenRef.current !== token) return;

      if (step.prepare) {
        dispatchTourPrepare(step.prepare);
        const prepareWait = DRAWER_PREPARE_ACTIONS.has(step.prepare)
          ? DRAWER_PREPARE_WAIT_MS
          : PREPARE_WAIT_MS;
        await new Promise((r) => window.setTimeout(r, prepareWait));
      }

      if (enterTokenRef.current !== token) return;

      if (step.target) {
        const waitMs = step.prepare ? SELECTOR_WAIT_MS : 5000;
        await waitForSelector(step.target, waitMs);
        if (
          step.prepare &&
          DRAWER_PREPARE_ACTIONS.has(step.prepare) &&
          enterTokenRef.current === token
        ) {
          await waitForRectStable(step.target, 1800);
        }
      }

      if (enterTokenRef.current !== token) return;

      setStepReady(true);
      updatePosition(stepIdx);
    })();
  }, [active, stepIdx, steps, router, updatePosition]);

  useEffect(() => {
    if (!active || !stepReady) return;
    const t = window.setTimeout(() => updatePosition(stepIdx), 80);
    return () => window.clearTimeout(t);
  }, [active, stepReady, stepIdx, updatePosition]);

  useEffect(() => {
    if (!active || !stepReady) return;
    const onResize = () => {
      if (reflowTimerRef.current) window.clearTimeout(reflowTimerRef.current);
      reflowTimerRef.current = window.setTimeout(
        () => updatePosition(stepIdx),
        120,
      );
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (reflowTimerRef.current) window.clearTimeout(reflowTimerRef.current);
    };
  }, [active, stepReady, stepIdx, updatePosition]);

  const canShow = active && steps.length > 0 && stepReady;
  const step = canShow ? (steps[stepIdx] ?? null) : null;
  const isLast = canShow && stepIdx === steps.length - 1;
  const anchor = tooltipPos.highlightRect ?? tooltipPos.anchorRect;
  const progressPct = Math.round(((stepIdx + 1) / steps.length) * 100);

  useLayoutEffect(() => {
    if (!canShow || !highlightRef.current || !anchor) return;
    applyVars(highlightRef.current, {
      "--c360-tour-h-top": `${anchor.top - 4}px`,
      "--c360-tour-h-left": `${anchor.left - 4}px`,
      "--c360-tour-h-width": `${anchor.width + 8}px`,
      "--c360-tour-h-height": `${anchor.height + 8}px`,
    });
  }, [canShow, anchor]);

  const isCenteredStep = !step?.target;

  useLayoutEffect(() => {
    if (!canShow || !tourTipRef.current || isCenteredStep) return;
    applyVars(tourTipRef.current, {
      "--c360-tour-tip-top": `${tooltipPos.top}px`,
      "--c360-tour-tip-left": `${tooltipPos.left}px`,
      "--c360-tour-arrow-offset": `${tooltipPos.arrowOffset ?? 160}px`,
    });
  }, [canShow, isCenteredStep, tooltipPos]);

  useLayoutEffect(() => {
    if (!canShow || !tourTipRef.current || isCenteredStep) return;
    if (refinedStepRef.current === stepIdx) return;

    const tipEl = tourTipRef.current;
    const tipRect = tipEl.getBoundingClientRect();
    if (tipRect.height > 0 && tipRect.width > 0) {
      updatePosition(stepIdx, {
        width: tipRect.width,
        height: tipRect.height,
      });
    }
  }, [canShow, stepIdx, isCenteredStep, updatePosition]);

  const complete = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, "1");
    clearTourSession();
    setActive(false);
    onComplete?.();
  };

  const next = () => {
    if (stepIdx < steps.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      complete();
    }
  };

  const prev = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  if (!portalMounted || !active) return null;

  const loadingOverlay =
    active && !stepReady ? (
      <div className="c360-tour-loading" aria-live="polite" aria-busy="true">
        <div className="c360-tour-loading__card">
          <Loader2 className="c360-animate-spin" size={20} aria-hidden />
          <span>Loading tour step…</span>
        </div>
      </div>
    ) : null;

  if (!canShow || !step) {
    return loadingOverlay ? createPortal(loadingOverlay, document.body) : null;
  }

  const tourDialog = (
    <>
      <div className="c360-tour-backdrop" aria-hidden />

      {anchor && <div ref={highlightRef} className="c360-tour-highlight" />}

      <div
        ref={tourTipRef}
        className={cn(
          "c360-tour-tooltip",
          isCenteredStep && "c360-tour-tooltip--centered",
          anchor && `c360-tour-tooltip--placement-${tooltipPos.placement}`,
          anchor &&
            (tooltipPos.placement === "left" ||
              tooltipPos.placement === "right") &&
            "c360-tour-tooltip--side",
        )}
        role="dialog"
        aria-labelledby="c360-tour-title"
        aria-describedby="c360-tour-body"
      >
        <div className="c360-tour-tooltip__header">
          <div>
            <div className="c360-tour-tooltip__eyebrow">
              Step {stepIdx + 1} of {steps.length}
            </div>
            <h4 id="c360-tour-title" className="c360-tour-tooltip__title">
              {step.title}
            </h4>
          </div>
          <button
            type="button"
            onClick={complete}
            className="c360-tour-tooltip__close"
            aria-label="Skip tour"
          >
            <X size={14} />
          </button>
        </div>

        <p id="c360-tour-body" className="c360-tour-tooltip__body">
          {step.content}
        </p>

        <div className="c360-tour-progress" aria-hidden>
          <div className="c360-tour-progress__track">
            <div
              className="c360-tour-progress__fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="c360-tour-actions">
          <button type="button" onClick={complete} className="c360-tour-skip">
            Skip tour
          </button>
          <div className="c360-tour-nav">
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={prev}
                className="c360-tour-btn--back"
              >
                <ChevronLeft size={12} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="c360-tour-btn--next"
            >
              {isLast ? (
                "Finish"
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(tourDialog, document.body);
}
