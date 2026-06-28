import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLLMStore } from "../state/llmStore";
import { useAnalysisStore } from "../state/analysisStore";
import { useAnalyzeMutation } from "../hooks/useAnalysis";
import { useWebSocket } from "../hooks/useWebSocket";
import LLMSelector from "../components/LLMSelector";
import AgentCards from "../components/AgentCards";
import ConfidenceMeter from "../components/ConfidenceMeter";
import DebatePanel from "../components/DebatePanel";
import RiskPanel from "../components/RiskPanel";
import LLMBadge from "../components/LLMBadge";
import type { AnalyzeRequest } from "../types/models";

type Mode = "rest" | "stream";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {children}
      </p>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [ticker, setTicker] = useState("");
  const [analysisType, setAnalysisType] =
    useState<AnalyzeRequest["analysis_type"]>("comprehensive");
  const [mode, setMode] = useState<Mode>("stream");

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ ticker: string; name: string; exchange: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { config } = useLLMStore();
  const { result, streamedViews, isStreaming, correctionSeen, reset } = useAnalysisStore();
  const mutation = useAnalyzeMutation();
  const { connect, disconnect } = useWebSocket();

  const tickerValid = /^[A-Z]{1,10}$/.test(ticker.toUpperCase());
  const busy = isStreaming || mutation.isPending;

  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await axios.get(`${API}/api/search-ticker`, { params: { q: searchQuery.trim() } });
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  function buildRequest(): AnalyzeRequest {
    return { ticker: ticker.toUpperCase(), analysis_type: analysisType, llm_config: config };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tickerValid || busy) return;
    reset();
    if (mode === "stream") connect(buildRequest());
    else mutation.mutate(buildRequest());
  }

  const error = mutation.error as Error | null;

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analyze</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter a ticker and let the agents debate the trade.
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800
                      bg-white dark:bg-slate-900 p-6 space-y-6 shadow-card dark:shadow-none">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticker + type row */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ticker — e.g. AAPL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                           bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100
                           placeholder:text-slate-400 dark:placeholder:text-slate-500
                           font-mono px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                           transition-colors"
              />
              {ticker && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono
                  ${tickerValid ? "text-emerald-500" : "text-rose-500"}`}>
                  {tickerValid ? "✓" : "invalid"}
                </span>
              )}
            </div>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as AnalyzeRequest["analysis_type"])}
              className="rounded-lg border border-slate-200 dark:border-slate-700
                         bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                         px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                         focus:border-indigo-500 transition-colors"
            >
              <option value="comprehensive">Comprehensive</option>
              <option value="technical">Technical only</option>
              <option value="sentiment">Sentiment only</option>
            </select>
          </div>

          {/* Company name search */}
          {!showSearch ? (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400
                         hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors -mt-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                   strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Search by company name
            </button>
          ) : (
            <div className="space-y-1 -mt-2">
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                     strokeLinecap="round" strokeLinejoin="round"
                     className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                                text-slate-400 dark:text-slate-500 pointer-events-none">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Apple, Tesla, Microsoft…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-indigo-300 dark:border-indigo-600
                             bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100
                             placeholder:text-slate-400 dark:placeholder:text-slate-500
                             pl-9 pr-9 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                             transition-colors"
                />
                <button
                  type="button"
                  onClick={() => { setShowSearch(false); setSearchQuery(""); setSuggestions([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                             hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                       strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Dropdown results */}
              {(searchLoading || searchQuery.trim().length >= 2) && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700
                                bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                  {searchLoading && (
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
                      <div className="w-3 h-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
                      Searching…
                    </div>
                  )}
                  {!searchLoading && suggestions.map((s) => (
                    <button
                      key={s.ticker}
                      type="button"
                      onMouseDown={() => {
                        setTicker(s.ticker);
                        setShowSearch(false);
                        setSearchQuery("");
                        setSuggestions([]);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                                 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                                 border-t border-slate-100 dark:border-slate-800 first:border-t-0"
                    >
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 w-16 flex-shrink-0">
                        {s.ticker}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1">
                        {s.name}
                      </span>
                      {s.exchange && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                          {s.exchange}
                        </span>
                      )}
                    </button>
                  ))}
                  {!searchLoading && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
                    <p className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
                      No results for "{searchQuery}"
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LLM selector */}
          <LLMSelector />

          {/* Mode + submit */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-4">
              {(["stream", "rest"] as Mode[]).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 dark:text-slate-400">
                  <input
                    type="radio" name="mode" value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="accent-indigo-500"
                  />
                  <span>{m === "stream" ? "Stream live" : "Wait for full result"}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              {busy && mode === "stream" && (
                <button
                  type="button" onClick={disconnect}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                             text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100
                             dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!tickerValid || busy}
                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white
                           text-sm font-semibold shadow-sm shadow-indigo-600/20
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {busy ? "Analysing…" : "Run analysis"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-700/50
                        bg-rose-50 dark:bg-rose-900/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          {error.message}
        </div>
      )}

      {/* ── REST loading state ── */}
      {mutation.isPending && (
        <div className="flex flex-col items-center gap-5 py-16">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-indigo-200 dark:border-indigo-900" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Analysing <span className="font-mono text-indigo-600 dark:text-indigo-400">{ticker.toUpperCase()}</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Agents are debating — this usually takes 20–40 seconds.
            </p>
          </div>
        </div>
      )}

      {/* ── Streaming agent cards ── */}
      {!result && streamedViews.length > 0 && (
        <div className="space-y-4">
          <SectionLabel>Agents reporting…</SectionLabel>
          {correctionSeen && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-700/50
                            bg-amber-50 dark:bg-amber-900/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
              Self-correction triggered — investigating contradiction…
            </div>
          )}
          <AgentCards views={streamedViews} />
        </div>
      )}

      {/* ── Full result ── */}
      {result && (
        <div className="space-y-6">

          {/* Result header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {result.ticker}
              </span>
              <LLMBadge provider={result.llm_provider} model={result.llm_model} />
            </div>
            <button
              onClick={() => navigate(`/debate/${result.session_id}`)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400
                         hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Full details
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                   strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <ConfidenceMeter prediction={result.final_prediction} confidence={result.confidence} />

          <div>
            <SectionLabel>Agent views</SectionLabel>
            <AgentCards views={result.agent_views} />
          </div>

          <div>
            <SectionLabel>Debate</SectionLabel>
            <DebatePanel
              views={result.agent_views}
              correctionDetail={result.correction_details}
              consensusStrength={result.consensus_strength}
              minorityOpinion={result.minority_opinion}
            />
          </div>

          <div>
            <SectionLabel>Price targets & risk</SectionLabel>
            <RiskPanel priceTargets={result.price_targets} riskAssessment={result.risk_assessment} />
          </div>
        </div>
      )}
    </div>
  );
}
