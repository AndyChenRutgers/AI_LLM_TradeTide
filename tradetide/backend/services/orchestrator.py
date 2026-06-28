import re
from models import repository as _
from sqlalchemy.orm import Session
from models.schemas import LLMConfig, AgentView, AnalysisResponse, CorrectionDetail, PriceTarget, RiskAssessment
from services.tools import ToolOrchestrator
from services.agents import TechnicalAgent, SentimentAgent, MacroAgent, ContraryAgent
from services.llm_router import resolve_client, call_llm


class SelfCorrectionEngine:
    def __init__(self, llm_config: LLMConfig):
        self.llm_config = llm_config
        self.client = resolve_client(llm_config)

    def check(self, views: list[AgentView]) -> CorrectionDetail | None:
        predictions = [v.prediction for v in views]
        has_bullish = "BULLISH" in predictions
        has_bearish = "BEARISH" in predictions

        if not (has_bullish and has_bearish):
            return None

        bullish_agents = [v for v in views if v.prediction == "BULLISH"]
        bearish_agents = [v for v in views if v.prediction == "BEARISH"]

        contradiction_type = "BULLISH vs BEARISH divergence"
        context = (
            f"Bullish agents: {[v.agent for v in bullish_agents]}\n"
            f"Bearish agents: {[v.agent for v in bearish_agents]}\n"
            f"Bullish reasoning sample: {bullish_agents[0].reasoning[:400]}\n\n"
            f"Bearish reasoning sample: {bearish_agents[0].reasoning[:400]}"
        )

        text, _, _ = call_llm(
            client=self.client,
            llm_config=self.llm_config,
            system_prompt=(
                "You are a senior analyst resolving contradictions between analyst teams. "
                "Be concise and decisive in determining the most likely correct prediction, and provide a clear rationale."
            ),
            user_message=(
                f"These analysts disagree:\n\n{context}\n\n"
                "1. Why might both views be partially correct?\n"
                "2. Which signal is likely stronger and why?\n"
                "3. What is the resolution - what should the final prediction lean towards?"
            ),
        )

        return CorrectionDetail(
            contradiction_type=contradiction_type,
            investigation=text.strip(),
            resolution=text.strip().split("\n")[-1][:200]
        )


class MultiAgentDebateOrchestrator:
    def __init__(self, llm_config: LLMConfig, db: Session):
        self.llm_config = llm_config
        self.db = db
        self.orchestrator = ToolOrchestrator(db)
        self.correction_engine = SelfCorrectionEngine(llm_config)
        self.client = resolve_client(llm_config)

    def run_debate(self, ticker: str, session_id: int | None = None, websocket=None) -> dict:
        technical_agent = TechnicalAgent(self.llm_config, self.orchestrator, self.db)
        sentiment_agent = SentimentAgent(self.llm_config, self.orchestrator, self.db)
        macro_agent = MacroAgent(self.llm_config, self.orchestrator, self.db)

        views: list[AgentView] = []
        for agent in (technical_agent, sentiment_agent, macro_agent):
            try:
                res = agent.analyze(ticker, session_id)
                views.append(res)
            except Exception:
                continue

        correction = self.correction_engine.check(views)

        contrary_agent = ContraryAgent(self.llm_config, self.orchestrator, self.db)
        try:
            contrarian_view = contrary_agent.analyze(ticker, session_id=session_id, consensus_views=views)
            views.append(contrarian_view)
        except Exception:
            pass

        synthesis = self._synthesise(ticker, views, correction)
        return {**synthesis, "agent_views": views, "correction": correction}

    def _synthesise(self, ticker: str, views: list[AgentView], correction: CorrectionDetail | None) -> dict:
        if not views:
            raise ValueError("All agents failed to produce a view, unable to synthesize a prediction")

        WEIGHTS = {
            "Technical Analyst": 1.0,
            "Sentiment Analyst": 1.0,
            "Macro Economic Analyst": 1.0,
            "Contrarian Analyst": 0.5
        }

        bullish_score = sum(
            WEIGHTS.get(v.agent, 1.0) * v.confidence for v in views if v.prediction == "BULLISH"
        )
        bearish_score = sum(
            WEIGHTS.get(v.agent, 1.0) * v.confidence for v in views if v.prediction == "BEARISH"
        )
        neutral_score = sum(
            WEIGHTS.get(v.agent, 1.0) * v.confidence for v in views if v.prediction == "NEUTRAL"
        )

        total = bullish_score + bearish_score + neutral_score or 1
        if bullish_score >= bearish_score and bullish_score >= neutral_score:
            final_prediction = "BULLISH"
        elif bearish_score >= bullish_score and bearish_score >= neutral_score:
            final_prediction = "BEARISH"
        else:
            final_prediction = "NEUTRAL"

        avg_conf = round(sum(v.confidence for v in views) / len(views), 4)
        consensus_strength = round(max(bullish_score, bearish_score, neutral_score) / total, 4)
        minority_views = [v for v in views if v.prediction != final_prediction]
        minority_opinion = (
            f"{', '.join(v.agent for v in minority_views)} disagree: "
            f"{minority_views[0].reasoning[:200]}"
            if minority_views else None
        )

        views_summary = "\n".join(
            f"- {v.agent}: {v.prediction} ({v.confidence:.0%}) - {v.reasoning[:200]}"
            for v in views
        )
        correction_note = (
            f"\nSelf-Correction applied: {correction.resolution}"
            if correction else ""
        )

        text, _, _ = call_llm(
            client=self.client,
            llm_config=self.llm_config,
            system_prompt="You are a senior portfolio manager synthesising analyst views into actionable intelligence.",
            user_message=(
                f"Final vote for {ticker}: {final_prediction} (confidence {avg_conf:.0%})\n\n"
                f"Agent views:\n{views_summary}{correction_note}\n\n"
                "Based on this, provide:\n"
                "1. Price targets: 1-week, 1-month, 6-months (as specific numbers, e.g. $195)\n"
                "2. Stop-loss level\n"
                "3. Downside scenario (one sentence)\n"
                "4. Upside scenario (one sentence)\n"
                "5. Risk-reward ratio"
            ),
        )

        prices = re.findall(r"\$?(\d+\.?\d*)", text)
        prices = [float(p) for p in prices if 10 < float(p) < 100_000]

        def safe_price(idx: int, fallback: float) -> float:
            return prices[idx] if idx < len(prices) else fallback

        current_guess = safe_price(0, 100.0)
        price_targets = {
            "1_week":   PriceTarget(target=safe_price(0, current_guess * 1.01),  range=(safe_price(0, current_guess * 0.99),  safe_price(1, current_guess * 1.04))),
            "1_month":  PriceTarget(target=safe_price(2, current_guess * 1.05),  range=(safe_price(2, current_guess * 0.97),  safe_price(3, current_guess * 1.12))),
            "6_months": PriceTarget(target=safe_price(4, current_guess * 1.18),  range=(safe_price(4, current_guess * 0.90),  safe_price(5, current_guess * 1.30))),
        }
        stop_loss = safe_price(6, current_guess * 0.92)
        risk_assessment = RiskAssessment(
            downside=f"Stock could drop to around ${stop_loss:.2f} if the main bearish thesis plays out",
            upside=f"Stock could rise to around ${price_targets['6_months'].target:.2f} if the main bullish thesis plays out",
            stop_loss=stop_loss,
            risk_reward="1.5x"
        )

        return {
            "ticker": ticker,
            "final_prediction": final_prediction,
            "confidence": avg_conf,
            "consensus_strength": consensus_strength,
            "self_correction_applied": correction is not None,
            "price_targets": price_targets,
            "risk_assessment": risk_assessment,
            "minority_opinion": minority_opinion,
            "llm_provider": self.llm_config.provider,
            "llm_model": self.llm_config.llm_model
        }
