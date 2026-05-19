"use client";

import { Linkedin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface HiringSignalCompanyLinkedInButtonProps {
  linkedinUrl: string;
}

/** Opens the company LinkedIn page in a new tab (drawer header meta). */
export function HiringSignalCompanyLinkedInButton({
  linkedinUrl,
}: HiringSignalCompanyLinkedInButtonProps) {
  const href = linkedinUrl.trim();
  if (!href) return null;

  return (
    <Button asChild variant="secondary" size="sm" className="c360-gap-1">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Linkedin size={14} aria-hidden />
        LinkedIn
      </a>
    </Button>
  );
}
