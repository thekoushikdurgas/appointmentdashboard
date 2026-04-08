"use client";

import { Send, Loader2 } from "lucide-react";

interface AIChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function AIChatInput({
  value,
  onChange,
  onSend,
  isSending,
  disabled,
  placeholder = "Type a message…",
}: AIChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = Boolean(value.trim()) && !isSending && !disabled;

  return (
    <div className="c360-ai-chat-composer">
      <textarea
        className="c360-input c360-ai-chat-composer__field"
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
      />
      <button
        type="button"
        className="c360-btn c360-btn--primary c360-ai-chat-composer__send"
        disabled={!canSend}
        onClick={onSend}
        aria-label="Send message"
      >
        {isSending ? (
          <Loader2 size={18} className="c360-spin" />
        ) : (
          <Send size={18} />
        )}
      </button>
    </div>
  );
}
