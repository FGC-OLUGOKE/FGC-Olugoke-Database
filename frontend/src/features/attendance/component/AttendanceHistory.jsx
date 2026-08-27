import Badge from "../../../components/ui/Badge";

const columns = [
  ["adults", "Adult"],
  ["youth", "Youth"],
  ["teenagers", "Teenager"],
  ["children", "Children"],
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AttendanceHistory({ records, categoryKey }) {
  const visibleColumns = categoryKey
    ? columns.filter(([key]) => key === categoryKey)
    : columns;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-[520px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Date</th>
            {visibleColumns.map(([, label]) => (
              <th key={label} className="px-4 py-3 text-center">{label}</th>
            ))}
            {!categoryKey && <th className="px-4 py-3 text-center">Total</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {records.map((record) => (
            <tr key={`${record.date}-${record.id ?? "attendance"}`} className="hover:bg-gray-50/60">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {formatDate(record.date)}
              </td>
              {visibleColumns.map(([key, label]) => (
                <td key={label} className="px-4 py-3 text-center text-gray-700">
                  {Number(record[key]) || 0}
                </td>
              ))}
              {!categoryKey && (
                <td className="px-4 py-3 text-center">
                  <Badge tone="info">{Number(record.total) || 0}</Badge>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
