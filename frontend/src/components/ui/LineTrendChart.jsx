import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/**
 * LineTrendChart
 *
 * Generic line chart wrapper — used by Membership Growth, Attendance
 * Overview's trend chart, and Category Growth & Trends. `lines`
 * supports multiple series; a legend automatically appears whenever
 * more than one line is passed (single-series charts stay legend-free
 * to avoid unnecessary clutter — the chart title already says what
 * the one line is).
 *
 * Props:
 * - data   (array)   e.g. [{ month: "Jan", total: 3 }, ...]
 * - xKey   (string)  the data key for the X axis
 * - lines  (array)   [{ dataKey, color, label }]
 * - height (number)
 */
export default function LineTrendChart({ data, xKey, lines, height = 240 }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            labelStyle={{ fontWeight: 600, color: "#111827" }}
          />
          {lines.length > 1 && (
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          )}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.label ?? line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}