"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { applyVars } from "@/lib/applyCssVars";
import { X, ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_KEY = "c360_onboarding_completed";

export interface TourStep {
  id: string;
  /** CSS selector of the element to highlight */
  target?: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  /** Force show even if already completed (for re-triggers) */
  forceShow?: boolean;
  onComplete?: () => void;
}

interface TooltipPos {
  top: number;
  left: number;
  placement: "top" | "bottom" | "left" | "right";
  anchorRect?: DOMRect;
}

function computePosition(
  el: Element | null,
  preferred: TourStep["position"] = "bottom",
): TooltipPos {
  if (!el) {
    return {
      top: window.innerHeight / 2 - 80,
      left: window.innerWidth / 2 - 160,
      placement: "bottom",
    };
  }
  const rect = el.getBoundingClientRect();
  const gap = 12;
  const TW = 320;
  const TH = 140;

  const placements: Record<NonNullable<TourStep["position"]>, TooltipPos> = {
    bottom: {
      top: rect.bottom + gap,
      left: Math.min(rect.left, window.innerWidth - TW - 16),
      placement: "bottom",
      anchorRect: rect,
    },
    top: {
      top: rect.top - TH - gap,
      left: Math.min(rect.left, window.innerWidth - TW - 16),
      placement: "top",
      anchorRect: rect,
    },
    left: {
      top: rect.top,
      left: rect.left - TW - gap,
      placement: "left",
      anchorRect: rect,
    },
    right: {
      top: rect.top,
      left: rect.right + gap,
      placement: "right",
      anchorRect: rect,
    },
  };

  const chosen = placements[preferred];
  if (chosen.top >= 0 && chosen.left >= 0) return chosen;
  for (const p of Object.values(placements)) {
    if (p.top >= 0 && p.left >= 0) return p;
  }
  return placements.bottom;
}

export function OnboardingTour({
  steps,
  forceShow = false,
  onComplete,
}: OnboardingTourProps) {
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({
    top: 0,
    left: 0,
    placement: "bottom",
  });
  const highlightRef = useRef<HTMLDivElement>(null);
  const tourTipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceShow) {
      setActive(true);
      setStepIdx(0);
      return;
    }
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      setActive(true);
      setStepIdx(0);
    }
  }, [forceShow]);

  const updatePosition = useCallback(
    (idx: number) => {
      const step = steps[idx];
      if (!step) return;
      const el = step.target ? document.querySelector(step.target) : null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTooltipPos(computePosition(el, step.position));
    },
    [steps],
  );

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => updatePosition(stepIdx), 100);
    return () => clearTimeout(t);
  }, [active, stepIdx, updatePosition]);

  const canShow = active && steps.length > 0;
  const step = canShow ? (steps[stepIdx] ?? null) : null;
  const isLast = canShow && stepIdx === steps.length - 1;
  const anchor = tooltipPos.anchorRect;

  useLayoutEffect(() => {
    if (!canShow || !highlightRef.current || !anchor) return;
    applyVars(highlightRef.current, {
      "--c360-tour-h-top": `${anchor.top - 4}px`,
      "--c360-tour-h-left": `${anchor.left - 4}px`,
      "--c360-tour-h-width": `${anchor.width + 8}px`,
      "--c360-tour-h-height": `${anchor.height + 8}px`,
    });
  }, [canShow, anchor]);

  useLayoutEffect(() => {
    if (!canShow || !tourTipRef.current) return;
    applyVars(tourTipRef.current, {
      "--c360-tour-tip-top": `${tooltipPos.top}px`,
      "--c360-tour-tip-left": `${tooltipPos.left}px`,
    });
  }, [canShow, tooltipPos]);

  const complete = () => {
    localStorage.setItem(TOUR_KEY, "1");
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

  if (!canShow || !step) return null;

  return (
    <>
      <div className="c360-tour-backdrop" aria-hidden />

      {anchor && <div ref={highlightRef} className="c360-tour-highlight" />}

      <div
        ref={tourTipRef}
        className="c360-tour-tooltip"
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

        <div className="c360-tour-dots" aria-hidden>
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "c360-tour-dot",
                i === stepIdx && "c360-tour-dot--active",
              )}
            />
          ))}
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
}

/**
 * Default tour steps for Contact360 app.
 */
export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Contact360!",
    content:
      "Let's take a quick tour of the key features. You can skip at any time and restart later from your profile settings.",
    position: "bottom",
  },
  {
    id: "dashboard",
    target: ".c360-nav__item[href='/dashboard'], a[href='/dashboard']",
    title: "Dashboard",
    content:
      "Your command center. See live stats, activity streams, and product highlights at a glance.",
    position: "right",
  },
  {
    id: "contacts",
    target: "a[href='/contacts']",
    title: "Contacts",
    content:
      "Manage your contact database. Use the world map to see geographic distribution, and accordion rows to expand full contact details.",
    position: "right",
  },
  {
    id: "email",
    target: "a[href='/email']",
    title: "Email Finder & Verifier",
    content:
      "Find and verify professional email addresses — one at a time or in bulk with CSV upload using the step-by-step wizard.",
    position: "right",
  },
  {
    id: "campaigns",
    target: "a[href='/campaigns']",
    title: "Campaigns",
    content:
      "Create and manage outreach campaigns with rich email templates powered by the full text editor.",
    position: "right",
  },
  {
    id: "billing",
    target: "a[href='/billing']",
    title: "Billing",
    content:
      "Upgrade your plan, view invoices, and track your credit history — all in one place.",
    position: "right",
  },
];
