import { useEffect } from "react";
import { useLLMProviders } from "../hooks/useAnalysis";
import { useLLMStore } from "../state/llmStore";
import type { LLMProvider } from "../types/models";

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  anthropic: "Claude",
  openai:    "OpenAI",
  google:    "Gemini",
};

const PROVIDER_STYLES: Record<LLMProvider, { active: string; idle: string }> = {
  anthropic: {
    active: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60",
    idle:   "text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60",
  },
  openai: {
    active: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60",
    idle:   "text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60",
  },
  google: {
    active: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60",
    idle:   "text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60",
  },
};

export default function LLMSelector() {
  const { data } = useLLMProviders();
  const { config, setProvider, setModel, setTemp, setMaxTokens } = useLLMStore();

  const activeProvider = data?.providers.find((p) => p.provider === config.provider);

  useEffect(() => {
    if (!activeProvider?.models.length) return;
    const valid = activeProvider.models.map((m) => m.llm_model);
    if (!config.llm_model || !valid.includes(config.llm_model)) {
      setModel(activeProvider.models[0].llm_model);
    }
  }, [activeProvider, config.llm_model, setModel]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800
                    bg-white dark:bg-slate-900 p-5 space-y-5 shadow-card dark:shadow-none">
      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Model
      </p>

      {/* Provider tabs */}
      <div className="flex gap-2">
        {(["anthropic", "openai", "google"] as LLMProvider[]).map((p) => {
          const s = PROVIDER_STYLES[p];
          return (
            <button
              key={p}
              onClick={() => {
                setProvider(p);
                const providerData = data?.providers.find((pr) => pr.provider === p);
                if (providerData?.models.length) setModel(providerData.models[0].llm_model);
              }}
              className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                config.provider === p ? s.active : s.idle
              }`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          );
        })}
      </div>

      {/* Model dropdown */}
      {activeProvider && (
        <select
          value={config.llm_model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                     bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                     px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                     focus:border-indigo-500 transition-colors"
        >
          {activeProvider.models.map((m) => (
            <option key={m.llm_model} value={m.llm_model}>{m.display_name}</option>
          ))}
        </select>
      )}

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-5">
        <label className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Temperature</span>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              {config.temperature}
            </span>
          </div>
          <input
            type="range" min={0} max={2} step={0.1}
            value={config.temperature}
            onChange={(e) => setTemp(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </label>
        <label className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Max tokens</span>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              {config.max_token}
            </span>
          </div>
          <input
            type="range" min={256} max={4096} step={256}
            value={config.max_token}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </label>
      </div>
    </div>
  );
}
