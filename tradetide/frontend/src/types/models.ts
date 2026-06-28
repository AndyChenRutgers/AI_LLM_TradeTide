// llm config and analysis result types

export type LLMProvider = "anthropic" | "openai" | "google";

export interface LLMConfig {
  provider: LLMProvider;
  llm_model: string;
  temperature: number;
  max_token: number;
}

export interface ModelInfo {
  llm_model: string;
  display_name: string;
}

export interface ProviderInfo {
  provider: LLMProvider;
  display_name: string;
  models: ModelInfo[];
}

export interface LLMProvidersResponse {
  providers: ProviderInfo[];
}

// request and response types for /analyze and /history endpoints

export interface AnalyzeRequest {
  ticker: string;
  analysis_type: "comprehensive" | "technical" | "sentiment";
  llm_config: LLMConfig;
}

// response for both /analyze and /history endpoints

export type Prediction = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface AgentView {
  agent: string;
  prediction: Prediction;
  confidence: number;
  reasoning: string;
}

export interface PriceTarget {
  target: number;
  range: [number, number];
}

export interface RiskAssessment {
  downside: string;
  upside: string;
  stop_loss: number;
  risk_reward: string;
}

export interface CorrectionDetail {
  contradiction_type: string;
  investigation: string;
  resolution: string;
}

export interface AnalysisResponse {
  session_id: number;
  ticker: string;
  final_prediction: Prediction;
  confidence: number;
  consensus_strength: number;
  agent_views: AgentView[];
  self_correction_applied: boolean;
  correction_details: CorrectionDetail | null;
  price_targets: Record<string, PriceTarget>;
  risk_assessment: RiskAssessment;
  minority_opinion: string | null;
  llm_provider: string;
  llm_model: string;
  created_at: string;
}

export interface HistoryRecord {
  session_id: number;
  ticker: string;
  final_prediction: Prediction;
  confidence: number;
  llm_provider: string;
  llm_model: string;
  created_at: string;
}

// events for websocket streaming updates during analysis
export type WSEvent =
  | { event: "agent_result";   agent: string; prediction: Prediction; confidence: number }
  | { event: "self_correction"; contradiction_type: string; resolution: string }
  | { event: "synthesis";      data: Partial<AnalysisResponse> }
  | { event: "error";          detail: string };