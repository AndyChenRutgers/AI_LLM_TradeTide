from pydantic import BaseModel, ConfigDict, Field
from typing import Literal
from datetime import datetime

# enums and literals
LLMProvider = Literal['anthropic', 'openai', 'google']
AnthropicModel = Literal[
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001"
]
OpenAIModel = Literal[
    "gpt-4o",
    "gpt-4-turbo",
    "gpt-3.5-turbo"
]
GoogleModel = Literal[
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash"
]

# request schemas
class LLMConfig(BaseModel):
    provider: LLMProvider = "anthropic"
    llm_model: str = Field(default="claude-sonnet-4-6", min_length=1)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_token: int = Field(default=1024, ge=1, le=8192)

class AnalysisRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10, pattern=r"^[A-Z]{1,10}$")
    analysis_type: Literal["comprehensive", "technical", "sentiment"] = "comprehensive"
    llm_config: LLMConfig

# agent and debate sub-models
class AgentView(BaseModel):
    agent: str
    prediction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str

class CorrectionDetail(BaseModel):
    contradiction_type: str
    investigation: str
    resolution: str

class PriceTarget(BaseModel):
    target: float
    range: tuple[float, float]

class RiskAssessment(BaseModel):
    downside: str
    upside: str
    stop_loss: float
    risk_reward: str

# response models
class AnalysisResponse(BaseModel):
    session_id: int
    ticker: str
    final_prediction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    consensus_strength: float = Field(..., ge=0.0, le=1.0)
    agent_views: list[AgentView]
    self_correction_applied: bool
    correction_details: CorrectionDetail | None
    price_targets: dict[str, PriceTarget]
    risk_assessment: RiskAssessment
    minority_opinion: str | None = None
    llm_provider: str
    llm_model: str
    created_at: datetime

class HistoryResponse(BaseModel):
    session_id: int
    ticker: str
    final_prediction: str
    confidence: float
    llm_provider: str
    llm_model: str
    created_at: datetime

    class Config:
        from_attributes = True

# list response for llm providers and models
class ModelInfo(BaseModel):
    llm_model: str
    display_name: str

class ProviderInfo(BaseModel):
    provider: str
    display_name: str
    models: list[ModelInfo]

class LLMProvidersResponse(BaseModel):
    providers: list[ProviderInfo]