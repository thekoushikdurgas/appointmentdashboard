"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FILES_DRAWER_NAV_HREF,
  useFilesDrawer,
} from "@/context/FilesDrawerContext";
import type { CircularTestimonial } from "./dashboardDemoTestimonials";

/** Full-color CTAs on gradient ad slides (non-dashboard). */
const CTA_VARIANT_CLASSES = [
  "c360-ad-slide__cta--on-brand",
  "c360-ad-slide__cta--linkedin",
  "c360-ad-slide__cta--on-success",
  "c360-ad-slide__cta--on-purple",
] as const;

function ctaClassNames(
  variant: "default" | "dashboard",
  slideIndex: number,
): string {
  if (variant === "dashboard") {
    return "c360-circular-testimonials__cta c360-circular-testimonials__cta--dashboard";
  }
  return cn("c360-ad-slide__cta", CTA_VARIANT_CLASSES[slideIndex % 4]);
}

export interface CircularTestimonialsProps {
  testimonials: CircularTestimonial[];
  autoplay?: boolean;
  /** Advance interval when `autoplay` is true (default 5000). */
  autoplayMs?: number;
  /** `dashboard`: shorter stage + tighter spacing for the home carousel strip. */
  variant?: "default" | "dashboard";
  className?: string;
}

function calculateGap(width: number) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth)
    return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return (
    minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth))
  );
}

export function CircularTestimonials({
  testimonials,
  autoplay = true,
  autoplayMs = 5000,
  variant = "default",
  className,
}: CircularTestimonialsProps) {
  const n = testimonials.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1200);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { openFilesDrawer } = useFilesDrawer();

  const activeTestimonial = useMemo(
    () => testimonials[activeIndex],
    [activeIndex, testimonials],
  );

  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!autoplay || n <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % n);
    }, autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplay, autoplayMs, n]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % n);
  }, [n]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + n) % n);
  }, [n]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    },
    [handleNext, handlePrev],
  );

  function getImageStyle(index: number): CSSProperties {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.8;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + n) % n === index;
    const isRight = (activeIndex + 1) % n === index;
    if (isActive) {
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: "auto",
        transform: "translateX(0px) translateY(0px) scale(1) rotateY(0deg)",
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }
    if (isLeft) {
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }
    if (isRight) {
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }
    return {
      zIndex: 1,
      opacity: 0,
      pointerEvents: "none",
      transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
    };
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  if (!n || !activeTestimonial) return null;

  return (
    <section
      className={cn(
        "c360-circular-testimonials",
        variant === "dashboard" && "c360-circular-testimonials--dashboard",
        className,
      )}
      data-tour={variant === "dashboard" ? "dashboard-hero" : undefined}
      aria-roledescription="carousel"
      aria-label="Product highlights"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="c360-circular-testimonials__grid">
        <div className="c360-circular-testimonials__stage-wrap">
          <div
            ref={imageContainerRef}
            className="c360-circular-testimonials__stage"
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="c360-circular-testimonials__img-slot"
                style={getImageStyle(index)}
              >
                <Image
                  src={testimonial.src}
                  alt={testimonial.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="c360-circular-testimonials__img"
                  priority={index === activeIndex}
                  loading={index === activeIndex ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="c360-circular-testimonials__content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={quoteVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h3
                className={cn(
                  "c360-circular-testimonials__name",
                  variant === "dashboard" &&
                  "c360-circular-testimonials__name--dashboard",
                )}
              >
                {activeTestimonial.name}
              </h3>
              <p
                className={cn(
                  "c360-circular-testimonials__designation",
                  variant === "dashboard" &&
                  "c360-circular-testimonials__designation--dashboard",
                )}
              >
                {activeTestimonial.designation}
              </p>
              <motion.p
                className={cn(
                  "c360-circular-testimonials__quote",
                  variant === "dashboard" &&
                  "c360-circular-testimonials__quote--dashboard",
                )}
              >
                {activeTestimonial.quote.split(" ").map((word, i) => (
                  <motion.span
                    key={`${activeIndex}-${i}-${word.slice(0, 12)}`}
                    initial={{
                      filter: "blur(10px)",
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      filter: "blur(0px)",
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.22,
                      ease: "easeInOut",
                      delay: 0.025 * i,
                    }}
                    className="c360-circular-testimonials__quote-word"
                  >
                    {word}
                    {"\u00A0"}
                  </motion.span>
                ))}
              </motion.p>
              <div
                className={cn(
                  "c360-circular-testimonials__footer",
                  variant === "dashboard" &&
                  "c360-circular-testimonials__footer--dashboard",
                )}
              >
                {activeTestimonial.cta && activeTestimonial.href ? (
                  <div className="c360-circular-testimonials__cta-wrap">
                    {activeTestimonial.href === FILES_DRAWER_NAV_HREF ? (
                      <button
                        type="button"
                        className={ctaClassNames(variant, activeIndex)}
                        onClick={() => openFilesDrawer()}
                      >
                        {activeTestimonial.cta}
                      </button>
                    ) : (
                      <Link
                        href={activeTestimonial.href}
                        className={ctaClassNames(variant, activeIndex)}
                      >
                        {activeTestimonial.cta}
                      </Link>
                    )}
                  </div>
                ) : (
                  <span className="c360-circular-testimonials__cta-spacer" />
                )}
                <div
                  className={cn(
                    "c360-circular-testimonials__arrows",
                    variant === "dashboard" &&
                    "c360-circular-testimonials__arrows--dashboard",
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      "c360-circular-testimonials__arrow-btn",
                      variant === "dashboard" &&
                      "c360-circular-testimonials__arrow-btn--dashboard",
                    )}
                    onClick={handlePrev}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={20} aria-hidden strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "c360-circular-testimonials__arrow-btn",
                      variant === "dashboard" &&
                      "c360-circular-testimonials__arrow-btn--dashboard",
                    )}
                    onClick={handleNext}
                    aria-label="Next slide"
                  >
                    <ChevronRight size={20} aria-hidden strokeWidth={2} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
