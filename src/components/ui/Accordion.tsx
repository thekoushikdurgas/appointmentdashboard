"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  variant?: "default" | "bordered" | "flush";
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  variant = "default",
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <div
      className={cn(
        "c360-accordion",
        variant === "default" && "c360-accordion--default",
        variant === "bordered" && "c360-accordion--bordered",
        className,
      )}
    >
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);
        return (
          <div key={item.id} className="c360-accordion__item">
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className={cn(
                "c360-accordion__trigger",
                item.disabled
                  ? "c360-accordion__trigger--disabled"
                  : isOpen
                    ? "c360-accordion__trigger--open"
                    : "c360-accordion__trigger--closed",
              )}
            >
              <span className="c360-accordion__title">{item.title}</span>
              <ChevronDown
                size={16}
                className={cn(
                  "c360-accordion__chevron",
                  isOpen && "c360-accordion__chevron--open",
                )}
              />
            </button>
            <div
              className={cn(
                "c360-accordion__panel-outer",
                isOpen
                  ? "c360-accordion__panel-outer--expanded"
                  : "c360-accordion__panel-outer--collapsed",
              )}
            >
              <div className="c360-accordion__panel-inner">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
