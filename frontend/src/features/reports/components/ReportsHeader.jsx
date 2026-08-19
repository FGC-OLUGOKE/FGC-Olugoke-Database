import { Printer, FileDown } from "lucide-react";
import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const PERIOD_OPTIONS = [
  "This Month",
  "Last Month",
  "Last 3 Months",
  "Last 6 Months",
  "This Year",
  "Custom Date Range",
];

export default function ReportsHeader({
  period,
  onPeriodChange,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
  onGenerate,
  onPrint,
  onExportAll,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports &amp; Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Insights into church membership, attendance, departments, and demographics over a
          selected period.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:w-56">
            <Select
              label="Report Period"
              options={PERIOD_OPTIONS}
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
            />
          </div>

          {period === "Custom Date Range" && (
            <>
              <div className="w-full sm:w-40">
                <Input
                  label="Start Date"
                  type="date"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-40">
                <Input
                  label="End Date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                />
              </div>
            </>
          )}

          <Button variant="primary" onClick={onGenerate} className="sm:w-auto">
            Generate Report
          </Button>

          <div className="flex gap-2 sm:ml-auto">
            <Button variant="secondary" onClick={onPrint} className="sm:w-auto">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button variant="secondary" onClick={onExportAll} className="sm:w-auto">
              <FileDown className="h-3.5 w-3.5" />
              Export Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}