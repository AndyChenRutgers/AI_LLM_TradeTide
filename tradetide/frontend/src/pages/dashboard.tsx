import { useNavigate } from "react-router-dom";

// ─── SVG icons ───────────────────────────────────────────────────────────────

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconNewspaper() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconContrarian() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M7 16V4m0 0L3 8m4-4 4 4" />
      <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    name: "Technical Analyst",
    accent: "indigo",
    icon: <IconChart />,
    tagline: "Price action & momentum",
    description:
      "Reads historical price data through MA crossovers, RSI, MACD, and Bollinger Bands to detect momentum shifts and trend continuations.",
    tools: ["40/60-day MA crossover", "RSI & MACD", "Bollinger Bands"],
  },
  {
    name: "Sentiment Analyst",
    accent: "violet",
    icon: <IconNewspaper />,
    tagline: "Market mood & narratives",
    description:
      "Aggregates news flow, social-media pulse, and institutional analyst ratings over a 30-day window to gauge whether the market narrative is constructive or deteriorating.",
    tools: ["News aggregation", "Social sentiment", "Analyst ratings"],
  },
  {
    name: "Macro Economist",
    accent: "cyan",
    icon: <IconGlobe />,
    tagline: "Macro environment & cycles",
    description:
      "Maps Fed policy stances, interest-rate decisions, inflation prints, and sector events to the stock's risk profile — placing the trade in its macro context.",
    tools: ["Fed & rate decisions", "Inflation & GDP", "Sector events"],
  },
  {
    name: "Contrarian Analyst",
    accent: "amber",
    icon: <IconContrarian />,
    tagline: "Hidden risks & opposing views",
    description:
      "Reads the order book for hidden selling pressure and actively argues the opposite of the emerging consensus — surfacing what the crowd might be missing.",
    tools: ["Order book imbalance", "Hidden sell pressure", "Consensus stress-test"],
  },
];

// All classes written out fully so Tailwind picks them up at build time
const ACCENT: Record<string, {
  iconBg: string; iconText: string; border: string;
  badgeLight: string; badgeDark: string;
}> = {
  indigo: {
    iconBg:    "bg-indigo-50 dark:bg-indigo-500/10",
    iconText:  "text-indigo-600 dark:text-indigo-400",
    border:    "border-indigo-200 dark:border-indigo-500/30",
    badgeLight: "bg-indigo-50 text-indigo-700 border-indigo-200",
    badgeDark:  "dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20",
  },
  violet: {
    iconBg:    "bg-violet-50 dark:bg-violet-500/10",
    iconText:  "text-violet-600 dark:text-violet-400",
    border:    "border-violet-200 dark:border-violet-500/30",
    badgeLight: "bg-violet-50 text-violet-700 border-violet-200",
    badgeDark:  "dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
  },
  cyan: {
    iconBg:    "bg-cyan-50 dark:bg-cyan-500/10",
    iconText:  "text-cyan-600 dark:text-cyan-400",
    border:    "border-cyan-200 dark:border-cyan-500/30",
    badgeLight: "bg-cyan-50 text-cyan-700 border-cyan-200",
    badgeDark:  "dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20",
  },
  amber: {
    iconBg:    "bg-amber-50 dark:bg-amber-500/10",
    iconText:  "text-amber-600 dark:text-amber-400",
    border:    "border-amber-200 dark:border-amber-500/30",
    badgeLight: "bg-amber-50 text-amber-700 border-amber-200",
    badgeDark:  "dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  },
};

const STEPS = [
  {
    label: "Pick a ticker",
    detail: "Enter any US-listed symbol and choose your analysis depth.",
  },
  {
    label: "Agents analyse independently",
    detail: "All four agents run in sequence, each pulling its own data sources.",
  },
  {
    label: "Debate & self-correction",
    detail: "Contradictions trigger an investigation round before consensus is formed.",
  },
  {
    label: "Receive your report",
    detail: "Get a prediction, confidence score, price targets, and full reasoning per agent.",
  },
];

const MODES = [
  { icon: <IconLayers />, name: "Comprehensive", desc: "All four agents, full cross-source synthesis." },
  { icon: <IconChart />,  name: "Technical",     desc: "Price-only analysis — fastest turnaround." },
  { icon: <IconTarget />, name: "Sentiment",     desc: "News, social, and analyst-rating focus." },
];

const CAPABILITIES = [
  { icon: <IconShield />, label: "Self-correcting" },
  { icon: <IconLayers />, label: "Multi-source"    },
  { icon: <IconTarget />, label: "Confidence-rated" },
];

// ─── Component ────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 flex-shrink-0">
        {children}
      </h2>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-8">

      {/* ── Hero ── */}
      <div className="relative text-center space-y-6 px-4">
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-52 rounded-full bg-indigo-500/8 dark:bg-indigo-500/10 blur-3xl" />
        </div>

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        border border-indigo-200 dark:border-indigo-500/30
                        bg-indigo-50 dark:bg-indigo-500/10
                        text-indigo-600 dark:text-indigo-300 text-xs font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          AI-powered market intelligence
        </div>

        {/* Wordmark */}
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Trade<span className="text-indigo-600 dark:text-indigo-400">Tide</span>
        </h1>

        <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
          Four specialised AI agents debate the market, challenge each other's
          assumptions, and synthesise a consensus view — so you get reasoning,
          not just a signal.
        </p>

        {/* Capability tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {CAPABILITIES.map(({ icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                         bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                         text-slate-500 dark:text-slate-400"
            >
              <span className="text-slate-400 dark:text-slate-500">{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Agent roster ── */}
      <section className="space-y-5">
        <SectionHeading>The agents</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AGENTS.map((agent) => {
            const a = ACCENT[agent.accent];
            return (
              <div
                key={agent.name}
                className="rounded-xl border border-slate-200 dark:border-slate-800
                           bg-white dark:bg-slate-900 p-5 space-y-4
                           hover:border-slate-300 dark:hover:border-slate-700
                           hover:shadow-md dark:hover:shadow-none
                           transition-all duration-200 shadow-card dark:shadow-none"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${a.iconBg} ${a.border} ${a.iconText}`}>
                    {agent.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                      {agent.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${a.iconText} opacity-80`}>
                      {agent.tagline}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {agent.description}
                </p>

                {/* Tool pills */}
                <div className="flex flex-wrap gap-1.5">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium
                                  ${a.badgeLight} ${a.badgeDark}`}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="space-y-5">
        <SectionHeading>How it works</SectionHeading>
        <div className="relative pl-7">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
          {STEPS.map((step, i) => (
            <div key={i} className="relative flex gap-5 pb-8 last:pb-0">
              <div className="flex-shrink-0 w-[22px] h-[22px] rounded-full mt-0.5 z-10
                              bg-white dark:bg-slate-950
                              border-2 border-indigo-400 dark:border-indigo-500/60
                              flex items-center justify-center">
                <span className="text-[9px] font-bold font-mono text-indigo-500 dark:text-indigo-400">
                  {i + 1}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Analysis modes ── */}
      <section className="space-y-5">
        <SectionHeading>Analysis modes</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODES.map(({ icon, name, desc }) => (
            <div
              key={name}
              className="rounded-xl border border-slate-200 dark:border-slate-800
                         bg-white dark:bg-slate-900 p-5 space-y-2.5
                         hover:border-slate-300 dark:hover:border-slate-700 transition-colors
                         shadow-card dark:shadow-none"
            >
              <div className="text-slate-400 dark:text-slate-500">{icon}</div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col items-center gap-3 py-4">
        <button
          onClick={() => navigate("/analyze")}
          className="group flex items-center gap-2.5 px-8 py-3.5
                     bg-indigo-600 hover:bg-indigo-500 text-white
                     text-sm font-semibold rounded-xl transition-all duration-200
                     shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
        >
          Run an analysis
          <span className="group-hover:translate-x-0.5 transition-transform duration-150">
            <IconArrowRight />
          </span>
        </button>
        <button
          onClick={() => navigate("/history")}
          className="text-xs text-slate-400 hover:text-slate-700 dark:text-slate-500
                     dark:hover:text-slate-300 transition-colors"
        >
          View past analyses →
        </button>
      </section>

    </div>
  );
}
