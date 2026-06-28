from datetime import datetime
from fastapi import WebSocket
from sqlalchemy.orm import Session
from models.orm import AnalysisSession, AgentResult
from models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    HistoryResponse,
    LLMProvidersResponse,
    ProviderInfo,
    ModelInfo,
)
from models import repository
from services.orchestrator import MultiAgentDebateOrchestrator

# check for available providers
PROVIDERS = [
    ProviderInfo(
        provider="anthropic",
        display_name="Claude (Anthropic)",
        models=[
            ModelInfo(llm_model="claude-opus-4-6", display_name="Claude Opus 4.6"),
            ModelInfo(llm_model="claude-sonnet-4-6", display_name="Claude Sonnet 4.6"),
            ModelInfo(llm_model="claude-haiku-4-5-20251001", display_name="Claude Haiku 4.5"),
        ]
    ),
    ProviderInfo(
        provider="openai",
        display_name="ChatGPT (OpenAI)",
        models=[
            ModelInfo(llm_model="gpt-5.2", display_name="GPT-5.2"),
            ModelInfo(llm_model="gpt-5.4", display_name="GPT-5.4"),
            ModelInfo(llm_model="gpt-5.5", display_name="GPT-5.5"),
        ]
    ),
    ProviderInfo(
        provider="google",
        display_name="Gemini (Google)",
        models=[
            ModelInfo(llm_model="gemini-3.1-pro-preview", display_name="Gemini 3.1 Pro"),
            ModelInfo(llm_model="gemini-3-flash-preview", display_name="Gemini 3 Flash"),
            ModelInfo(llm_model="gemini-3.1-flash-lite-previewh", display_name="Gemini 3.1 Flash Lite"),
        ]
    )
]

# main functions called from router
def run_analysis(request, db, websocket=None):
    placeholder = AnalysisSession(
        ticker=request.ticker,
        llm_provider=request.llm_config.provider,
        llm_model=request.llm_config.llm_model,
        final_prediction="PENDING",
        confidence=0.0,
        consensus_strength=0.0,
        self_correction_applied=False,
    )
    db.add(placeholder)
    db.commit()
    db.refresh(placeholder)
    session_id = placeholder.id
    print(f"[Analysis] Created session {session_id} for {request.ticker}")

    orchestrator = MultiAgentDebateOrchestrator(
        llm_config=request.llm_config,
        db=db,
    )
    debate_result = orchestrator.run_debate(
        ticker=request.ticker,
        session_id=session_id, 
        websocket=None,
    )

    placeholder.final_prediction = debate_result["final_prediction"]
    placeholder.confidence = debate_result["confidence"]
    placeholder.consensus_strength = debate_result["consensus_strength"]
    placeholder.self_correction_applied = debate_result["self_correction_applied"]
    placeholder.price_targets = {k: v.model_dump() for k, v in debate_result["price_targets"].items()}
    placeholder.risk_assessment = debate_result["risk_assessment"].model_dump()
    db.commit()
    db.refresh(placeholder)

    for view in debate_result["agent_views"]:
        db.add(AgentResult(
            session_id=session_id,
            agent_name=view.agent,
            prediction=view.prediction,
            confidence=view.confidence,
            reasoning=view.reasoning,
        ))
    db.commit()

    return AnalysisResponse(
        session_id=session_id,
        ticker=request.ticker,
        final_prediction=debate_result["final_prediction"],
        confidence=debate_result["confidence"],
        consensus_strength=debate_result["consensus_strength"],
        agent_views=debate_result["agent_views"],
        self_correction_applied=debate_result["self_correction_applied"],
        correction_details=debate_result.get("correction"),
        price_targets=debate_result["price_targets"],
        risk_assessment=debate_result["risk_assessment"],
        minority_opinion=debate_result.get("minority_opinion"),
        llm_provider=debate_result["llm_provider"],
        llm_model=debate_result["llm_model"],
        created_at=placeholder.created_at,
    )

def get_session(session_id: int, db: Session) -> AnalysisResponse | None:
    return repository.get_session_by_id(session_id, db)

def get_analysis_history(ticker: str | None, limit: int, db: Session) -> list[HistoryResponse]:
    return repository.get_history(ticker, limit, db)

def get_available_providers() -> LLMProvidersResponse:
    return LLMProvidersResponse(providers=PROVIDERS)