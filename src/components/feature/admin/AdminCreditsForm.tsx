"use client";

import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AdminCreditsFormProps {
  userId: string;
  amount: number;
  reason: string;
  loading: boolean;
  onUserIdChange: (v: string) => void;
  onAmountChange: (v: number) => void;
  onReasonChange: (v: string) => void;
  onSubmit: () => void;
}

export function AdminCreditsForm({
  userId,
  amount,
  reason,
  loading,
  onUserIdChange,
  onAmountChange,
  onReasonChange,
  onSubmit,
}: AdminCreditsFormProps) {
  return (
    <Card
      title="Update User Credits"
      subtitle="Manually add or remove credits from a user account"
    >
      <div className="c360-section-stack c360-max-w-480">
        <Input
          label="User UUID"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Input
          label="Credits to set"
          type="number"
          value={String(amount)}
          onChange={(e) => onAmountChange(Number(e.target.value))}
        />
        <Input
          label="Reason (optional, local note)"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Not sent to API — gateway only accepts userId + credits"
          helperText="UpdateUserCreditsInput has no reason field on the gateway."
        />
        <Button
          loading={loading}
          onClick={onSubmit}
          leftIcon={<CreditCard size={14} />}
        >
          Update Credits
        </Button>
      </div>
    </Card>
  );
}
