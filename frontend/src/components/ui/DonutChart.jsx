import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/**
 * DonutChart
 *
 * Generic donut wrapper — used by Membership by Category and Gender
 * Distribution. Just the chart + optional center label; the legend
 * (name/count/%) is built by whichever section uses this, since
 * legend content differs per use case.
 *
 * Props:
 * - data        (array)  [{ name, value, color }]
 * - centerValue (number|string, optional)
 * - centerLabel (string, optional)
 * - height      (number)
 */
export default function DonutChart({ data, centerValue, centerLabel, height = 200 }) {
  return (
    <div className="relative shrink-0" style={{ width: height, height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="65%"
            outerRadius="90%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue !== undefined) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && (
            <span className="text-xl font-semibold text-gray-900">{centerValue}</span>
          )}
          {centerLabel && <span className="text-xs text-gray-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}