import type { LLMProvider } from "./models";

/**
 * The exact shape sent to POST /api/analyze.
 * Constructed by combining the ticker/analysisType form fields
 * with the LLM config from useLLMStore.
 */
export interface AnalyzeRequestPayload {
  ticker: string;
  analysis_type: "comprehensive" | "technical" | "sentiment";
  llm_config: {
    provider: LLMProvider;
    llm_model: string;
    temperature: number;
    max_token: number;
  };
}