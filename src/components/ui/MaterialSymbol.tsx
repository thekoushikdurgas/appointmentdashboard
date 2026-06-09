"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface MaterialSymbolProps {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

function countMaterialFontFaceRules(): number {
  let count = 0;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (
          rule instanceof CSSFontFaceRule &&
          rule.style.fontFamily.includes("Material Symbols")
        ) {
          count += 1;
        }
      }
    } catch {
      /* cross-origin stylesheets */
    }
  }
  return count;
}

export function MaterialSymbol({
  name,
  size = 24,
  className,
  style,
  title,
}: MaterialSymbolProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (name !== "download" && name !== "paid") return;
    const el = ref.current;
    if (!el) return;

    const probe = async () => {
      await document.fonts.ready;
      const computed = getComputedStyle(el).fontFamily;
      const fontLoaded = document.fonts.check(
        '400 24px "Material Symbols Outlined"',
      );
      const rect = el.getBoundingClientRect();
      const usesMaterialFont = /Material Symbols Outlined/i.test(computed);
      // #region agent log
      fetch(
        "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "9ea698",
          },
          body: JSON.stringify({
            sessionId: "9ea698",
            location: "MaterialSymbol.tsx:probe",
            message: "MaterialSymbol runtime font probe",
            data: {
              iconName: name,
              computedFontFamily: computed,
              usesMaterialFont,
              fontLoaded,
              textContent: el.textContent,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              materialFontFaceRules: countMaterialFontFaceRules(),
              extraClass: className ?? null,
            },
            timestamp: Date.now(),
            hypothesisId: name === "download" ? "A" : "B",
            runId: "pre-fix",
          }),
        },
      ).catch(() => { });
      // #endregion
    };

    void probe();
  }, [name, className]);

  return (
    <span
      ref={ref}
      className={cn("material-symbols-outlined", className)}
      style={{ fontSize: size, width: size, height: size, ...style }}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      {name}
    </span>
  );
}
