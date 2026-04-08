"use client";

import { Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CampaignWriteActionsProps {
  campaignId: string;
  status: string;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function CampaignWriteActions({
  campaignId,
  status,
  onPause,
  onResume,
  onDelete,
  loading,
}: CampaignWriteActionsProps) {
  const isActive = status === "active" || status === "running";
  const isPaused = status === "paused";

  return (
    <div className="c360-flex c360-gap-2">
      {isActive && onPause && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pause size={14} />}
          loading={loading}
          onClick={() => onPause(campaignId)}
        >
          Pause
        </Button>
      )}
      {isPaused && onResume && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Play size={14} />}
          loading={loading}
          onClick={() => onResume(campaignId)}
        >
          Resume
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} />}
          loading={loading}
          onClick={() => onDelete(campaignId)}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
