import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";

interface MADataPoint {
  date: string;
  close: number;
  ma40?: number;
  ma60?: number;
  ema40?: number;
  ema60?: number;
}

interface Props {
  data: MADataPoint[];
  /** Optional: mark the crossover date with a vertical reference line */
  crossoverDate?: string;
  crossoverType?: "positive" | "negative";
}

const CROSSOVER_COLOUR: Record<string, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
};

export default function MAChart({ data, crossoverDate, crossoverType }: Props) {
  if (!data.length) return null;

  return (
    <div className="rounded-lg border border-gray-800 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          Moving averages — 40 / 60 day
        </p>
        {crossoverType && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded border"
            style={{
              color: CROSSOVER_COLOUR[crossoverType],
              borderColor: CROSSOVER_COLOUR[crossoverType],
              background: `${CROSSOVER_COLOUR[crossoverType]}18`,
            }}
          >
            {crossoverType === "positive" ? "▲ Bullish crossover" : "▼ Bearish crossover"}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            width={58}
            tickFormatter={(v: number) => `$${v}`}
          />

          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: 6,
              fontSize: 11,
            }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name]}
          />

          <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />

          {/* Crossover marker */}
          {crossoverDate && (
            <ReferenceLine
              x={crossoverDate}
              stroke={crossoverType ? CROSSOVER_COLOUR[crossoverType] : "#6b7280"}
              strokeDasharray="4 2"
              label={{
                value: "X",
                position: "top",
                fontSize: 9,
                fill: crossoverType ? CROSSOVER_COLOUR[crossoverType] : "#6b7280",
              }}
            />
          )}

          {/* Close price */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={1.5}
            name="Close"
          />

          {/* Simple MAs */}
          <Line
            type="monotone"
            dataKey="ma40"
            stroke="#22c55e"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="6 2"
            name="SMA 40"
          />
          <Line
            type="monotone"
            dataKey="ma60"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="6 2"
            name="SMA 60"
          />

          {/* Exponential MAs — lighter, optional */}
          <Line
            type="monotone"
            dataKey="ema40"
            stroke="#86efac"
            dot={false}
            strokeWidth={1}
            strokeDasharray="2 3"
            name="EMA 40"
          />
          <Line
            type="monotone"
            dataKey="ema60"
            stroke="#fcd34d"
            dot={false}
            strokeWidth={1}
            strokeDasharray="2 3"
            name="EMA 60"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <p className="text-xs text-gray-500">
        Dashed lines = SMA · dotted lines = EWMA · vertical marker = crossover point
      </p>
    </div>
  );
}