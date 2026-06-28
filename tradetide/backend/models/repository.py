from sqlalchemy.orm import Session
from models.orm import AnalysisSession, AgentResult, LLMUsageLog, PriceData, MarketEvent
from models.schemas import AnalysisResponse, HistoryResponse
from datetime import datetime, timedelta

# writing operations
def save_analysis(result: AnalysisResponse, db: Session) -> AnalysisSession:
    session = AnalysisSession(
        ticker=result.ticker,
        llm_provider=result.llm_provider,
        llm_model=result.llm_model,
        final_prediction=result.final_prediction,
        confidence=result.confidence,
        consensus_strength=result.consensus_strength,
        self_correction_applied=result.self_correction_applied,
        price_targets={k: v.model_dump() for k, v in result.price_targets.items()},
        risk_assessment=result.risk_assessment.model_dump()
    )
    db.add(session)
    db.flush()  # to get session.id for foreign key relationships
    for view in result.agent_views:
        db.add(AgentResult(
            session_id=session.id,
            agent_name=view.agent,
            prediction=view.prediction,
            confidence=view.confidence,
            reasoning=view.reasoning
        ))
    db.commit()
    db.refresh(session)
    return session

def log_llm_usage(session_id: int, agent_name: str, llm_provider: str, llm_model: str, prompt_tokens: int, completion_tokens: int, latency_ms: int, db: Session) -> None:
    db.add(LLMUsageLog(
        session_id=session_id,
        agent_name=agent_name,
        llm_provider=llm_provider,
        llm_model=llm_model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms
    ))
    db.commit()

def cache_price_data(ticker: str, rows: list[dict], db: Session) -> None:
    for row in rows:
        existing = (
            db.query(PriceData)
                .filter(PriceData.ticker == ticker, PriceData.date == row["date"])
                .first()
        )
        if not existing:
            db.add(PriceData(ticker=ticker, **row))
    db.commit()

def save_market_event(ticker: str, event: dict, db: Session) -> None:
    existing = (
        db.query(MarketEvent)
            .filter(
                MarketEvent.ticker == ticker,
                MarketEvent.event_date == event["event_date"],
                MarketEvent.event_type == event["event_type"]
            )
            .first()
    )
    if not existing:
        db.add(MarketEvent(ticker=ticker, **event))
        db.commit()

# reading operations
def get_session_by_id(session_id: int, db: Session) -> AnalysisResponse | None:
    from models.schemas import AgentView, PriceTarget, RiskAssessment
    row = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not row:
        return None
    agent_views = [
        AgentView(
            agent=ar.agent_name,
            prediction=ar.prediction,
            confidence=ar.confidence,
            reasoning=ar.reasoning or "",
        )
        for ar in row.agent_results
    ]
    price_targets = {
        k: PriceTarget(**v) for k, v in (row.price_targets or {}).items()
    }
    risk_assessment = RiskAssessment(**(row.risk_assessment or {}))
    return AnalysisResponse(
        session_id=row.id,
        ticker=row.ticker,
        final_prediction=row.final_prediction,
        confidence=row.confidence,
        consensus_strength=row.consensus_strength,
        agent_views=agent_views,
        self_correction_applied=row.self_correction_applied,
        correction_details=None,
        price_targets=price_targets,
        risk_assessment=risk_assessment,
        minority_opinion=None,
        llm_provider=row.llm_provider,
        llm_model=row.llm_model,
        created_at=row.created_at,
    )

def get_history(
    ticker: str | None,
    limit: int,
    db: Session,
) -> list[HistoryResponse]:
    query = db.query(AnalysisSession).order_by(AnalysisSession.created_at.desc())
    if ticker:
        query = query.filter(AnalysisSession.ticker == ticker.upper())
    rows = query.limit(limit).all()
    return [
        HistoryResponse(
            session_id=row.id,         
            ticker=row.ticker,
            final_prediction=row.final_prediction,
            confidence=row.confidence,
            llm_provider=row.llm_provider,
            llm_model=row.llm_model,
            created_at=row.created_at,
        )
        for row in rows
    ]

def get_cached_price_data(ticker: str, days: int, db: Session) -> list[PriceData]:
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(PriceData)
            .filter(PriceData.ticker == ticker, PriceData.date >= cutoff_date)
            .order_by(PriceData.date.asc())
            .all()
    )

def get_market_events(ticker: str, days: int, db: Session) -> list[MarketEvent]:
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(MarketEvent)
            .filter(MarketEvent.ticker == ticker, MarketEvent.event_date >= cutoff_date)
            .order_by(MarketEvent.event_date.desc())
            .all()
    )