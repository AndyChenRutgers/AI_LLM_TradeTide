import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import AgentCards from "../components/AgentCards";
import ConfidenceMeter from "../components/ConfidenceMeter";
import DebatePanel from "../components/DebatePanel";
import RiskPanel from "../components/RiskPanel";
import LLMBadge from "../components/LLMBadge";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import type { AnalysisResponse } from "../types/models";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function useSession(id: string) {
  return useQuery<AnalysisResponse>({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data } = await axios.get<AnalysisResponse>(`${API}/api/session/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

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

export default function AgentDebatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useSession(id!);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading session…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto space-y-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50
                        flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
               strokeLinecap="round" strokeLinejoin="round"
               className="w-5 h-5 text-rose-500">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Session not found</p>
        <button
          onClick={() => navigate("/history")}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400
                     hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
        >
          <BackIcon /> Back to history
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500
                       hover:text-slate-700 dark:hover:text-slate-200
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <BackIcon />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data.ticker}
              </span>
              <LLMBadge provider={data.llm_provider} model={data.llm_model} />
            </div>
          </div>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono flex-shrink-0 pt-1">
          {new Date(data.created_at).toLocaleString(undefined, {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </div>

      {/* ── Prediction ── */}
      <ConfidenceMeter prediction={data.final_prediction} confidence={data.confidence} />

      {/* ── Agent views ── */}
      <section>
        <SectionLabel>Agent views</SectionLabel>
        <AgentCards views={data.agent_views} />
      </section>

      {/* ── Debate ── */}
      <section>
        <SectionLabel>Debate summary</SectionLabel>
        <DebatePanel
          views={data.agent_views}
          correctionDetail={data.correction_details}
          consensusStrength={data.consensus_strength}
          minorityOpinion={data.minority_opinion}
        />
      </section>

      {/* ── Risk ── */}
      <section>
        <SectionLabel>Price targets & risk</SectionLabel>
        <RiskPanel priceTargets={data.price_targets} riskAssessment={data.risk_assessment} />
      </section>

      {/* ── Full reasoning ── */}
      <section>
        <SectionLabel>Full reasoning</SectionLabel>
        <div className="space-y-2">
          {data.agent_views.map((view) => (
            <details
              key={view.agent}
              className="group rounded-xl border border-slate-200 dark:border-slate-800
                         bg-white dark:bg-slate-900 overflow-hidden shadow-card dark:shadow-none"
            >
              <summary
                className="px-5 py-4 cursor-pointer flex items-center justify-between
                           text-sm font-medium text-slate-700 dark:text-slate-200
                           hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none select-none"
              >
                <span>{view.agent}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500
                                 group-open:hidden px-2 py-0.5 rounded-md
                                 bg-slate-100 dark:bg-slate-800">
                  expand
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500
                                 hidden group-open:inline px-2 py-0.5 rounded-md
                                 bg-slate-100 dark:bg-slate-800">
                  collapse
                </span>
              </summary>
              <div className="px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <MarkdownRenderer content={view.reasoning} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
