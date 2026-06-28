import type { AgentView, CorrectionDetail, Prediction } from "../types/models";

interface Props {
  views:             AgentView[];
  correctionDetail:  CorrectionDetail | null;
  consensusStrength: number;
  minorityOpinion:   string | null;
}

const VOTE_STYLES: Record<Prediction, { dot: string; text: string }> = {
  BULLISH: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  BEARISH: { dot: "bg-rose-500",    text: "text-rose-600 dark:text-rose-400"       },
  NEUTRAL: { dot: "bg-slate-400",   text: "text-slate-500 dark:text-slate-400"     },
};

export default function DebatePanel({ views, correctionDetail, consensusStrength, minorityOpinion }: Props) {
  const counts = views.reduce(
    (acc, v) => ({ ...acc, [v.prediction]: (acc[v.prediction] ?? 0) + 1 }),
    {} as Record<Prediction, number>
  );

  const pct = (consensusStrength * 100).toFixed(0);
  const consensusColor =
    consensusStrength >= 0.75 ? "bg-emerald-500" :
    consensusStrength >= 0.5  ? "bg-amber-500"   : "bg-rose-500";

  return (
    <div className="space-y-3">

      {/* Vote tally + consensus */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800
                      bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-none">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
          Debate summary
        </p>

        {/* Vote pills */}
        <div className="flex flex-wrap gap-3 mb-5">
          {(["BULLISH", "BEARISH", "NEUTRAL"] as Prediction[]).map((pred) => {
            const s = VOTE_STYLES[pred];
            const n = counts[pred] ?? 0;
            return (
              <div key={pred}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full
                           bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className={`text-xs font-semibold ${s.text}`}>{pred}</span>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{n}</span>
              </div>
            );
          })}
        </div>

        {/* Consensus bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">Consensus strength</span>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${consensusColor} rounded-full transition-all duration-700`}
              style={{ width: `${consensusStrength * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Self-correction */}
      {correctionDetail && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-700/50
                        bg-amber-50 dark:bg-amber-900/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                 strokeLinecap="round" strokeLinejoin="round"
                 className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Self-correction — {correctionDetail.contradiction_type}
            </p>
          </div>
          <p className="text-xs text-amber-600/80 dark:text-amber-200/60 leading-relaxed pl-6">
            {correctionDetail.resolution}
          </p>
        </div>
      )}

      {/* Minority opinion */}
      {minorityOpinion && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700
                        bg-slate-50 dark:bg-slate-800/40 p-4 space-y-1.5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Minority view
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {minorityOpinion}
          </p>
        </div>
      )}
    </div>
  );
}
