import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function LineTrendChart({
  data,
  xKey,
  lines,
  height = 240,
}) {
  return (
    <div
      className="
        w-full
        outline-none
        focus:outline-none
        [&_svg]:outline-none
        [&_svg:focus]:outline-none
      "
      style={{ height }}
    >
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 8,
            right: 8,
            left: -16,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f3f4f6"
            vertical={false}
          />

          <XAxis
            dataKey={xKey}
            tick={{
              fontSize: 12,
              fill: "#6b7280",
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fontSize: 12,
              fill: "#6b7280",
            }}
            axisLine={false}
            tickLine={false}
            width={32}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
            }}
            labelStyle={{
              fontWeight: 600,
              color: "#111827",
            }}
          />

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