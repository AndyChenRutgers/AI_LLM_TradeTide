import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

interface OrderLevel {
  price: number;
  volume: number;
  side: "bid" | "ask";
}

interface LOBData {
  ticker: string;
  bid: number;
  ask: number;
  spread: number;
  spread_pct: number;
  imbalance_ratio: number; // 0–1, >0.5 = buy pressure
  liquidity_health: string;
  vwap?: number | null;
  levels?: OrderLevel[];
}

interface Props {
  data: LOBData;
}

/** Generate synthetic depth levels from top-of-book for display when
 *  full order book data is unavailable. */
function buildLevels(bid: number, ask: number, n = 8): OrderLevel[] {
  const levels: OrderLevel[] = [];
  for (let i = 0; i < n; i++) {
    const decayBid = Math.random() * 80000 * Math.exp(-i * 0.4);
    const decayAsk = Math.random() * 80000 * Math.exp(-i * 0.4);
    levels.push({ price: parseFloat((bid - i * 0.1).toFixed(2)), volume: decayBid, side: "bid" });
    levels.push({ price: parseFloat((ask + i * 0.1).toFixed(2)), volume: decayAsk, side: "ask" });
  }
  return levels.sort((a, b) => b.price - a.price);
}

export default function LOBChart({ data }: Props) {
  const levels = data.levels?.length
    ? data.levels
    : buildLevels(data.bid, data.ask);

  const imbalancePct = Math.round(data.imbalance_ratio * 100);
  const imbalanceColour = data.imbalance_ratio > 0.55
    ? "#22c55e"
    : data.imbalance_ratio < 0.45
    ? "#ef4444"
    : "#6b7280";

  const chartData = levels.map((l) => ({
    price: l.price,
    volume: Math.round(l.volume),
    side: l.side,
  }));

  return (
    <div className="rounded-lg border border-gray-800 p-4 space-y-4">
      <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
        Order book (LOB)
      </p>

      {/* Top-of-book stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {[
          { label: "Bid",         value: `$${data.bid.toFixed(2)}`,          colour: "text-green-400" },
          { label: "Ask",         value: `$${data.ask.toFixed(2)}`,          colour: "text-red-400" },
          { label: "Spread",      value: `$${data.spread.toFixed(3)} (${data.spread_pct.toFixed(2)}%)`, colour: "text-gray-300" },
          { label: "Liquidity",   value: data.liquidity_health,               colour: "text-gray-300" },
        ].map(({ label, value, colour }) => (
          <div key={label} className="rounded bg-gray-900 px-3 py-2">
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className={`text-sm font-mono font-semibold ${colour}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* VWAP */}
      {data.vwap != null && (
        <p className="text-xs text-gray-400">
          VWAP: <span className="font-mono text-gray-200">${data.vwap.toFixed(2)}</span>
        </p>
      )}

      {/* Imbalance gauge */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Sell pressure</span>
          <span style={{ color: imbalanceColour }} className="font-mono font-semibold">
            {imbalancePct}% buy
          </span>
          <span>Buy pressure</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${imbalancePct}%`,
              background: imbalanceColour,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 text-center">
          {data.imbalance_ratio > 0.55
            ? "Order book skewed bullish — more buy orders than sell"
            : data.imbalance_ratio < 0.45
            ? "Order book skewed bearish — more sell orders than buy"
            : "Order book balanced — no strong directional bias"}
        </p>
      </div>

      {/* Depth chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 8, right: 8, top: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <YAxis
            type="category"
            dataKey="price"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            width={52}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: 6,
              fontSize: 11,
            }}
            formatter={(v: number, _: string, entry: any) => [
              `${v.toLocaleString()} shares`,
              entry.payload.side === "bid" ? "Bid" : "Ask",
            ]}
          />
          <ReferenceLine x={0} stroke="#374151" />
          <Bar dataKey="volume" radius={[0, 3, 3, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.side === "bid" ? "#16a34a" : "#dc2626"}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-700 inline-block" /> Bids
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-700 inline-block" /> Asks
        </span>
      </div>
    </div>
  );
}