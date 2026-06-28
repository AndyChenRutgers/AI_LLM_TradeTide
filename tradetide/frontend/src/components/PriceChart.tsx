import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface OHLCVRow {
  date: string;
  close: number;
  ma40?: number;
  ma60?: number;
}

interface Props {
  data: OHLCVRow[];
}

export default function PriceChart({ data }: Props) {
  if (!data.length) return null;

  return (
    <div className="rounded-lg border border-gray-800 p-4">
      <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
        Price + moving averages
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={(v) => v.slice(5)}  // show MM-DD
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            width={55}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6 }}
            labelStyle={{ color: "#9ca3af", fontSize: 11 }}
            itemStyle={{ fontSize: 11 }}
            formatter={(v: number) => [`$${v.toFixed(2)}`]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
          <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} strokeWidth={1.5} name="Close" />
          <Line type="monotone" dataKey="ma40"  stroke="#10b981" dot={false} strokeWidth={1} strokeDasharray="4 2" name="MA 40" />
          <Line type="monotone" dataKey="ma60"  stroke="#f59e0b" dot={false} strokeWidth={1} strokeDasharray="4 2" name="MA 60" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}