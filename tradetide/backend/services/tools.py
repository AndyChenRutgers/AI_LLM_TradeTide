import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from config import settings
from models import repository

# defining the tools sent to the LLMs as JSON schemas
TOOL_DEFINITIONS = [
    {
        "name": "fetch_historical_data",
        "description": (
            "Fetch historical OHLCV price data and compute moving averages for a stock. "
            "Use this to get price trends, 40/60 day MA, and EWMA."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
                "days": {"type": "integer"},
                "ma_periods": {"type": "array", "items": {"type": "integer"}},
                "include_ewma": {"type": "boolean"},
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "analyze_technical_indicators",
        "description": "Compute RSI, MACD, and Bollinger Bands from historical price data.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
                "indicators": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["rsi", "macd", "bollinger"]},
                },
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "fetch_news",
        "description": (
        "Fetch recent news articles about a stock using NewsAPI. "
        "Maximum lookback is 30 days. Use this for recent earnings news, "
        "product launches, analyst upgrades/downgrades, Fed announcements, "
        "and any market-moving events. For macro context beyond 30 days, "
        "rely on your own training knowledge."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
                "query": {"type": "string", "description": "Search query e.g. 'AAPL Apple earnings'"},
                "lookback_days": {"type": "integer", "description": "How many days back to search"},
            },
            "required": ["ticker", "query"],
        },
    },
    {
        "name": "fetch_social_sentiment",
        "description": (
            "Fetch recent tweets about a stock to gauge social media sentiment. "
            "Use this to understand retail investor sentiment and trending opinions."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
                "count": {"type": "integer", "description": "Number of tweets to fetch (max 50)"},
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "fetch_analyst_ratings",
        "description": (
            "Fetch the latest analyst buy/sell/hold ratings for a stock from Finnhub. "
            "Use this to understand institutional analyst consensus."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "fetch_lob_data",
        "description": "Fetch real-time order book bid/ask data and imbalance ratio for a stock.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
                "include_vwap": {"type": "boolean"},
            },
            "required": ["ticker"],
        },
    },
]

# individual tool service functions
class HistoricalDataService:
    def __init__(self, db: Session):
        self.db = db

    def fetch(self, ticker: str, days: int = 90, ma_periods: list[int] | None = None, include_ewma: bool = True) -> dict:
        ma_periods = ma_periods or [40, 60]
        cached = repository.get_cached_price_data(ticker, days, self.db)
        if cached:
            ohlcv = [
                {"date": r.date, "open": r.open, "high": r.high,
                 "low": r.low, "close": r.close, "volume": r.volume}
                for r in cached
            ]
        else:
            ohlcv = self._fetch_from_api(ticker, days)
            if ohlcv:
                repository.cache_price_data(ticker, ohlcv, self.db)

        closes = [r["close"] for r in ohlcv]
        mas    = {p: self._sma(closes, p)  for p in ma_periods}
        ewmas  = {p: self._ewma(closes, p) for p in ma_periods} if include_ewma else {}
        trend  = "BULLISH" if mas.get(40, 0) > mas.get(60, 0) else "BEARISH"

        return {
            "ticker":         ticker,
            "current_price":  closes[-1] if closes else 0,
            "ohlcv":          ohlcv[-5:],
            "moving_averages": mas,
            "ewma":           ewmas,
            "trend_direction": trend,
            "ma_crossover": {
                "status":       "positive" if trend == "BULLISH" else "negative",
                "distance_pct": round(
                    abs(mas.get(40, 0) - mas.get(60, 0)) / max(mas.get(60, 1), 1) * 100, 2
                ),
            },
        }

    def _fetch_from_api(self, ticker: str, days: int) -> list[dict]:
        try:
            end   = datetime.utcnow()
            start = end - timedelta(days=days)
            with httpx.Client() as client:
                resp = client.get(
                    f"https://data.alpaca.markets/v2/stocks/{ticker}/bars",
                    headers={
                        "APCA-API-KEY-ID":     settings.ALPACA_API_KEY,
                        "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY,
                    },
                    params={
                        "timeframe": "1Day",
                        "start": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "end": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "limit": days,
                        "adjustment": "all",
                        "feed": "iex"
                    },
                    timeout=10,
                )
                resp.raise_for_status()
                bars = resp.json().get("bars", [])
                return [
                    {
                        "date":   datetime.fromisoformat(bar["t"].replace("Z", "+00:00")),
                        "open":   round(bar["o"], 4),
                        "high":   round(bar["h"], 4),
                        "low":    round(bar["l"], 4),
                        "close":  round(bar["c"], 4),
                        "volume": int(bar["v"]),
                    }
                    for bar in bars
                ]
        except Exception as e:
            print(f"Alpaca historical error: {e}")
            return []

    def _sma(self, closes: list[float], period: int) -> float:
        if len(closes) < period:
            return 0.0
        return round(sum(closes[-period:]) / period, 4)

    def _ewma(self, closes: list[float], period: int) -> float:
        if not closes:
            return 0.0
        k   = 2 / (period + 1)
        ema = closes[0]
        for price in closes[1:]:
            ema = price * k + ema * (1 - k)
        return round(ema, 4)
    
class TechnicalAnalysisService:
    def __init__(self, db: Session):
        self.db = db

    def analyze(self, ticker: str, indicators: list[str] | None = None) -> dict:
        indicators = indicators or ["rsi", "macd", "bollinger"]
        cached = repository.get_cached_price_data(ticker, 90, self.db)
        closes = [r.close for r in cached] if cached else []

        results = {}
        if "rsi" in indicators:
            results["rsi"] = self._rsi(closes)
        if "macd" in indicators:
            results["macd"] = self._macd(closes)
        if "bollinger" in indicators:
            results["bollinger"] = self._bollinger_bands(closes)

        trend = "BULLISH" if results.get("rsi", {}).get("current", 50) > 50 else "BEARISH"
        return {
            "ticker": ticker,
            "indicators": results,
            "overall_trend": trend
        }
    
    def _rsi(self, closes: list[float], period: int = 14) -> dict:
        if len(closes) < period + 1:
            return {"current": 50, "overbought": False, "oversold": False}
        
        deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
        gains = [d if d > 0 else 0 for d in deltas[-period:]]
        losses = [-d if d < 0 else 0 for d in deltas[-period:]]
        avg_gain = sum(gains) / period
        avg_loss = sum(losses) / period
        rs = avg_gain / avg_loss if avg_loss else 100
        rsi = round(100 - (100 / (1 + rs)), 2)
        return {
            "current": rsi,
            "overbought": rsi > 70,
            "oversold": rsi < 30
        }
    
    def _macd(self, closes: list[float]) -> dict:
        def ema(data: list[float], p: int) -> float:
            k = 2 / (p + 1)
            v = data[0]
            for x in data[1:]:
                v = x * k + v * (1 - k)
            return v
        if len(closes) < 26:
            return {
                "macd_line": 0,
                "signal_line": 0,
                "histogram": 0,
                "bullish": False
            }
        macd_line = ema(closes, 12) - ema(closes, 26)
        signal_line = ema([macd_line], 9)
        histogram = round(macd_line - signal_line, 4)
        return {
            "macd_line": round(macd_line, 4),
            "signal_line": round(signal_line, 4),
            "histogram": histogram,
            "bullish": histogram > 0
        }
    
    def _bollinger_bands(self, closes: list[float], period: int = 20) -> dict:
        if len(closes) < period:
            return {
                "upper": 0,
                "middle": 0,
                "lower": 0,
                "percent_b": 0.5
            }
        
        window = closes[-period:]
        mid = sum(window) / period
        std_dev = (sum((x - mid) ** 2 for x in window) / period) ** 0.5
        upper, lower = mid + 2 * std_dev, mid - 2 * std_dev
        current = closes[-1]
        percent_b = round((current - lower) / (upper - lower), 4) if upper != lower else 0.5
        return {
            "upper": round(upper, 4),
            "middle": round(mid, 4),
            "lower": round(lower, 4),
            "percent_b": percent_b
        }

class LOBDataService:
    def fetch(self, ticker: str, depth: int = 10, include_vwap: bool = True) -> dict:
        try:
            with httpx.Client() as client:
                resp = client.get(
                    f"https://data.alpaca.markets/v2/stocks/{ticker}/quotes/latest",
                    headers={
                        "APCA-API-KEY-ID":     settings.ALPACA_API_KEY,
                        "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY,
                    },
                    params={"feed": "iex"},
                    timeout=10,
                )
                resp.raise_for_status()
                quote = resp.json().get("quote", {})

                bid = quote.get("bp", 0) or 0
                ask = quote.get("ap", 0) or 0
                bid_size = quote.get("bs", 0) or 0
                ask_size = quote.get("as", 0) or 0
                spread = round(ask - bid, 4)
                spread_pct = round(spread / bid * 100, 4) if bid else 0
                total = bid_size + ask_size
                imbalance  = round(bid_size / total, 4) if total else 0.5

                return {
                    "ticker": ticker,
                    "bid": bid,
                    "ask": ask,
                    "spread": spread,
                    "spread_pct": spread_pct,
                    "imbalance_ratio": imbalance,
                    "liquidity_health": "good" if spread_pct < 0.1 else "moderate",
                    "vwap": quote.get("vw") if include_vwap else None,
                }
        except Exception as e:
            print(f"Alpaca LOB error: {e}")
            return {
                "ticker": ticker,
                "bid": 0,
                "ask": 0,
                "spread": 0,
                "spread_pct": 0,
                "imbalance_ratio": 0.5,
                "liquidity_health": "unknown",
                "vwap": None,
            }
        signals = []

        hist = analysis_data.get("historical", {})
        if hist.get("trend_direction") == "BULLISH":
            signals.append(1)
        elif hist.get("trend_direction") == "BEARISH":
            signals.append(-1)
        else:
            signals.append(0)

        tech = analysis_data.get("technical", {})
        rsi = tech.get("indicators", {}).get("rsi", {}).get("current", 50)
        signals.append(1 if rsi > 55 else -1 if rsi < 45 else 0)

        sentiment = analysis_data.get("sentiment", {})
        score = sentiment.get("overall_sentiment", 0.5)
        signals.append(1 if score > 0.6 else -1 if score < 0.4 else 0)

        lob = analysis_data.get("lob", {})
        imbalance = lob.get("imbalance_ratio", 0.5)
        signals.append(1 if imbalance > 0.55 else -1 if imbalance < 0.45 else 0)

        avg_signal = sum(signals) / len(signals)
        if avg_signal > 0.2:
            trend = "BULLISH"
        elif avg_signal < -0.2:
            trend = "BEARISH"
        else:
            trend = "NEUTRAL"

        current_price = hist.get("current_price", 100)
        return {
            "ticker": ticker,
            "trend": trend,
            "confidence": round(abs(avg_signal), 4),
            "price_targets": {
                "1_week":   {"target": round(current_price * 1.015, 2), "range": [round(current_price * 0.99, 2), round(current_price * 1.04, 2)]},
                "1_month":  {"target": round(current_price * 1.05, 2),  "range": [round(current_price * 0.97, 2), round(current_price * 1.12, 2)]},
                "6_months": {"target": round(current_price * 1.18, 2),  "range": [round(current_price * 0.90, 2), round(current_price * 1.30, 2)]}
            },
        }
    
class NewsService:
    """Fetches real news articles via NewsAPI."""

    def fetch(self, ticker: str, query: str, lookback_days: int = 7) -> dict:
        lookback_days = min(max(10, lookback_days), 30)  
        from_date = (datetime.utcnow() - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
        try:
            with httpx.Client() as client:
                resp = client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": query,
                        "from": from_date,
                        "language": "en",
                        "sortBy": "relevancy",
                        "pageSize": 10,
                        "apiKey": settings.NEWS_API_KEY,
                    },
                    timeout=10,
                )
                resp.raise_for_status()
                articles = resp.json().get("articles", [])
                return {
                    "ticker": ticker,
                    "articles": [
                        {
                            "title": a.get("title", ""),
                            "description": a.get("description", ""),
                            "source": a.get("source", {}).get("name", ""),
                            "published": a.get("publishedAt", ""),
                            "url": a.get("url", ""),
                        }
                        for a in articles
                    ],
                    "count": len(articles),
                }
        except Exception as e:
            print(f"NewsAPI error: {e}")
            return {"ticker": ticker, "articles": [], "count": 0}


class SocialSentimentService:
    """Fetches tweets via TwitterAPI.io."""

    def fetch(self, ticker: str, count: int = 30) -> dict:
        try:
            with httpx.Client() as client:
                resp = client.get(
                    "https://api.twitterapi.io/twitter/tweet/advanced_search",
                    params={
                        "query": f"${ticker} lang:en -is:retweet",
                        "queryType": "Latest",
                        "count": min(count, 50),
                    },
                    headers={"X-API-Key": settings.TWITTER_API_KEY},
                    timeout=10,
                )
                resp.raise_for_status()
                tweets = resp.json().get("tweets", [])

                BULLISH = {"buy", "bullish", "long", "moon", "surge", "beat", "rally", "breakout"}
                BEARISH = {"sell", "bearish", "short", "crash", "drop", "miss", "dump", "weak"}

                bullish, bearish = 0, 0
                tweet_texts = []
                for tweet in tweets:
                    text = tweet.get("text", "")
                    words = set(text.lower().split())
                    bullish += len(words & BULLISH)
                    bearish += len(words & BEARISH)
                    tweet_texts.append(text[:200])

                total = bullish + bearish
                score = round(bullish / total, 4) if total else 0.5
                trend = "BULLISH" if score > 0.6 else "BEARISH" if score < 0.4 else "NEUTRAL"

                return {
                    "ticker": ticker,
                    "sentiment_score": score,
                    "trend": trend,
                    "bullish_count": bullish,
                    "bearish_count": bearish,
                    "tweet_count": len(tweets),
                    "sample_tweets": tweet_texts[:5],
                }
        except Exception as e:
            print(f"Twitter API error: {e}")
            return {
                "ticker": ticker,
                "sentiment_score": 0.5,
                "trend": "NEUTRAL",
                "tweet_count": 0,
                "sample_tweets": [],
            }


class AnalystRatingsService:
    """Fetches analyst ratings from Finnhub."""

    def fetch(self, ticker: str) -> dict:
        try:
            with httpx.Client() as client:
                resp = client.get(
                    "https://finnhub.io/api/v1/stock/recommendation",
                    params={"symbol": ticker, "token": settings.FINNHUB_API_KEY},
                    timeout=10,
                )
                resp.raise_for_status()
                data = resp.json()
                if not data:
                    return {"ticker": ticker, "rating": "NEUTRAL", "score": 0.5}

                latest = data[0]
                buy = latest.get("buy", 0) + latest.get("strongBuy", 0)
                sell = latest.get("sell", 0) + latest.get("strongSell", 0)
                hold = latest.get("hold", 0)
                total = buy + sell + hold
                score = round(buy / total, 4) if total else 0.5
                rating = "BULLISH" if score > 0.6 else "BEARISH" if score < 0.4 else "NEUTRAL"

                return {
                    "ticker": ticker,
                    "buy": buy,
                    "sell": sell,
                    "hold": hold,
                    "score": score,
                    "rating": rating,
                    "period": latest.get("period", ""),
                }
        except Exception as e:
            print(f"Finnhub analyst error: {e}")
            return {"ticker": ticker, "rating": "NEUTRAL", "score": 0.5}
    
# tool orchestrator function to call the appropriate service based on tool name
class ToolOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self._historical = HistoricalDataService(db)
        self._technical  = TechnicalAnalysisService(db)
        self._news       = NewsService()
        self._social     = SocialSentimentService()
        self._analyst    = AnalystRatingsService()
        self._lob        = LOBDataService()

    ALLOWED_PARAMS = {
        "fetch_historical_data":        {"ticker", "days", "ma_periods", "include_ewma"},
        "analyze_technical_indicators": {"ticker", "indicators"},
        "fetch_news":                   {"ticker", "query", "lookback_days"},
        "fetch_social_sentiment":       {"ticker", "count"},
        "fetch_analyst_ratings":        {"ticker"},
        "fetch_lob_data":               {"ticker", "depth", "include_vwap"},
    }

    def execute(self, tool_name: str, tool_input: dict) -> dict:
        if "ticker" in tool_input:
            tool_input["ticker"] = tool_input["ticker"].upper()

        if tool_name in self.ALLOWED_PARAMS:
            tool_input = {
                k: v for k, v in tool_input.items()
                if k in self.ALLOWED_PARAMS[tool_name]
            }

        match tool_name:
            case "fetch_historical_data":
                return self._historical.fetch(**tool_input)
            case "analyze_technical_indicators":
                return self._technical.analyze(**tool_input)
            case "fetch_news":
                return self._news.fetch(**tool_input)
            case "fetch_social_sentiment":
                return self._social.fetch(**tool_input)
            case "fetch_analyst_ratings":
                return self._analyst.fetch(**tool_input)
            case "fetch_lob_data":
                return self._lob.fetch(**tool_input)
            case _:
                raise ValueError(f"Unknown tool: {tool_name}")

    @staticmethod
    def definitions() -> list[dict]:
        return TOOL_DEFINITIONS