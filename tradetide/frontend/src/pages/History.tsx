import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHistory } from "../hooks/useAnalysis";
import LLMBadge from "../components/LLMBadge";
import type { Prediction } from "../types/models";

const PRED_STYLE: Record<Prediction, string> = {
  BULLISH: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50",
  BEARISH: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/50",
  NEUTRAL: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
};

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [tickerFilter, setTickerFilter] = useState("");
  const [limit, setLimit] = useState(20);

  const { data, isLoading, refetch } = useHistory(
    tickerFilter.trim().toUpperCase() || undefined,
    limit
  );

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">History</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Past analyses — click any row to view the full debate.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center flex-shrink-0">
          <input
            type="text"
            placeholder="Filter ticker"
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value.toUpperCase())}
            className="w-36 rounded-lg border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                       placeholder:text-slate-400 dark:placeholder:text-slate-500
                       font-mono px-3 py-2 text-sm focus:outline-none focus:ring-2
                       focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
          />
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                       px-3 py-2 text-sm focus:outline-none focus:ring-2
                       focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} results</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700
                       text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden
                      shadow-card dark:shadow-none">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              {["#", "Ticker", "Prediction", "Confidence", "Model", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                       text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">

            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                </td>
              </tr>
            )}

            {data?.map((row) => (
              <tr
                key={row.session_id}
                onClick={() => navigate(`/debate/${row.session_id}`)}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3.5 font-mono text-xs text-slate-400 dark:text-slate-600">
                  {row.session_id}
                </td>
                <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                  {row.ticker}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${PRED_STYLE[row.final_prediction]}`}>
                    {row.final_prediction}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${row.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {(row.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <LLMBadge provider={row.llm_provider} model={row.llm_model} />
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {new Date(row.created_at).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </td>
              </tr>
            ))}

            {!isLoading && !data?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                  No results{tickerFilter ? ` for "${tickerFilter}"` : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
