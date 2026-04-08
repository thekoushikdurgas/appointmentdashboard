"use client";

import { useEffect, useRef, KeyboardEvent, useState } from "react";
import {
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Building2,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { aiChatService } from "@/services/graphql/aiChatService";
import type { ParseFiltersResponse } from "@/services/graphql/aiChatService";
import type { ModelSelection } from "@/graphql/generated/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODEL_OPTIONS: { value: ModelSelection; label: string }[] = [
  { value: "FLASH", label: "Flash" },
  { value: "PRO", label: "Pro" },
  { value: "FLASH_2_0", label: "Flash 2.0" },
  { value: "PRO_2_5", label: "Pro 2.5" },
];

function TagList({ label, items }: { label: string; items?: string[] | null }) {
  if (!items?.length) return null;
  return (
    <div className="c360-mb-2">
      <span className="c360-text-xs c360-text-muted">{label}: </span>
      <span className="c360-flex c360-gap-1 c360-flex-wrap">
        {items.map((t, i) => (
          <Badge key={`${label}-${i}-${t}`} color="gray">
            {t}
          </Badge>
        ))}
      </span>
    </div>
  );
}

export default function AiChatPage() {
  const {
    sessions,
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
  } = useAIChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sidebarSearch, setSidebarSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [riskEmail, setRiskEmail] = useState("");
  const [riskResult, setRiskResult] = useState<{
    riskScore: number;
    analysis: string;
    isRoleBased: boolean;
    isDisposable: boolean;
  } | null>(null);
  const [analyzingRisk, setAnalyzingRisk] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySummary, setCompanySummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  const [nlQuery, setNlQuery] = useState("");
  const [parseResult, setParseResult] = useState<ParseFiltersResponse | null>(
    null,
  );
  const [parsing, setParsing] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);

  const handleAnalyzeRisk = async () => {
    const email = riskEmail.trim();
    if (!email) return;
    setAnalyzingRisk(true);
    try {
      const res = await aiChatService.analyzeEmailRisk({ email });
      setRiskResult(res);
    } catch {
      setRiskResult(null);
      toast.error("Email risk analysis failed");
    } finally {
      setAnalyzingRisk(false);
    }
  };

  const handleCompanySummary = async () => {
    const name = companyName.trim();
    const ind = industry.trim();
    if (!name || !ind) {
      toast.error("Enter company name and industry.");
      return;
    }
    setSummarizing(true);
    try {
      const res = await aiChatService.generateCompanySummary({
        companyName: name,
        industry: ind,
      });
      setCompanySummary(res.summary);
    } catch {
      setCompanySummary(null);
      toast.error("Company summary failed");
    } finally {
      setSummarizing(false);
    }
  };

  const handleParseFilters = async () => {
    const q = nlQuery.trim();
    if (!q) return;
    setParsing(true);
    try {
      const res = await aiChatService.parseContactFilters({ query: q });
      setParseResult(res);
    } catch {
      setParseResult(null);
      toast.error("Could not parse filters");
    } finally {
      setParsing(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="c360-chat-layout c360-page">
      <div className="c360-chat-body">
        <aside className="c360-chat-sidebar">
          <div className="c360-chat-sidebar__header c360-section-stack c360-section-stack--sm">
            <Button
              variant="primary"
              size="sm"
              onClick={startNewSession}
              className="c360-w-full"
            >
              <Plus size={15} />
              New Chat
            </Button>
            <div className="c360-flex c360-gap-2">
              <Input
                placeholder="Search chats…"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void loadSessions({
                      search: sidebarSearch.trim() || undefined,
                    });
                  }
                }}
                wrapperClassName="c360-flex-1"
              />
              <Button
                variant="secondary"
                size="sm"
                type="button"
                aria-label="Search"
                onClick={() =>
                  void loadSessions({
                    search: sidebarSearch.trim() || undefined,
                  })
                }
              >
                <Search size={14} />
              </Button>
            </div>
          </div>
          <div className="c360-chat-sidebar__list">
            {isLoading && sessions.length === 0 ? (
              <div className="c360-page-subtitle c360-chat-sidebar-empty">
                Loading…
              </div>
            ) : sessions.length === 0 ? (
              <div className="c360-page-subtitle c360-chat-sidebar-empty">
                No conversations yet
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="c360-chat-session-item"
                  onClick={() => void selectSession(s.id)}
                >
                  <MessageSquare
                    size={14}
                    className="c360-flex-shrink-0 c360-text-muted"
                  />
                  <span className="c360-chat-session-item__title">
                    {s.title}
                  </span>
                  <button
                    type="button"
                    className="c360-chat-session-item__del"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(s.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="c360-chat-area">
          <div className="c360-chat-messages-area">
            {messages.length === 0 ? (
              <div className="c360-chat-empty">
                <Bot size={48} className="c360-opacity-30" />
                <div>
                  <div className="c360-chat-empty-title">
                    Contact360 AI Assistant
                  </div>
                  <div className="c360-page-subtitle">
                    Ask me anything about your contacts, campaigns, or
                    analytics.
                  </div>
                </div>
              </div>
            ) : (
              <div className="c360-chat-message-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "c360-chat-msg-row",
                      msg.role === "user" && "c360-chat-msg-row--user",
                    )}
                  >
                    <div
                      className={cn(
                        "c360-chat-avatar",
                        msg.role === "user"
                          ? "c360-chat-avatar--user"
                          : "c360-chat-avatar--bot",
                      )}
                    >
                      {msg.role === "user" ? (
                        <User size={16} color="#fff" />
                      ) : (
                        <Bot size={16} color="#fff" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "c360-chat-msg-bubble",
                        msg.role === "user"
                          ? "c360-chat-msg-bubble--user"
                          : "c360-chat-msg-bubble--bot",
                      )}
                    >
                      <div className="c360-pre-wrap">{msg.content}</div>
                      {msg.role === "assistant" && msg.explanation ? (
                        <p className="c360-text-xs c360-m-0 c360-mt-2 c360-opacity-85">
                          {msg.explanation}
                        </p>
                      ) : null}
                      {msg.role === "assistant" && msg.confidence ? (
                        <Badge color="gray" className="c360-mt-2">
                          {msg.confidence}
                        </Badge>
                      ) : null}
                      {msg.role === "assistant" &&
                        msg.contacts &&
                        msg.contacts.length > 0 && (
                          <div className="c360-mt-2 c360-grid c360-gap-2">
                            {msg.contacts.map((c, i) => (
                              <div
                                key={`${c.uuid ?? i}-${c.email ?? ""}`}
                                className="c360-result-box c360-result-box--neutral c360-text-xs"
                              >
                                <strong>
                                  {[c.firstName, c.lastName]
                                    .filter(Boolean)
                                    .join(" ") || "Contact"}
                                </strong>
                                {c.title ? ` · ${c.title}` : ""}
                                {c.company ? ` @ ${c.company}` : ""}
                                {c.email ? (
                                  <div className="c360-text-muted">
                                    {c.email}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="c360-chat-msg-row">
                    <div className="c360-chat-avatar c360-chat-avatar--bot">
                      <Bot size={16} color="#fff" />
                    </div>
                    <div className="c360-chat-msg-bubble c360-chat-msg-bubble--bot c360-flex c360-items-center c360-gap-2">
                      <Loader2
                        size={16}
                        className="c360-spin c360-text-muted"
                      />
                      <span className="c360-page-subtitle">Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="c360-chat-input-footer">
            <div className="c360-flex c360-items-center c360-gap-2 c360-mb-2 c360-flex-wrap">
              <label
                className="c360-text-xs c360-text-muted"
                htmlFor="ai-model"
              >
                Model
              </label>
              <select
                id="ai-model"
                className="c360-input c360-select c360-max-w-200 c360-text-sm"
                value={model ?? ""}
                onChange={(e) =>
                  setModel((e.target.value || null) as ModelSelection | null)
                }
                title="Model override"
              >
                <option value="">Default</option>
                {MODEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="c360-chat-input-box">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="c360-chat-textarea"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isSending}
                className={cn(
                  "c360-chat-send-btn",
                  input.trim() && !isSending
                    ? "c360-chat-send-btn--ready"
                    : "c360-chat-send-btn--idle",
                )}
              >
                {isSending ? (
                  <Loader2
                    size={18}
                    color="var(--c360-text-muted)"
                    className="c360-spin"
                  />
                ) : (
                  <Send
                    size={18}
                    color={input.trim() ? "#fff" : "var(--c360-text-muted)"}
                  />
                )}
              </button>
            </div>
            {lastFailedMessage && (
              <div className="c360-chat-retry-bar">
                <span className="c360-flex-1">Message failed to send.</span>
                <button
                  type="button"
                  onClick={() => void retryLastMessage()}
                  disabled={isSending}
                  className="c360-chat-retry-action"
                >
                  <RefreshCw
                    size={12}
                    className={cn(isSending && "c360-spin")}
                  />
                  Retry
                </button>
              </div>
            )}
            <div className="c360-chat-disclaimer">
              AI responses may be inaccurate. Always verify important
              information.
            </div>
          </div>
        </div>
      </div>

      <div className="c360-chat-toolbar">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ShieldAlert size={14} />}
          onClick={() => setRiskModalOpen(true)}
        >
          Email risk
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Building2 size={14} />}
          onClick={() => setSummaryModalOpen(true)}
        >
          Company summary
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Filter size={14} />}
          onClick={() => setParseModalOpen(true)}
        >
          Parse filters
        </Button>
      </div>

      <Modal
        isOpen={riskModalOpen}
        onClose={() => setRiskModalOpen(false)}
        title="Email risk analysis"
        size="sm"
      >
        <div className="c360-section-stack">
          <Input
            label="Email to analyze"
            type="email"
            value={riskEmail}
            onChange={(e) => setRiskEmail(e.target.value)}
            placeholder="user@example.com"
          />
          <Button
            loading={analyzingRisk}
            onClick={() => void handleAnalyzeRisk()}
            leftIcon={<ShieldAlert size={14} />}
          >
            Analyze risk
          </Button>
          {riskResult && (
            <div className="c360-result-box c360-result-box--neutral">
              <div className="c360-kv-row c360-mb-2">
                <span className="c360-font-semibold">Risk score</span>
                <Badge
                  color={
                    riskResult.riskScore > 70
                      ? "red"
                      : riskResult.riskScore > 40
                        ? "orange"
                        : "green"
                  }
                >
                  {riskResult.riskScore}/100
                </Badge>
              </div>
              <p className="c360-page-subtitle c360-m-0 c360-mb-2">
                {riskResult.analysis}
              </p>
              <div className="c360-flex c360-gap-2 c360-flex-wrap">
                {riskResult.isRoleBased && (
                  <Badge color="orange">Role-based</Badge>
                )}
                {riskResult.isDisposable && (
                  <Badge color="red">Disposable</Badge>
                )}
                {!riskResult.isRoleBased && !riskResult.isDisposable && (
                  <Badge color="green">Clean</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title="Company AI summary"
        size="sm"
      >
        <div className="c360-section-stack">
          <Input
            label="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corp"
          />
          <Input
            label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. SaaS, Manufacturing"
          />
          <p className="c360-text-xs c360-text-muted c360-m-0">
            Uses gateway <code>GenerateCompanySummaryInput</code> (name +
            industry).
          </p>
          <Button
            loading={summarizing}
            onClick={() => void handleCompanySummary()}
            leftIcon={<Building2 size={14} />}
          >
            Generate summary
          </Button>
          {companySummary && (
            <div className="c360-result-box c360-result-box--neutral c360-text-sm">
              {companySummary}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={parseModalOpen}
        onClose={() => setParseModalOpen(false)}
        title="Natural language → contact filters"
        size="md"
      >
        <div className="c360-section-stack">
          <div className="c360-field">
            <label className="c360-label" htmlFor="nl-filters">
              Describe who you want to find
            </label>
            <textarea
              id="nl-filters"
              className="c360-input"
              rows={4}
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder='e.g. "VP Sales in healthcare companies in Texas"'
            />
          </div>
          <Button
            loading={parsing}
            onClick={() => void handleParseFilters()}
            leftIcon={<Filter size={14} />}
          >
            Parse
          </Button>
          {parseResult && (
            <div className="c360-result-box c360-result-box--neutral">
              <TagList
                label="Job titles"
                items={parseResult.jobTitles ?? null}
              />
              <TagList
                label="Companies"
                items={parseResult.companyNames ?? null}
              />
              <TagList label="Industry" items={parseResult.industry ?? null} />
              <TagList label="Location" items={parseResult.location ?? null} />
              <TagList
                label="Seniority"
                items={parseResult.seniority ?? null}
              />
              {parseResult.employees?.length ? (
                <p className="c360-text-xs c360-m-0">
                  Employees (range): {parseResult.employees.join(" – ")}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete conversation?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                if (deleteId) void deleteSession(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="c360-text-sm c360-m-0">This cannot be undone.</p>
      </Modal>
    </div>
  );
}
