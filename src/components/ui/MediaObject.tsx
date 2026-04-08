"use client";

import { cn } from "@/lib/utils";
import { applyVars } from "@/lib/applyCssVars";

interface MediaObjectProps {
  media: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  actions?: React.ReactNode;
  align?: "top" | "center" | "bottom";
  gap?: number | string;
  className?: string;
}

/**
 * Bootstrap-style media object: horizontal layout with a fixed-width
 * media element (avatar, icon, image) and flexible text content.
 */
export function MediaObject({
  media,
  title,
  body,
  actions,
  align = "top",
  gap = "var(--c360-spacing-3)",
  className,
}: MediaObjectProps) {
  return (
    <div
      className={cn(
        "c360-media",
        align === "center" && "c360-media--center",
        align === "bottom" && "c360-media--bottom",
        className,
      )}
      ref={(el) =>
        applyVars(el, {
          "--c360-media-gap":
            typeof gap === "number" ? `${gap}px` : String(gap),
        })
      }
    >
      <div className="c360-media__figure">{media}</div>
      <div className="c360-media__body">
        <div
          className={cn(
            "c360-media__title",
            !body && "c360-media__title--solo",
          )}
        >
          {title}
        </div>
        {body && <div className="c360-media__text">{body}</div>}
        {actions && <div className="c360-media__actions">{actions}</div>}
      </div>
    </div>
  );
}
