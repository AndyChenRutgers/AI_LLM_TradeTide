from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import httpx
from models.db import get_db
from models.schemas import AnalysisRequest, AnalysisResponse, HistoryResponse, LLMProvidersResponse
from services.analysis import run_analysis, get_session, get_analysis_history, get_available_providers

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
def analyze(request: AnalysisRequest, db: Session = Depends(get_db)):
    print(f"[Route] /analyze called: ticker={request.ticker} provider={request.llm_config.provider} model={request.llm_config.llm_model}")
    try:
        result = run_analysis(request, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Analysis failed: " + str(e))
    
@router.get("/session/{session_id}", response_model=AnalysisResponse)
def session_detail(session_id: int, db: Session = Depends(get_db)):
    result = get_session(session_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result

@router.get("/history", response_model=list[HistoryResponse])
def history(ticker: str | None = None, limit: int = 20, db: Session = Depends(get_db)):
    return get_analysis_history(ticker, limit, db)

@router.get("/llms", response_model=LLMProvidersResponse)
def llm_providers():
    return get_available_providers()

@router.get("/search-ticker")
def search_ticker(q: str):
    if not q or len(q.strip()) < 2:
        return []
    try:
        resp = httpx.get(
            "https://query1.finance.yahoo.com/v1/finance/search",
            params={"q": q.strip(), "quotesCount": 8, "newsCount": 0},
            headers={"User-Agent": "Mozilla/5.0 (compatible; TradeTide/1.0)"},
            timeout=5.0,
        )
        resp.raise_for_status()
        quotes = resp.json().get("quotes", [])
        results = []
        for quote in quotes:
            symbol = quote.get("symbol")
            quote_type = quote.get("quoteType", "")
            if symbol and quote_type in ("EQUITY", "ETF"):
                results.append({
                    "ticker": symbol,
                    "name": quote.get("longname") or quote.get("shortname") or symbol,
                    "exchange": quote.get("exchDisp", ""),
                })
        return results[:5]
    except Exception as e:
        print(f"[search-ticker] error: {e}")
        return []

@router.websocket("/ws/stream")
async def stream(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        payload = await websocket.receive_json()
        request = AnalysisRequest(**payload)

        await websocket.send_json({"event": "started", "ticker": request.ticker})
        result = run_analysis(request, db, websocket=websocket)
        
        await websocket.send_json({
            "event": "synthesis",
            "data": {
                "session_id": result.session_id,
                "ticker": result.ticker,
                "final_prediction": result.final_prediction,
                "confidence": result.confidence,
                "consensus_strength": result.consensus_strength,
                "agent_views": [v.model_dump() for v in result.agent_views],
                "self_correction_applied": result.self_correction_applied,
                "correction_details": result.correction_details.model_dump() if result.correction_details else None,
                "price_targets": {k: v.model_dump() for k, v in result.price_targets.items()},
                "risk_assessment": result.risk_assessment.model_dump(),
                "minority_opinion": result.minority_opinion,
                "llm_provider": result.llm_provider,
                "llm_model": result.llm_model,
                "created_at": result.created_at.isoformat(),
            }
        })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"event": "error", "detail": str(e)})
        await websocket.close()