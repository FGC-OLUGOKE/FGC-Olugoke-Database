import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * DonutChart
 *
 * Generic donut wrapper — used by Membership by Category and Gender
 * Distribution.
 *
 * Props:
 * - data        (array)   [{ name, value, color }]
 * - centerValue (number|string, optional)
 * - centerLabel (string, optional)
 * - height      (number)
 */
export default function DonutChart({
  data,
  centerValue,
  centerLabel,
  height = 200,
}) {
  return (
    <div
      className="
        relative shrink-0
        outline-none
        focus:outline-none
        [&_.recharts-wrapper]:outline-none
        [&_.recharts-wrapper]:focus:outline-none
        [&_.recharts-wrapper]:focus-visible:outline-none
        [&_.recharts-surface]:outline-none
        [&_.recharts-surface]:focus:outline-none
        [&_.recharts-surface]:focus-visible:outline-none
        [&_.recharts-surface]:focus:ring-0
      "
      style={{
        width: height,
        height,
        outline: "none",
      }}
      tabIndex={-1}
    >
      {/* Chart layer */}
      <div className="absolute inset-0 z-20">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
              style={{ outline: "none" }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  stroke="none"
                  style={{ outline: "none" }}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              }}
              wrapperStyle={{
                zIndex: 100,
                outline: "none",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center text layer */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
        {centerValue !== undefined && (
          <span className="text-xl font-semibold text-gray-900">
            {centerValue}
          </span>
        )}

        {centerLabel && (
          <span className="text-xs text-gray-500">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}