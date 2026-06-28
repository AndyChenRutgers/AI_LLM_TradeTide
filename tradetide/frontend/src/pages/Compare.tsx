import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useHistory } from "../hooks/useAnalysis";
import LLMBadge from "../components/LLMBadge";
import type { AnalysisResponse, HistoryRecord, Prediction } from "../types/models";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function useSession(id: number | null) {
  return useQuery<AnalysisResponse>({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data } = await axios.get<AnalysisResponse>(`${API}/api/session/${id}`);
      return data;
    },
    enabled: id !== null,
  });
}

const PRED_STYLE: Record<Prediction, string> = {
  BULLISH: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
  BEARISH:  "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/50",
  NEUTRAL:  "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
};

const PRED_BAR: Record<Prediction, string> = {
  BULLISH: "bg-emerald-500",
  BEARISH:  "bg-rose-500",
  NEUTRAL:  "bg-slate-400 dark:bg-slate-500",
};

const AGENT_ORDER = [
  "Technical Analyst",
  "Sentiment Analyst",
  "Macro Economist",
  "Contrarian Analyst",
];

const AGENT_DOT: Record<string, string> = {
  "Technical Analyst":  "bg-indigo-500",
  "Sentiment Analyst":  "bg-violet-500",
  "Macro Economist":    "bg-cyan-500",
  "Contrarian Analyst": "bg-amber-500",
};

const PRICE_TARGET_KEYS: Array<[string, string]> = [
  ["1 Week",    "1_week"],
  ["1 Month",   "1_month"],
  ["6 Months",  "6_months"],
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function CompareRow({
  label,
  children,
  shaded,
  dot,
}: {
  label: string;
  children: React.ReactNode;
  shaded?: boolean;
  dot?: string;
}) {
  return (
    <div
      className={`grid grid-cols-[160px_1fr_1fr] ${
        shaded ? "bg-slate-50 dark:bg-slate-800/30" : "bg-white dark:bg-slate-900"
      } border-b border-slate-100 dark:border-slate-800 last:border-b-0`}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-r border-slate-100 dark:border-slate-800">
        {dot && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 last:border-r-0 flex items-center min-w-0">
      {children}
    </div>
  );
}

function ConfBar({ value, prediction }: { value: number; prediction: Prediction }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${PRED_BAR[prediction]} rounded-full`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

// ── Session picker ────────────────────────────────────────────────────────────

function SessionPicker({
  label,
  tickerFilter,
  onTickerChange,
  selectedId,
  onSelect,
  history,
  isLoading,
}: {
  label: string;
  tickerFilter: string;
  onTickerChange: (t: string) => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  history: HistoryRecord[] | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900
                    p-4 space-y-3 shadow-card dark:shadow-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </span>
        {selectedId !== null && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-slate-400 hover:text-rose-500 dark:text-slate-500
                       dark:hover:text-rose-400 transition-colors"
          >
            clear
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Filter by ticker…"
        value={tickerFilter}
        onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                   bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100
                   placeholder:text-slate-400 dark:placeholder:text-slate-500
                   font-mono px-3 py-2 text-sm focus:outline-none focus:ring-2
                   focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
      />

      <select
        value={selectedId ?? ""}
        onChange={(e) => onSelect(e.target.value !== "" ? Number(e.target.value) : null)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                   bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                   px-3 py-2 text-sm focus:outline-none focus:ring-2
                   focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
      >
        <option value="">— Select a session —</option>
        {history?.map((row) => (
          <option key={row.session_id} value={row.session_id}>
            {row.ticker} · {row.final_prediction} {(row.confidence * 100).toFixed(0)}% ·{" "}
            {new Date(row.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </option>
        ))}
      </select>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <div className="w-3 h-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
          Loading…
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [tickerA, setTickerA] = useState("");
  const [tickerB, setTickerB] = useState("");
  const [idA, setIdA] = useState<number | null>(null);
  const [idB, setIdB] = useState<number | null>(null);

  const histA = useHistory(tickerA || undefined, 50);
  const histB = useHistory(tickerB || undefined, 50);
  const sessA = useSession(idA);
  const sessB = useSession(idB);

  const a = sessA.data;
  const b = sessB.data;
  const bothLoaded = !!a && !!b;
  const anyLoading = sessA.isLoading || sessB.isLoading;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Compare</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Select two analyses from history to compare side by side.
        </p>
      </div>

      {/* ── Pickers ── */}
      <div className="grid grid-cols-2 gap-4">
        <SessionPicker
          label="Analysis A"
          tickerFilter={tickerA}
          onTickerChange={setTickerA}
          selectedId={idA}
          onSelect={setIdA}
          history={histA.data}
          isLoading={histA.isLoading}
        />
        <SessionPicker
          label="Analysis B"
          tickerFilter={tickerB}
          onTickerChange={setTickerB}
          selectedId={idB}
          onSelect={setIdB}
          history={histB.data}
          isLoading={histB.isLoading}
        />
      </div>

      {/* ── Loading spinner ── */}
      {anyLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* ── Prompt states ── */}
      {!anyLoading && !bothLoaded && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
          {idA && !idB
            ? "Select a second analysis to compare."
            : !idA && idB
            ? "Select a first analysis to compare."
            : "Select two analyses above to start comparing."}
        </div>
      )}

      {/* ── Comparison ── */}
      {bothLoaded && (
        <div className="space-y-8">

          {/* Column headers */}
          <div className="grid grid-cols-[160px_1fr_1fr] gap-0 px-0">
            <div />
            <div className="px-4 text-center space-y-1">
              <div className="font-mono font-bold text-xl text-slate-900 dark:text-slate-100">
                {a.ticker}
              </div>
              <LLMBadge provider={a.llm_provider} model={a.llm_model} />
            </div>
            <div className="px-4 text-center space-y-1">
              <div className="font-mono font-bold text-xl text-slate-900 dark:text-slate-100">
                {b.ticker}
              </div>
              <LLMBadge provider={b.llm_provider} model={b.llm_model} />
            </div>
          </div>

          {/* ── Summary ── */}
          <section>
            <SectionLabel>Summary</SectionLabel>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800
                            overflow-hidden shadow-card dark:shadow-none">
              <CompareRow label="Date">
                <Cell>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {new Date(a.created_at).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </Cell>
                <Cell>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {new Date(b.created_at).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </Cell>
              </CompareRow>

              <CompareRow label="Prediction" shaded>
                <Cell>
                  <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${PRED_STYLE[a.final_prediction]}`}>
                    {a.final_prediction}
                  </span>
                </Cell>
                <Cell>
                  <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${PRED_STYLE[b.final_prediction]}`}>
                    {b.final_prediction}
                  </span>
                </Cell>
              </CompareRow>

              <CompareRow label="Confidence">
                <Cell><ConfBar value={a.confidence} prediction={a.final_prediction} /></Cell>
                <Cell><ConfBar value={b.confidence} prediction={b.final_prediction} /></Cell>
              </CompareRow>

              <CompareRow label="Consensus" shaded>
                <Cell><ConfBar value={a.consensus_strength} prediction={a.final_prediction} /></Cell>
                <Cell><ConfBar value={b.consensus_strength} prediction={b.final_prediction} /></Cell>
              </CompareRow>

              <CompareRow label="Self-correction">
                <Cell>
                  {a.self_correction_applied
                    ? <span className="text-xs font-mono text-amber-600 dark:text-amber-400">Applied</span>
                    : <span className="text-xs font-mono text-slate-400 dark:text-slate-500">None</span>}
                </Cell>
                <Cell>
                  {b.self_correction_applied
                    ? <span className="text-xs font-mono text-amber-600 dark:text-amber-400">Applied</span>
                    : <span className="text-xs font-mono text-slate-400 dark:text-slate-500">None</span>}
                </Cell>
              </CompareRow>
            </div>
          </section>

          {/* ── Agent views ── */}
          <section>
            <SectionLabel>Agent Views</SectionLabel>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800
                            overflow-hidden shadow-card dark:shadow-none">
              {AGENT_ORDER.map((agentName, i) => {
                const va = a.agent_views.find((v) => v.agent === agentName);
                const vb = b.agent_views.find((v) => v.agent === agentName);
                return (
                  <CompareRow
                    key={agentName}
                    label={agentName}
                    shaded={i % 2 === 1}
                    dot={AGENT_DOT[agentName]}
                  >
                    <Cell>
                      {va ? (
                        <div className="space-y-1.5">
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${PRED_STYLE[va.prediction]}`}>
                            {va.prediction}
                          </span>
                          <ConfBar value={va.confidence} prediction={va.prediction} />
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                      )}
                    </Cell>
                    <Cell>
                      {vb ? (
                        <div className="space-y-1.5">
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${PRED_STYLE[vb.prediction]}`}>
                            {vb.prediction}
                          </span>
                          <ConfBar value={vb.confidence} prediction={vb.prediction} />
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                      )}
                    </Cell>
                  </CompareRow>
                );
              })}
            </div>
          </section>

          {/* ── Price targets ── */}
          <section>
            <SectionLabel>Price Targets</SectionLabel>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800
                            overflow-hidden shadow-card dark:shadow-none">
              {PRICE_TARGET_KEYS.map(([label, key], i) => {
                const pa = a.price_targets[key];
                const pb = b.price_targets[key];
                return (
                  <CompareRow key={key} label={label} shaded={i % 2 === 1}>
                    <Cell>
                      {pa ? (
                        <span className="font-mono text-sm text-slate-800 dark:text-slate-100">
                          ${pa.target.toFixed(2)}{" "}
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            [${pa.range[0].toFixed(2)}–${pa.range[1].toFixed(2)}]
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                      )}
                    </Cell>
                    <Cell>
                      {pb ? (
                        <span className="font-mono text-sm text-slate-800 dark:text-slate-100">
                          ${pb.target.toFixed(2)}{" "}
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            [${pb.range[0].toFixed(2)}–${pb.range[1].toFixed(2)}]
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                      )}
                    </Cell>
                  </CompareRow>
                );
              })}
            </div>
          </section>

          {/* ── Risk assessment ── */}
          <section>
            <SectionLabel>Risk Assessment</SectionLabel>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800
                            overflow-hidden shadow-card dark:shadow-none">
              <CompareRow label="Stop Loss">
                <Cell>
                  <span className="font-mono text-sm text-rose-600 dark:text-rose-400">
                    ${a.risk_assessment.stop_loss.toFixed(2)}
                  </span>
                </Cell>
                <Cell>
                  <span className="font-mono text-sm text-rose-600 dark:text-rose-400">
                    ${b.risk_assessment.stop_loss.toFixed(2)}
                  </span>
                </Cell>
              </CompareRow>

              <CompareRow label="Risk / Reward" shaded>
                <Cell>
                  <span className="font-mono text-sm text-slate-800 dark:text-slate-100">
                    {a.risk_assessment.risk_reward}
                  </span>
                </Cell>
                <Cell>
                  <span className="font-mono text-sm text-slate-800 dark:text-slate-100">
                    {b.risk_assessment.risk_reward}
                  </span>
                </Cell>
              </CompareRow>

              <CompareRow label="Upside scenario">
                <Cell>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {a.risk_assessment.upside}
                  </p>
                </Cell>
                <Cell>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {b.risk_assessment.upside}
                  </p>
                </Cell>
              </CompareRow>

              <CompareRow label="Downside scenario" shaded>
                <Cell>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {a.risk_assessment.downside}
                  </p>
                </Cell>
                <Cell>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {b.risk_assessment.downside}
                  </p>
                </Cell>
              </CompareRow>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
