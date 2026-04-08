"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/services/graphql/aiChatService";

interface AIChatMessageListProps {
  messages: ChatMessage[];
  endRef?: React.RefObject<HTMLDivElement | null>;
}

export function AIChatMessageList({
  messages,
  endRef,
}: AIChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="c360-chat-empty">
        <Bot size={40} className="c360-text-muted" />
        <p className="c360-empty-state__text">
          Start a conversation with the AI assistant
        </p>
      </div>
    );
  }

  return (
    <div className="c360-chat-message-list">
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={msg.id}
            className={cn(
              "c360-chat-msg-row c360-items-start",
              isUser && "c360-chat-msg-row--user",
            )}
          >
            <div
              className={cn(
                "c360-chat-avatar",
                isUser ? "c360-chat-avatar--user" : "c360-chat-avatar--bot",
              )}
            >
              {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={cn(
                "c360-chat-msg-bubble",
                isUser
                  ? "c360-chat-msg-bubble--user"
                  : "c360-chat-msg-bubble--bot",
              )}
            >
              <p className="c360-m-0 c360-pre-wrap">{msg.content}</p>
              {msg.createdAt && (
                <span className="c360-chat-msg-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {endRef ? <div ref={endRef as React.Ref<HTMLDivElement>} /> : null}
    </div>
  );
}
