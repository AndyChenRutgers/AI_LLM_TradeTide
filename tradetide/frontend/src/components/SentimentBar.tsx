import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface Props {
  scores: Record<string, number>;
  overall: number;
}

export default function SentimentBar({ scores, overall }: Props) {
  const data = Object.entries(scores).map(([source, score]) => ({
    source: source.charAt(0).toUpperCase() + source.slice(1),
    score: parseFloat((score * 100).toFixed(1)),
  }));

  const overallColour =
    overall > 0.6 ? "#10b981" : overall < 0.4 ? "#ef4444" : "#6b7280";

  return (
    <div className="rounded-lg border border-gray-800 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Sentiment</p>
        <span className="text-sm font-mono" style={{ color: overallColour }}>
          {(overall * 100).toFixed(0)}% overall
        </span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7280" }} unit="%" />
          <YAxis type="category" dataKey="source" tick={{ fontSize: 11, fill: "#9ca3af" }} width={55} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6 }}
            formatter={(v: number) => [`${v}%`]}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.source}
                fill={entry.score > 60 ? "#10b981" : entry.score < 40 ? "#ef4444" : "#6b7280"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}