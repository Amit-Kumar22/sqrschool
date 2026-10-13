import { api, type ApiEnvelope } from './api';
import { API_ENDPOINTS } from './config';

// ─── AI search service ───────────────────────────────────────────────────────
// Natural-language questions about school data. The backend converts the
// question to SQL, runs it read-only and returns the rows with an AI summary.

/** One result row, keyed by column name. Values are whatever the SQL produced. */
export type AiSearchRow = Record<string, unknown>;

export interface AiSearchResult {
  question: string;
  sql: string;
  summary: string;
  columns: string[];
  data: AiSearchRow[];
  rowCount: number;
  processingMs: number;
}

export interface AiSearchPayload {
  question: string;
  /** Optional AI provider override — the backend picks its default when omitted. */
  provider?: string;
}

// The model call plus the query routinely takes ~10s, so this gets more
// headroom than the shared 30s axios timeout.
const AI_SEARCH_TIMEOUT_MS = 90000;

export const aiSearch = async (payload: AiSearchPayload): Promise<AiSearchResult> => {
  const response = await api.post<ApiEnvelope<AiSearchResult>>(API_ENDPOINTS.AI.SEARCH, payload, {
    timeout: AI_SEARCH_TIMEOUT_MS,
  });
  return response.data.result;
};
