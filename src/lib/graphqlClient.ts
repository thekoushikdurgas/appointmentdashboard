/**
 * GraphQL Client
 * All GraphQL requests with authentication, error handling, and token refresh.
 * Backend: contact360.io/api — FastAPI + Strawberry, POST /graphql, Bearer JWT.
 */

import { GraphQLClient, gql } from "graphql-request";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpired,
} from "./tokenManager";
import { GRAPHQL_URL } from "./config";
import { toast } from "sonner";
import { AUTH_REFRESH_MUTATION } from "@/graphql/authOperations";
import { DEFAULT_AUTH_PAGE_TYPE } from "@/lib/authDefaults";
import { notifyAuthPagesRefreshed } from "@/lib/authRefreshBridge";
import type { GatewayAuthPayload } from "@/types/graphql-gateway";

export interface GraphQLRequestOptions {
  skipAuth?: boolean;
  skipRefresh?: boolean;
  showToastOnError?: boolean;
}

export interface GraphQLErrorResponse {
  message: string;
  extensions?: {
    code?: string;
    statusCode?: number;
    fieldErrors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
}

export interface ParsedGraphQLError {
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
  code?: string;
  detail?: string;
  isNotFoundError: boolean;
  isValidationError: boolean;
  isPermissionError: boolean;
}

export function parseGraphQLError(
  errors: GraphQLErrorResponse[],
): ParsedGraphQLError {
  const firstError = errors[0];
  const extensions = firstError?.extensions ?? {};
  const status = (extensions.statusCode as number | undefined) ?? 500;
  const code = (extensions.code as string | undefined) ?? "GRAPHQL_ERROR";
  const fieldErrors = extensions.fieldErrors as
    | Record<string, string[]>
    | undefined;
  let message = firstError?.message ?? "GraphQL request failed";
  const detail =
    typeof extensions.detail === "string"
      ? (extensions.detail as string)
      : message;

  const isNotFoundError =
    status === 404 ||
    code === "NOT_FOUND" ||
    message.toLowerCase().includes("not found");
  const isValidationError =
    status === 400 ||
    status === 422 ||
    !!(fieldErrors && Object.keys(fieldErrors).length > 0) ||
    code === "VALIDATION_ERROR" ||
    code === "BAD_USER_INPUT";
  const isPermissionError =
    status === 403 || code === "FORBIDDEN" || code === "UNAUTHORIZED";

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    const fieldMessages = Object.entries(fieldErrors)
      .map(([field, errs]) => `${field}: ${errs.join(", ")}`)
      .join("; ");
    message = `${message} (${fieldMessages})`;
  }

  return {
    message,
    status,
    fieldErrors,
    code,
    detail,
    isNotFoundError,
    isValidationError,
    isPermissionError,
  };
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
const GRAPHQL_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000;

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

function graphqlFetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const outer = init?.signal;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), GRAPHQL_REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => {
    clearTimeout(tid);
    ctrl.abort();
  };
  if (outer) {
    if (outer.aborted) {
      clearTimeout(tid);
      ctrl.abort();
    } else outer.addEventListener("abort", onOuterAbort, { once: true });
  }
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => {
    clearTimeout(tid);
    if (outer) outer.removeEventListener("abort", onOuterAbort);
  });
}

function createGraphQLClient(token?: string | null): GraphQLClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return new GraphQLClient(GRAPHQL_URL, {
    headers,
    fetch: graphqlFetchWithTimeout,
  });
}

async function handleTokenRefresh(retryCount = 0): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue || isTokenExpired(refreshTokenValue)) {
        clearTokens();
        return null;
      }
      const refreshClient = createGraphQLClient(null);
      const response = await refreshClient.request<{
        auth: { refreshToken: GatewayAuthPayload };
      }>(AUTH_REFRESH_MUTATION, {
        input: { refreshToken: refreshTokenValue },
        pageType: DEFAULT_AUTH_PAGE_TYPE,
      });
      const payload = response.auth?.refreshToken;
      const accessToken = payload?.accessToken;
      const newRefresh = payload?.refreshToken;
      if (!accessToken || !newRefresh)
        throw new Error("Invalid token response");
      setTokens(accessToken, newRefresh);
      notifyAuthPagesRefreshed(payload?.pages ?? null);
      return accessToken;
    } catch (error) {
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const isNetworkError =
          error instanceof TypeError ||
          (error instanceof Error &&
            (error.message.includes("fetch") ||
              error.message.includes("network")));
        if (isNetworkError) {
          await sleep(INITIAL_RETRY_DELAY * Math.pow(2, retryCount));
          isRefreshing = false;
          refreshPromise = null;
          return handleTokenRefresh(retryCount + 1);
        }
      }
      clearTokens();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function graphqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  options: GraphQLRequestOptions = {},
): Promise<T> {
  const {
    skipAuth = false,
    skipRefresh = false,
    showToastOnError = true,
  } = options;

  try {
    let token: string | null = null;
    if (!skipAuth) {
      token = getAccessToken();
      if (token && isTokenExpired(token) && !skipRefresh) {
        token = await handleTokenRefresh();
      }
    }

    const client = createGraphQLClient(token);

    try {
      return await client.request<T>(query, variables);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const gqlError = error as {
          response?: { errors?: GraphQLErrorResponse[]; data?: T };
        };
        const errors = gqlError.response?.errors ?? [];

        const authError = errors.find(
          (e) =>
            e.extensions?.code === "UNAUTHORIZED" ||
            e.extensions?.statusCode === 401,
        );

        if (authError && !skipAuth && !skipRefresh && token) {
          const newToken = await handleTokenRefresh();
          if (newToken) {
            const retryClient = createGraphQLClient(newToken);
            try {
              return await retryClient.request<T>(query, variables);
            } catch {
              clearTokens();
              if (typeof window !== "undefined")
                window.location.href = "/login";
              throw new Error("Session expired. Please login again.");
            }
          } else {
            clearTokens();
            if (typeof window !== "undefined") window.location.href = "/login";
            throw new Error("Session expired. Please login again.");
          }
        }

        if (errors.length > 0) {
          const parsed = parseGraphQLError(errors);
          const apiError = new Error(parsed.message) as Error & {
            parsedError?: ParsedGraphQLError;
          };
          apiError.parsedError = parsed;
          if (showToastOnError) toast.error(parsed.message);
          throw apiError;
        }

        if (gqlError.response?.data) return gqlError.response.data as T;
      }
      throw error;
    }
  } catch (error) {
    const msg =
      error instanceof Error ? error.message.toLowerCase() : String(error);
    const isNetworkError =
      error instanceof TypeError ||
      msg.includes("fetch") ||
      msg.includes("enotfound") ||
      msg.includes("econnrefused") ||
      msg.includes("network error");
    if (isNetworkError) {
      const networkError = new Error(
        "Network Error: Unable to reach the API. Check your connection.",
      );
      networkError.name = "NetworkError";
      if (options.showToastOnError !== false) toast.error(networkError.message);
      throw networkError;
    }
    throw error;
  }
}

export async function graphqlQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphQLRequestOptions,
): Promise<T> {
  return graphqlRequest<T>(query, variables, options);
}

export async function graphqlMutation<T = unknown>(
  mutation: string,
  variables?: Record<string, unknown>,
  options?: GraphQLRequestOptions,
): Promise<T> {
  return graphqlRequest<T>(mutation, variables, options);
}

export { gql };
