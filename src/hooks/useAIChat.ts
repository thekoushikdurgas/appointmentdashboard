"use client";

import { useState, useCallback, useRef } from "react";
import { aiChatService, ChatSession } from "@/services/graphql/aiChatService";
import type { ChatMessage } from "@/services/graphql/aiChatService";
import type {
  AiChatFilterInput,
  ModelSelection,
} from "@/graphql/generated/types";
import { toast } from "sonner";

interface UseAIChatReturn {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  isSending: boolean;
  lastFailedMessage: string | null;
  /** Optional model for `sendMessage` (gateway `ModelSelection`). */
  model: ModelSelection | null;
  setInput: (v: string) => void;
  setModel: (m: ModelSelection | null) => void;
  loadSessions: (filters?: AiChatFilterInput) => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  /** Send the composer text, or pass `textOverride` to send without reading `input` (e.g. retry). */
  sendMessage: (textOverride?: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  startNewSession: () => void;
  deleteSession: (id: string) => Promise<void>;
}

export function useAIChat(): UseAIChatReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<ModelSelection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null,
  );
  const sessionIdRef = useRef<string | undefined>(undefined);

  const loadSessions = useCallback(async (filters?: AiChatFilterInput) => {
    try {
      setIsLoading(true);
      const data = await aiChatService.listSessions({
        limit: 50,
        offset: 0,
        ordering: "-created_at",
        ...filters,
      });
      setSessions(data);
    } catch {
      // non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectSession = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const session = await aiChatService.getSession(id);
      setCurrentSession(session);
      setMessages(session.messages);
      sessionIdRef.current = session.id;
    } catch {
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride !== undefined ? textOverride : input).trim();
      if (!text || isSending) return;

      setInput("");
      setLastFailedMessage(null);
      setIsSending(true);

      try {
        let chatId = sessionIdRef.current;
        if (!chatId) {
          const created = await aiChatService.createSession();
          chatId = created.id;
          sessionIdRef.current = chatId;
          setCurrentSession(created);
        }

        const optimistic: ChatMessage = {
          id: `temp-${Date.now()}`,
          role: "user",
          content: text,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);

        const updated = await aiChatService.sendMessage(
          chatId,
          text,
          model ?? undefined,
        );
        setMessages(updated.messages);
        setCurrentSession(updated);
        await loadSessions();
      } catch {
        toast.error("Failed to send message");
        setInput(text);
        setLastFailedMessage(text);
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, loadSessions, model],
  );

  const retryLastMessage = useCallback(async () => {
    if (!lastFailedMessage) return;
    await sendMessage(lastFailedMessage);
  }, [lastFailedMessage, sendMessage]);

  const startNewSession = useCallback(() => {
    setCurrentSession(null);
    setMessages([]);
    sessionIdRef.current = undefined;
  }, []);

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        await aiChatService.deleteSession(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (currentSession?.id === id) {
          startNewSession();
        }
        toast.success("Conversation deleted");
      } catch {
        toast.error("Failed to delete conversation");
      }
    },
    [currentSession, startNewSession],
  );

  return {
    sessions,
    currentSession,
    messages,
    input,
    isLoading,
    isSending,
    lastFailedMessage,
    model,
    setInput,
    setModel,
    loadSessions,
    selectSession,
    sendMessage,
    retryLastMessage,
    startNewSession,
    deleteSession,
  };
}
