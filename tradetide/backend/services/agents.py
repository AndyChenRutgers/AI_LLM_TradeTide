import time
import re
from sqlalchemy.orm import Session
from typing import Literal
from models.schemas import LLMConfig, AgentView
from models import repository
from services.llm_router import resolve_client, call_llm_with_tools
from services.tools import ToolOrchestrator, TOOL_DEFINITIONS

class BaseAgent:
    name: str = "BaseAgent"
    system_prompt: str = ""
    required_tools: list[str] = []

    def __init__(self, llm_config: LLMConfig, orchestrator: ToolOrchestrator, db: Session):
        self.llm_config = llm_config
        self.orchestrator = orchestrator
        self.db = db
        self.client = resolve_client(llm_config)

    def _get_tools(self) -> list[dict]:
        return [t for t in TOOL_DEFINITIONS if t["name"] in self.required_tools]
    
    def _parse_prediction(self, text: str) -> Literal["BULLISH", "BEARISH", "NEUTRAL"]:
        upper = text.upper()
        if "BULLISH" in upper:
            return "BULLISH"
        if "BEARISH" in upper:
            return "BEARISH"
        return "NEUTRAL"

    def _parse_confidence(self, text: str) -> float:
        matches = re.findall(r"0\.\d+", text)
        return float(matches[0] if matches else 0.5)
    
    def _run_tool_loop(self, user_message: str) -> tuple[str, int, int]:
        tools = self._get_tools()
        text, tool_calls, prompt_tokens, completion_tokens = call_llm_with_tools(
            client=self.client,
            llm_config=self.llm_config,
            system_prompt=self.system_prompt,
            user_message=user_message,
            tools=tools,
            tool_results=None,  # initial call has no tool results
        )

        if not tool_calls:
            return text, prompt_tokens, completion_tokens
        
        tool_results = {}
        for tc in tool_calls:
            try:
                print(f"[{self.name}] Executing tool: {tc['name']} input={tc['input']}")
                result = self.orchestrator.execute(tc["name"], {**tc["input"], "ticker": tc["input"].get("ticker", "")})
                tool_results[tc["name"]] = result
                print(f"[{self.name}] Tool result: {str(result)[:100]}...")
            except Exception as e:
                print(f"[{self.name}] Tool {tc['name']} failed: {e}")
                tool_results[tc["name"]] = {"error": str(e)}

        text, _, prompt_tokens2, completion_tokens2 = call_llm_with_tools(
            client=self.client,
            llm_config=self.llm_config,
            system_prompt=self.system_prompt,
            user_message=user_message,
            tools=tools,
            tool_results=tool_results,
        )

        return text, prompt_tokens + prompt_tokens2, completion_tokens + completion_tokens2

    def analyze(self, ticker: str, session_id: int | None = None, consensus_views: list[AgentView] | None = None) -> AgentView:
        raise NotImplementedError


class TechnicalAgent(BaseAgent):
    name = "Technical Analyst"
    required_tools = ["fetch_historical_data", "analyze_technical_indicators"]
    system_prompt = (
        "You are an expert technical analyst. Use fetch_historical_data and "
        "analyze_technical_indicators to get price data. Then analyze the "
        "40/60 day moving average crossover, RSI, MACD, and Bollinger Bands. "
        "State your prediction as BULLISH, BEARISH, or NEUTRAL with a "
        "confidence score between 0 and 1."
    )

    def analyze(self, ticker: str, session_id: int | None = None, consensus_views: list[AgentView] | None = None) -> AgentView:
        start = time.monotonic()

        text, prompt_tokens, completion_tokens = self._run_tool_loop(
            f"Fetch historical price data and technical indicators for {ticker}. "
            f"Use the 40 and 60 day moving averages. Analyze RSI, MACD, and Bollinger Bands. "
            f"Then provide your prediction (BULLISH/BEARISH/NEUTRAL) with confidence (0-1) and reasoning."
        )

        latency_ms = int((time.monotonic() - start) * 1000)
        if session_id:
            repository.log_llm_usage(
                session_id=session_id, 
                agent_name=self.name,
                llm_provider=self.llm_config.provider,
                llm_model=self.llm_config.llm_model,
                prompt_tokens=prompt_tokens, 
                completion_tokens=completion_tokens,
                latency_ms=latency_ms, 
                db=self.db,
            )

        return AgentView(
            agent=self.name,
            prediction=self._parse_prediction(text),
            confidence=self._parse_confidence(text),
            reasoning=text.strip(),
        )


class SentimentAgent(BaseAgent):
    name = "Sentiment Analyst"
    required_tools = ["fetch_news", "fetch_social_sentiment", "fetch_analyst_ratings"]
    system_prompt = (
        "You are an expert sentiment analyst. Use fetch_news to find recent "
        "news about the stock. Use fetch_social_sentiment to gauge Twitter "
        "sentiment. Use fetch_analyst_ratings to see institutional consensus. "
        "Combine all three sources to form your view. "
        "State your prediction as BULLISH, BEARISH, or NEUTRAL with a "
        "confidence score between 0 and 1."
    )

    def analyze(self, ticker: str, session_id: int | None = None, consensus_views: list[AgentView] | None = None) -> AgentView:
        start = time.monotonic()

        text, prompt_tokens, completion_tokens = self._run_tool_loop(
            f"Fetch sentiment data for {ticker} from news, social media, and analyst ratings. "
            f"Use a 30 day lookback. Analyze the overall sentiment and whether it is sustainable. "
            f"State your prediction (BULLISH/BEARISH/NEUTRAL) with confidence (0-1) and reasoning."
        )

        latency_ms = int((time.monotonic() - start) * 1000)
        if session_id:
            repository.log_llm_usage(
                session_id=session_id, 
                agent_name=self.name,
                llm_provider=self.llm_config.provider,
                llm_model=self.llm_config.llm_model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                latency_ms=latency_ms, 
                db=self.db,
            )

        return AgentView(
            agent=self.name,
            prediction=self._parse_prediction(text),
            confidence=self._parse_confidence(text),
            reasoning=text.strip(),
        )


class MacroAgent(BaseAgent):
    name = "Macro Economist"
    required_tools = ["fetch_news"]
    system_prompt = (
        "You are an expert macro economist. Use fetch_news to find recent "
        "macroeconomic news — Fed announcements, interest rate decisions, "
        "inflation data, GDP reports, and sector-wide events. "
        "Also use your own knowledge of current macro conditions, Fed policy "
        "stance, yield curve, and economic cycle to form your view. "
        "State your prediction as BULLISH, BEARISH, or NEUTRAL with a "
        "confidence score between 0 and 1."
    )

    def analyze(self, ticker: str, session_id: int | None = None, consensus_views: list[AgentView] | None = None) -> AgentView:
        start = time.monotonic()

        text, prompt_tokens, completion_tokens = self._run_tool_loop(
            f"Fetch historical market events for {ticker} including earnings, Fed announcements, "
            f"and economic data for the past 180 days. Analyze the macro environment and its "
            f"impact on this stock. State your prediction (BULLISH/BEARISH/NEUTRAL) with "
            f"confidence (0-1) and reasoning."
        )

        latency_ms = int((time.monotonic() - start) * 1000)
        if session_id:
            repository.log_llm_usage(
                session_id=session_id, 
                agent_name=self.name,
                llm_provider=self.llm_config.provider,
                llm_model=self.llm_config.llm_model,
                prompt_tokens=prompt_tokens, 
                completion_tokens=completion_tokens,
                latency_ms=latency_ms, 
                db=self.db,
            )

        return AgentView(
            agent=self.name,
            prediction=self._parse_prediction(text),
            confidence=self._parse_confidence(text),
            reasoning=text.strip(),
        )


class ContraryAgent(BaseAgent):
    name = "Contrarian Analyst"
    required_tools = ["fetch_lob_data", "fetch_news"]
    system_prompt = (
        "You are a contrarian analyst. Use fetch_lob_data to check order "
        "book imbalance and hidden selling pressure. Use fetch_news to find "
        "any bearish risks being ignored by the consensus. "
        "Your job is to argue the OPPOSITE of the consensus view. "
        "Find what everyone is missing. "
        "State your prediction as BULLISH, BEARISH, or NEUTRAL with a "
        "confidence score between 0 and 1."
    )

    def analyze(
        self,
        ticker: str,
        session_id: int | None = None,
        consensus_views: list[AgentView] | None = None,
    ) -> AgentView:
        start = time.monotonic()

        consensus_summary = ""
        if consensus_views:
            consensus_summary = "\n".join(
                f"- {v.agent}: {v.prediction} ({v.confidence:.0%})"
                for v in consensus_views
            )

        text, prompt_tokens, completion_tokens = self._run_tool_loop(
            f"The consensus view on {ticker} is:\n{consensus_summary}\n\n"
            f"Fetch the order book data for {ticker} to check for hidden sell pressure. "
            f"Then argue the OPPOSITE of the consensus. What is everyone missing? "
            f"State your prediction (BULLISH/BEARISH/NEUTRAL) with confidence (0-1) "
            f"and your contrarian reasoning."
        )

        latency_ms = int((time.monotonic() - start) * 1000)
        if session_id:
            repository.log_llm_usage(
                session_id=session_id, 
                agent_name=self.name,
                llm_provider=self.llm_config.provider,
                llm_model=self.llm_config.llm_model,
                prompt_tokens=prompt_tokens, 
                completion_tokens=completion_tokens,
                latency_ms=latency_ms, 
                db=self.db,
            )

        return AgentView(
            agent=self.name,
            prediction=self._parse_prediction(text),
            confidence=self._parse_confidence(text),
            reasoning=text.strip(),
        )