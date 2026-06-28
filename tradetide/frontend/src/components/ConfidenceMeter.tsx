import type { Prediction } from "../types/models";

interface Props {
  prediction: Prediction;
  confidence: number;
}

const STYLES: Record<Prediction, { bar: string; text: string; glow: string; bg: string }> = {
  BULLISH: {
    bar:  "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    glow: "shadow-emerald-500/20",
    bg:   "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50",
  },
  BEARISH: {
    bar:  "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    glow: "shadow-rose-500/20",
    bg:   "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50",
  },
  NEUTRAL: {
    bar:  "bg-slate-400 dark:bg-slate-500",
    text: "text-slate-600 dark:text-slate-400",
    glow: "shadow-slate-400/10",
    bg:   "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700",
  },
};

export default function ConfidenceMeter({ prediction, confidence }: Props) {
  const s = STYLES[prediction];
  const pct = (confidence * 100).toFixed(0);

  return (
    <div className={`rounded-xl border ${s.bg} p-6 shadow-md ${s.glow}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            Final prediction
          </p>
          <p className={`text-3xl font-bold font-mono tracking-tight ${s.text}`}>
            {prediction}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Confidence</p>
          <p className={`text-3xl font-bold font-mono ${s.text}`}>{pct}%</p>
        </div>
      </div>

      {/* Bar */}
      <div className="h-2 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${s.bar} rounded-full transition-all duration-700`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-slate-400 dark:text-slate-600">0%</span>
        <span className="text-xs text-slate-400 dark:text-slate-600">50%</span>
        <span className="text-xs text-slate-400 dark:text-slate-600">100%</span>
      </div>
    </div>
  );
}
