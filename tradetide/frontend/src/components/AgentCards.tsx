import type { AgentView, Prediction } from "../types/models";
import { stripMarkdown } from "../utils/stripMarkdown";

const PRED: Record<Prediction, { badge: string; bar: string; dot: string }> = {
  BULLISH: {
    badge: "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700/50 dark:bg-emerald-900/20",
    bar:   "bg-emerald-500",
    dot:   "bg-emerald-500",
  },
  BEARISH: {
    badge: "text-rose-700 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-700/50 dark:bg-rose-900/20",
    bar:   "bg-rose-500",
    dot:   "bg-rose-500",
  },
  NEUTRAL: {
    badge: "text-slate-600 border-slate-200 bg-slate-100 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-800/50",
    bar:   "bg-slate-400 dark:bg-slate-500",
    dot:   "bg-slate-400",
  },
};

const AGENT_ACCENT: Record<string, string> = {
  "Technical Analyst":  "border-l-indigo-500",
  "Sentiment Analyst":  "border-l-violet-500",
  "Macro Economist":    "border-l-cyan-500",
  "Contrarian Analyst": "border-l-amber-500",
};

interface Props {
  views: AgentView[];
}

export default function AgentCards({ views }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {views.map((view) => {
        const p = PRED[view.prediction];
        const accent = AGENT_ACCENT[view.agent] ?? "border-l-slate-400";
        return (
          <div
            key={view.agent}
            className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900
                        border-l-4 ${accent} p-4 space-y-3 shadow-card dark:shadow-none`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {view.agent}
              </span>
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${p.badge}`}>
                {view.prediction}
              </span>
            </div>

            {/* Confidence bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 dark:text-slate-500">Confidence</span>
                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {(view.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${p.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${view.confidence * 100}%` }}
                />
              </div>
            </div>

            {/* Reasoning */}
            {view.reasoning && (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-4">
                {stripMarkdown(view.reasoning)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
