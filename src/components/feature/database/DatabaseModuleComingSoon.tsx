"use client";

import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type DatabaseComingSoonModule = "contacts" | "companies";

/** Decorative labels (waitlist.md pill strip); not linked routes. */
const PILL_LABELS = [
  "Features",
  "Roadmap",
  "Beta",
  "Launch",
  "Updates",
] as const;
const PILL_HIGHLIGHT_INDEX = 2;

const AVATAR_MOD = ["a", "b", "c"] as const;

const COPY: Record<
  DatabaseComingSoonModule,
  {
    title: string;
    blurb: string;
    socialProof: string;
    avatarInitials: [string, string, string];
  }
> = {
  contacts: {
    title: "Contacts",
    blurb:
      "Rich contact search and workflows are on the way. We will notify you when this workspace opens.",
    socialProof: "Teams are already on the waitlist for Contact360 contacts.",
    avatarInitials: ["C", "T", "R"],
  },
  companies: {
    title: "Companies",
    blurb:
      "Company intelligence and lists are launching soon. Check back for updates.",
    socialProof: "Teams are already on the waitlist for Contact360 companies.",
    avatarInitials: ["C", "T", "R"],
  },
};

function TopPillStrip() {
  return (
    <div
      className="c360-database-soon__pills-outer"
      role="presentation"
      aria-hidden="true"
    >
      <div className="c360-database-soon__pills">
        {PILL_LABELS.map((feature, index) => (
          <span
            key={feature}
            className={cn(
              "c360-database-soon__pill",
              index === PILL_HIGHLIGHT_INDEX &&
                "c360-database-soon__pill--active",
            )}
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}

function SocialProofRow({
  initials,
  line,
}: {
  initials: [string, string, string];
  line: string;
}) {
  return (
    <div className="c360-database-soon__social">
      <div className="c360-database-soon__avatars" aria-hidden="true">
        {initials.map((ch, i) => (
          <div
            key={`${ch}-${i}`}
            className={cn(
              "c360-database-soon__avatar",
              `c360-database-soon__avatar--${AVATAR_MOD[i]}`,
            )}
          >
            {ch}
          </div>
        ))}
      </div>
      <p className="c360-database-soon__social-text">{line}</p>
    </div>
  );
}

function CountdownStrip({
  segments,
  srSummaryId,
  liveSummary,
}: {
  segments: readonly { label: string; value: number }[];
  srSummaryId: string;
  liveSummary: string;
}) {
  return (
    <div className="c360-database-soon__count-block">
      {/* Screen reader summary updates when minutes change (not every second). */}
      <div
        id={srSummaryId}
        className="c360-sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveSummary}
      </div>
      <p className="c360-database-soon__count-label">
        Estimated time remaining
      </p>
      <div className="c360-database-soon__count-row" aria-hidden>
        {segments.map(({ label, value }, i) => (
          <Fragment key={label}>
            {i > 0 ? (
              <span className="c360-database-soon__count-sep" aria-hidden>
                |
              </span>
            ) : null}
            <div className="c360-database-soon__count-unit">
              <div className="c360-database-soon__count-value">
                {String(value).padStart(2, "0")}
              </div>
              <div className="c360-database-soon__count-name">{label}</div>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WAITLIST_BTN_CLASS = cn(
  "c360-btn",
  "c360-btn--primary",
  "c360-database-soon__btn-waitlist",
  "c360-database-soon__cta",
  "c360-database-soon__cta-wide",
);

export interface DatabaseModuleComingSoonProps {
  module: DatabaseComingSoonModule;
  /** Defaults to dashboard home. */
  backHref?: string;
  /** Override default headline from module copy. */
  headline?: string;
  /** Override default subhead from module copy. */
  subhead?: string;
  /**
   * Show email field + “Get notified” flow. Backend wiring is optional via
   * `onInterestSubmit`; without it, submit still shows success after validation (client-only).
   */
  showInterestCapture?: boolean;
  /** Persist interest (e.g. GraphQL); on throw, user sees an error toast. */
  onInterestSubmit?: (email: string) => Promise<void>;
  /** Override social proof line next to avatar stack. */
  socialProofText?: string;
}

/**
 * Waitlist-inspired “coming soon” panel for the dashboard main column
 * (see docs/frontend/ideas/mydesigns/waitlist.md). Styles: `28-database-coming-soon.css`
 * (this app uses c360-* CSS, not Tailwind utilities in globals). The page root is
 * transparent so the main column matches the rest of the app shell.
 */
export function DatabaseModuleComingSoon({
  module,
  backHref = ROUTES.DASHBOARD,
  headline,
  subhead,
  showInterestCapture = false,
  onInterestSubmit,
  socialProofText,
}: DatabaseModuleComingSoonProps) {
  const base = COPY[module];
  const title = headline ?? base.title;
  const blurb = subhead ?? base.blurb;
  const proofLine = socialProofText ?? base.socialProof;

  const headingId = useId().replace(/:/g, "");
  const titleId = `c360-soon-title-${headingId}`;
  const sectionId = `c360-soon-section-${headingId}`;
  const srSummaryId = `c360-soon-countdown-sr-${headingId}`;

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [liveSummary, setLiveSummary] = useState("");

  const [email, setEmail] = useState("");
  const [interestSubmitted, setInterestSubmitted] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);

  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 120);
    const tick = () => {
      const diffMs = Math.max(0, target.getTime() - Date.now());
      let diff = Math.floor(diffMs / 1000);
      const days = Math.floor(diff / 86400);
      diff %= 86400;
      const hours = Math.floor(diff / 3600);
      diff %= 3600;
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setTimeLeft({ days, hours, minutes, seconds });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLiveSummary(
      `Time remaining: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes.`,
    );
  }, [timeLeft.days, timeLeft.hours, timeLeft.minutes]);

  const segments = useMemo(
    () =>
      [
        { label: "days", value: timeLeft.days },
        { label: "hours", value: timeLeft.hours },
        { label: "minutes", value: timeLeft.minutes },
        { label: "seconds", value: timeLeft.seconds },
      ] as const,
    [timeLeft],
  );

  const handleInterestSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) {
        toast.error("Enter a valid email address.");
        return;
      }
      setInterestLoading(true);
      try {
        if (onInterestSubmit) {
          await onInterestSubmit(trimmed);
        } else {
          await new Promise((r) => setTimeout(r, 450));
        }
        setInterestSubmitted(true);
      } catch {
        toast.error("Something went wrong. Try again in a moment.");
      } finally {
        setInterestLoading(false);
      }
    },
    [email, onInterestSubmit],
  );

  return (
    <DashboardPageLayout className="c360-database-soon">
      <div className="c360-database-soon__column">
        <TopPillStrip />

        <section
          id={sectionId}
          aria-labelledby={titleId}
          className="c360-database-soon__card-wrap"
        >
          <div className="c360-database-soon__card-halo" aria-hidden />
          <div className="c360-database-soon__card">
            <div className="c360-database-soon__card-shine" aria-hidden />

            <div className="c360-database-soon__body">
              {!showInterestCapture || !interestSubmitted ? (
                <>
                  <p className="c360-database-soon__eyebrow">Coming soon</p>
                  <h1 id={titleId} className="c360-database-soon__title">
                    {title}
                  </h1>
                  <p className="c360-database-soon__blurb">{blurb}</p>

                  {showInterestCapture ? (
                    <form
                      className="c360-database-soon__form"
                      onSubmit={(e) => void handleInterestSubmit(e)}
                    >
                      <label
                        htmlFor={`c360-soon-email-${headingId}`}
                        className="c360-sr-only"
                      >
                        Email for launch notifications
                      </label>
                      <input
                        id={`c360-soon-email-${headingId}`}
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={interestLoading}
                        className="c360-database-soon__input"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        loading={interestLoading}
                        disabled={interestLoading}
                        className={WAITLIST_BTN_CLASS}
                      >
                        Get notified
                      </Button>
                    </form>
                  ) : null}

                  <SocialProofRow
                    initials={base.avatarInitials}
                    line={proofLine}
                  />

                  <CountdownStrip
                    segments={segments}
                    srSummaryId={srSummaryId}
                    liveSummary={liveSummary}
                  />

                  <Button
                    asChild
                    variant="primary"
                    className={WAITLIST_BTN_CLASS}
                  >
                    <Link href={backHref}>Back to dashboard</Link>
                  </Button>
                </>
              ) : (
                <div>
                  <div className="c360-database-soon__success-icon-wrap">
                    <svg
                      className="c360-database-soon__success-svg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="c360-database-soon__success-title">
                    You&apos;re on the list
                  </h2>
                  <p className="c360-database-soon__success-text">
                    We&apos;ll notify you at {email.trim()} when this workspace
                    opens.
                  </p>
                  <Button
                    asChild
                    variant="primary"
                    className={WAITLIST_BTN_CLASS}
                  >
                    <Link href={backHref}>Back to dashboard</Link>
                  </Button>
                </div>
              )}
            </div>

            <div
              className="c360-database-soon__card-footer-shine"
              aria-hidden
            />
          </div>
        </section>
      </div>
    </DashboardPageLayout>
  );
}
