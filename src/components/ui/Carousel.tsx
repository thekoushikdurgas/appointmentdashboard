"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCSSVars } from "@/hooks/useCSSVars";

export interface CarouselSlide {
  id: string | number;
  content: React.ReactNode;
}

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export function Carousel({
  slides,
  autoPlay = true,
  interval = 4000,
  showDots = true,
  showArrows = true,
  className,
}: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useCSSVars<HTMLDivElement>({
    "--c360-carousel-slide-offset": `-${current * 100}%`,
  });

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1));
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1));
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, next, slides.length]);

  if (!slides.length) return null;

  return (
    <div
      className={cn("c360-carousel", className)}
      aria-roledescription="carousel"
    >
      {/* Track */}
      <div ref={trackRef} className="c360-carousel__track">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="c360-carousel__slide"
            aria-roledescription="slide"
          >
            {slide.content}
          </div>
        ))}
      </div>

      {/* Arrow controls */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            type="button"
            className="c360-carousel__arrow c360-carousel__arrow--prev"
            onClick={prev}
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="c360-carousel__arrow c360-carousel__arrow--next"
            onClick={next}
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && slides.length > 1 && (
        <div className="c360-carousel__dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                "c360-carousel__dot",
                i === current && "c360-carousel__dot--active",
              )}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
