import type { PriceTarget, RiskAssessment } from "../types/models";

interface Props {
  priceTargets:   Record<string, PriceTarget>;
  riskAssessment: RiskAssessment;
}

const PERIOD_LABELS: Record<string, string> = {
  "1_week":   "1 week",
  "1_month":  "1 month",
  "6_months": "6 months",
};

function TrendUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

export default function RiskPanel({ priceTargets, riskAssessment }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

      {/* Price targets */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800
                      bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-none">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
          Price targets
        </p>
        <div className="space-y-3">
          {Object.entries(priceTargets).map(([period, target]) => (
            <div key={period} className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {PERIOD_LABELS[period] ?? period}
              </span>
              <div className="text-right">
                <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-100">
                  ${target.target.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">
                  ${target.range[0].toFixed(0)}–${target.range[1].toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk assessment */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800
                      bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-none space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Risk assessment
        </p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Stop loss</span>
          <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
            ${riskAssessment.stop_loss.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Risk / reward</span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
            {riskAssessment.risk_reward}
          </span>
        </div>

        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="mt-0.5 flex-shrink-0"><TrendUpIcon /></span>
            <p className="leading-relaxed">{riskAssessment.upside}</p>
          </div>
          <div className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
            <span className="mt-0.5 flex-shrink-0"><TrendDownIcon /></span>
            <p className="leading-relaxed">{riskAssessment.downside}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
