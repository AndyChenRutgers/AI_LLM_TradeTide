import Markdown from "react-markdown";
import type { Components } from "react-markdown";

// Detect block vs inline code: block code contains newlines or has a language class
function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const raw = String(children ?? "").replace(/\n$/, "");
  const isBlock = raw.includes("\n") || Boolean(className?.startsWith("language-"));

  if (isBlock) {
    return (
      <pre className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                      p-4 my-3 overflow-x-auto">
        <code className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre leading-relaxed">
          {raw}
        </code>
      </pre>
    );
  }

  return (
    <code className="font-mono text-xs px-1.5 py-0.5 rounded-md
                     bg-slate-100 dark:bg-slate-800
                     text-indigo-600 dark:text-indigo-400
                     border border-slate-200 dark:border-slate-700">
      {children}
    </code>
  );
}

const COMPONENTS: Components = {
  // ── Headings ────────────────────────────────────────────────────────────
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-5 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-4 mb-2 first:mt-0
                   pb-1.5 border-b border-slate-200 dark:border-slate-800">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-3 mb-1.5 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2 mb-1 first:mt-0">
      {children}
    </h4>
  ),

  // ── Body text ────────────────────────────────────────────────────────────
  p: ({ children }) => (
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 last:mb-0">
      {children}
    </p>
  ),

  // ── Lists ────────────────────────────────────────────────────────────────
  ul: ({ children }) => (
    <ul className="my-2 space-y-1 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 space-y-1 pl-1 list-none counter-reset-item">{children}</ol>
  ),
  li: ({ children, ...props }) => {
    // Detect ordered list by checking if parent is ol via props
    const ordered = (props as { ordered?: boolean }).ordered;
    return (
      <li className="flex gap-2.5 items-baseline text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <span className={`flex-shrink-0 mt-[3px] ${
          ordered
            ? "font-mono text-xs text-indigo-500 dark:text-indigo-400"
            : "w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-[6px]"
        }`}>
          {ordered ? `${(props as { index?: number }).index ?? 0 + 1}.` : ""}
        </span>
        <span className="flex-1 min-w-0">{children}</span>
      </li>
    );
  },

  // ── Inline formatting ─────────────────────────────────────────────────────
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-800 dark:text-slate-200">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-600 dark:text-slate-300">{children}</em>
  ),

  // ── Code ─────────────────────────────────────────────────────────────────
  // pre wraps block code — pass through so code handles all styling
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => (
    <CodeBlock className={className}>{children}</CodeBlock>
  ),

  // ── Misc ─────────────────────────────────────────────────────────────────
  hr: () => (
    <hr className="my-4 border-slate-200 dark:border-slate-800" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-indigo-400 dark:border-indigo-500 pl-4 my-3
                           text-slate-500 dark:text-slate-400 italic">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2
                  hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300
                   border border-slate-200 dark:border-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-slate-600 dark:text-slate-400
                   border border-slate-200 dark:border-slate-700">
      {children}
    </td>
  ),
};

interface Props {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: Props) {
  return (
    <div className={`min-w-0 ${className}`}>
      <Markdown components={COMPONENTS}>{content}</Markdown>
    </div>
  );
}
