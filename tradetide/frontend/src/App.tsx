import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import DashboardPage from "./pages/Dashboard";
import AnalyzePage from "./pages/Analyze";
import HistoryPage from "./pages/History";
import AgentDebatePage from "./pages/AgentDebate";
import ComparePage from "./pages/Compare";
import { useTheme } from "./hooks/useTheme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

const NAV_LINKS = [
  { to: "/",        label: "Home"    },
  { to: "/analyze", label: "Analyze" },
  { to: "/history", label: "History" },
  { to: "/compare", label: "Compare" },
];

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">

        {/* ── Nav ── */}
        <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md
                        border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">

            {/* Brand */}
            <NavLink to="/" className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm tracking-tight">
              Trade<span className="text-slate-900 dark:text-slate-100">Tide</span>
            </NavLink>

            {/* Links */}
            <div className="flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                         hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </nav>

        {/* ── Content ── */}
        <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/"           element={<DashboardPage />}   />
            <Route path="/analyze"    element={<AnalyzePage />}     />
            <Route path="/history"    element={<HistoryPage />}     />
            <Route path="/compare"    element={<ComparePage />}     />
            <Route path="/debate/:id" element={<AgentDebatePage />} />
          </Routes>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6">
          <p className="text-xs text-center text-slate-400 dark:text-slate-600">
            TradeTide — AI-powered market analysis. Not financial advice.
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
