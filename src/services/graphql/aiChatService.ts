import { graphqlMutation, graphqlQuery, gql } from "@/lib/graphqlClient";
import type {
  AiChatFilterInput,
  AnalyzeEmailRiskInput,
  ContactInMessage,
  GenerateCompanySummaryInput,
  ModelSelection,
  ParseFiltersInput,
  ParseFiltersResponse,
  SendMessageInput,
  UpdateAiChatInput,
} from "@/graphql/generated/types";

export type { ParseFiltersResponse };

const MESSAGE_FIELDS = `
  sender
  text
  confidence
  explanation
  contacts {
    uuid
    firstName
    lastName
    title
    company
    email
    city
    state
    country
  }
`;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  contacts?: ContactInMessage[] | null;
  confidence?: string | null;
  explanation?: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string | null;
  messages: ChatMessage[];
  userId?: string;
}

function mapSenderToRole(sender: string): ChatMessage["role"] {
  if (sender === "user") return "user";
  if (sender === "ai") return "assistant";
  return "system";
}

function mapMessage(
  idx: number,
  m: {
    sender: string;
    text: string;
    contacts?: ContactInMessage[] | null;
    confidence?: string | null;
    explanation?: string | null;
  },
): ChatMessage {
  return {
    id: `msg-${idx}-${m.sender}-${m.text.length}`,
    role: mapSenderToRole(m.sender),
    content: m.text,
    createdAt: new Date().toISOString(),
    contacts: m.contacts,
    confidence: m.confidence ?? undefined,
    explanation: m.explanation ?? undefined,
  };
}

export const aiChatService = {
  async listSessions(params?: AiChatFilterInput): Promise<ChatSession[]> {
    const query = gql`
      query AIChatsList($filters: AIChatFilterInput) {
        aiChats {
          aiChats(filters: $filters) {
            items {
              uuid
              title
              createdAt
              updatedAt
            }
            pageInfo {
              total
              limit
              offset
              hasNext
              hasPrevious
            }
          }
        }
      }
    `;
    const data = await graphqlQuery<{
      aiChats: {
        aiChats: {
          items: Array<{
            uuid: string;
            title: string;
            createdAt: string;
            updatedAt: string | null;
          }>;
        };
      };
    }>(query, {
      filters: {
        limit: 50,
        offset: 0,
        ordering: "-created_at",
        ...params,
      },
    });
    return data.aiChats.aiChats.items.map((it) => ({
      id: it.uuid,
      title: it.title,
      createdAt: it.createdAt,
      updatedAt: it.updatedAt,
      messages: [],
    }));
  },

  async getSession(id: string): Promise<ChatSession> {
    const query = gql`
      query AIChatOne($chatId: String!) {
        aiChats {
          aiChat(chatId: $chatId) {
            uuid
            userId
            title
            createdAt
            updatedAt
            messages {
              ${MESSAGE_FIELDS}
            }
          }
        }
      }
    `;
    const data = await graphqlQuery<{
      aiChats: {
        aiChat: {
          uuid: string;
          userId: string;
          title: string;
          createdAt: string;
          updatedAt: string | null;
          messages: Array<{
            sender: string;
            text: string;
            contacts?: ContactInMessage[] | null;
            confidence?: string | null;
            explanation?: string | null;
          }>;
        };
      };
    }>(query, { chatId: id });
    const c = data.aiChats.aiChat;
    return {
      id: c.uuid,
      userId: c.userId,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m, i) => mapMessage(i, m)),
    };
  },

  async createSession(title?: string): Promise<ChatSession> {
    const mutation = gql`
      mutation CreateAIChat($input: CreateAIChatInput!) {
        aiChats {
          createAIChat(input: $input) {
            uuid
            userId
            title
            createdAt
            updatedAt
            messages {
              ${MESSAGE_FIELDS}
            }
          }
        }
      }
    `;
    const data = await graphqlMutation<{
      aiChats: {
        createAIChat: {
          uuid: string;
          userId: string;
          title: string;
          createdAt: string;
          updatedAt: string | null;
          messages: Array<{
            sender: string;
            text: string;
            contacts?: ContactInMessage[] | null;
            confidence?: string | null;
            explanation?: string | null;
          }>;
        };
      };
    }>(mutation, { input: { title: title ?? "" } });
    const c = data.aiChats.createAIChat;
    return {
      id: c.uuid,
      userId: c.userId,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m, i) => mapMessage(i, m)),
    };
  },

  async sendMessage(
    chatId: string,
    message: string,
    model?: ModelSelection | null,
  ): Promise<ChatSession> {
    const input: SendMessageInput = { message };
    if (model != null) input.model = model;

    const mutation = gql`
      mutation AIChatSend($chatId: String!, $input: SendMessageInput!) {
        aiChats {
          sendMessage(chatId: $chatId, input: $input) {
            uuid
            userId
            title
            createdAt
            updatedAt
            messages {
              ${MESSAGE_FIELDS}
            }
          }
        }
      }
    `;
    const data = await graphqlMutation<{
      aiChats: {
        sendMessage: {
          uuid: string;
          userId: string;
          title: string;
          createdAt: string;
          updatedAt: string | null;
          messages: Array<{
            sender: string;
            text: string;
            contacts?: ContactInMessage[] | null;
            confidence?: string | null;
            explanation?: string | null;
          }>;
        };
      };
    }>(mutation, { chatId, input });
    const c = data.aiChats.sendMessage;
    return {
      id: c.uuid,
      userId: c.userId,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m, i) => mapMessage(i, m)),
    };
  },

  async updateSession(
    chatId: string,
    input: UpdateAiChatInput,
  ): Promise<ChatSession> {
    const mutation = gql`
      mutation AIChatUpdate($chatId: String!, $input: UpdateAiChatInput!) {
        aiChats {
          updateAIChat(chatId: $chatId, input: $input) {
            uuid
            userId
            title
            createdAt
            updatedAt
            messages {
              ${MESSAGE_FIELDS}
            }
          }
        }
      }
    `;
    const data = await graphqlMutation<{
      aiChats: {
        updateAIChat: {
          uuid: string;
          userId: string;
          title: string;
          createdAt: string;
          updatedAt: string | null;
          messages: Array<{
            sender: string;
            text: string;
            contacts?: ContactInMessage[] | null;
            confidence?: string | null;
            explanation?: string | null;
          }>;
        };
      };
    }>(mutation, { chatId, input });
    const c = data.aiChats.updateAIChat;
    return {
      id: c.uuid,
      userId: c.userId,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m, i) => mapMessage(i, m)),
    };
  },

  async deleteSession(id: string): Promise<boolean> {
    const mutation = gql`
      mutation AIChatDelete($chatId: String!) {
        aiChats {
          deleteAIChat(chatId: $chatId)
        }
      }
    `;
    const data = await graphqlMutation<{ aiChats: { deleteAIChat: boolean } }>(
      mutation,
      { chatId: id },
    );
    return data.aiChats.deleteAIChat;
  },

  async analyzeEmailRisk(input: AnalyzeEmailRiskInput): Promise<{
    riskScore: number;
    analysis: string;
    isRoleBased: boolean;
    isDisposable: boolean;
  }> {
    const mutation = gql`
      mutation AnalyzeEmailRisk($input: AnalyzeEmailRiskInput!) {
        aiChats {
          analyzeEmailRisk(input: $input) {
            riskScore
            analysis
            isRoleBased
            isDisposable
          }
        }
      }
    `;
    const data = await graphqlMutation<{
      aiChats: {
        analyzeEmailRisk: {
          riskScore: number;
          analysis: string;
          isRoleBased: boolean;
          isDisposable: boolean;
        };
      };
    }>(mutation, { input });
    return data.aiChats.analyzeEmailRisk;
  },

  async generateCompanySummary(
    input: GenerateCompanySummaryInput,
  ): Promise<{ summary: string }> {
    const mutation = gql`
      mutation GenerateCompanySummary($input: GenerateCompanySummaryInput!) {
        aiChats {
          generateCompanySummary(input: $input) {
            summary
          }
        }
      }
    `;
    const data = await graphqlMutation<{
      aiChats: { generateCompanySummary: { summary: string } };
    }>(mutation, { input });
    return data.aiChats.generateCompanySummary;
  },

  async parseContactFilters(
    input: ParseFiltersInput,
  ): Promise<ParseFiltersResponse> {
    const mutation = gql`
      mutation ParseContactFilters($input: ParseFiltersInput!) {
        aiChats {
          parseContactFilters(input: $input) {
            jobTitles
            companyNames
            industry
            location
            employees
            seniority
          }
        }
      }
    `;
    const data = await graphqlMutation<{
      aiChats: { parseContactFilters: ParseFiltersResponse };
    }>(mutation, { input });
    return data.aiChats.parseContactFilters;
  },
};
