interface Props {
  provider: string;
  model: string;
}

const STYLES: Record<string, string> = {
  anthropic: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50",
  openai:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50",
  google:    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50",
};

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Claude",
  openai:    "OpenAI",
  google:    "Gemini",
};

export default function LLMBadge({ provider, model }: Props) {
  const style = STYLES[provider] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  const label = PROVIDER_LABELS[provider] ?? provider;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${style}`}>
      <span className="opacity-60">{label}</span>
      <span className="w-px h-3 bg-current opacity-30" />
      <span className="font-mono opacity-80">{model}</span>
    </span>
  );
}
