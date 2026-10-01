import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, History, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ExportButton from "../../components/ui/ExportButton";
import LoadingState from "../../components/ui/LoadingState";
import SectionCard from "../../components/ui/SectionCard";
import { getCached } from "../../lib/apiClient";
import { exportToCsv, exportToExcel, printReport } from "../../lib/exportUtils";
import { getMembers } from "../members/api";
import { getAttendanceHistory } from "./api";
import AttendanceHistoryPanel from "./component/AttendanceHistoryPanel";
import { FALLBACK_MEMBERS } from "./attendanceConstants";
import { labelForType } from "./attendanceUtils";
import { useToast } from "../../components/ui/ToastProvider";
import AttendanceNavigation from "./component/AttendanceNavigation";

export default function AttendanceHistoryPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState(
    () => getCached("/members/") || FALLBACK_MEMBERS,
  );
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [checkpointFilter, setCheckpointFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([getAttendanceHistory(), getMembers().catch(() => null)])
      .then(([attendanceSessions, memberData]) => {
        if (!mounted) return;
        setSessions(Array.isArray(attendanceSessions) ? attendanceSessions : []);
        if (Array.isArray(memberData) && memberData.length) {
          setMembers(memberData);
        }
      })
      .catch(() => {
        if (mounted) {
          toast.error("Attendance history could not be loaded. Try refreshing.");
        }
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [toast]);

  const filteredSessions = useMemo(
    () => sessions.filter((session) => {
      if (typeFilter && session.type !== typeFilter) return false;
      if (checkpointFilter && session.checkpoint !== checkpointFilter) return false;
      if (filter && !session.date?.startsWith(filter)) return false;
      if (fromDate && session.date < fromDate) return false;
      if (toDate && session.date > toDate) return false;
      return true;
    }),
    [checkpointFilter, filter, fromDate, sessions, toDate, typeFilter],
  );

  const trend = useMemo(() => {
    const ordered = [...filteredSessions].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    const current = ordered[0]?.totals;
    const previous = ordered[1]?.totals;
    const currentRate = current?.total ? Math.round((current.present / current.total) * 100) : 0;
    const previousRate = previous?.total ? Math.round((previous.present / previous.total) * 100) : 0;
    return {
      currentRate,
      difference: currentRate - previousRate,
      hasComparison: Boolean(current && previous),
    };
  }, [filteredSessions]);

  function clearFilters() {
    setFilter("");
    setTypeFilter("");
    setCheckpointFilter("");
    setFromDate("");
    setToDate("");
  }

  function exportHistory() {
    exportToExcel(
      [
        {
          name: "Attendance History",
          reportName: "Attendance History",
          period: filter || fromDate || toDate || "All available records",
          columns: ["Date", "Attendance type", "Checkpoint", "Status", "Total", "Present", "Absent", "Attendance rate"],
          rows: filteredSessions.map((session) => {
            const totals = session.totals || {};
            const rate = totals.total ? `${Math.round((totals.present / totals.total) * 100)}%` : "0%";
            return [
              session.date,
              session.eventName || labelForType(session.type, session.checkpoint),
              session.checkpoint === "pre-sermon" ? "Pre-Sermon" : session.checkpoint === "post-sermon" ? "Post-Sermon" : "-",
              session.status === "submitted" || session.status === "locked" ? "Submitted" : session.status === "draft" ? "Draft" : "Saved",
              totals.total ?? 0,
              totals.present ?? 0,
              totals.absent ?? 0,
              rate,
            ];
          }),
        },
      ],
      "attendance-history.xlsx",
    );
  }

  const exportColumns = ["Date", "Attendance type", "Checkpoint", "Status", "Total", "Present", "Absent", "Attendance rate"];
  const exportRows = filteredSessions.map((session) => {
    const totals = session.totals || {};
    return [session.date, session.eventName || labelForType(session.type, session.checkpoint), session.checkpoint === "pre-sermon" ? "Pre-Sermon" : session.checkpoint === "post-sermon" ? "Post-Sermon" : "-", session.status === "submitted" || session.status === "locked" ? "Submitted" : session.status === "draft" ? "Draft" : "Saved", totals.total ?? 0, totals.present ?? 0, totals.absent ?? 0, totals.total ? `${Math.round((totals.present / totals.total) * 100)}%` : "0%"];
  });

  if (isLoading) return <LoadingState label="Loading attendance history..." />;

  return (
    <div className="space-y-6">
      <AttendanceNavigation />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/attendance")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#154d78]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to attendance
          </button>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#154d78]" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Attendance history
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Review previous Sunday Service, Bible Study, and Prayer Meeting sessions.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filtered sessions</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{filteredSessions.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Latest attendance</p>
          <p className="mt-2 text-2xl font-semibold text-[#154d78]">{trend.currentRate}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500"><TrendingUp className="h-4 w-4 text-[#154d78]" /> Compared with previous</div>
          <p className={`mt-2 text-2xl font-semibold ${trend.difference >= 0 ? "text-emerald-700" : "text-[#9e263b]"}`}>{trend.hasComparison ? `${trend.difference >= 0 ? "+" : ""}${trend.difference} pts` : "-"}</p>
        </div>
      </div>

      <SectionCard title="Recorded sessions">
        <div className="mb-4 flex justify-end">
          <ExportButton onExport={exportHistory} label="Export Excel" />
          <button type="button" onClick={() => exportToCsv(exportColumns, exportRows, "attendance-history.csv")} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Export CSV</button>
          <button type="button" onClick={() => printReport({ title: "Attendance History", columns: exportColumns, rows: exportRows })} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Export PDF</button>
        </div>
        <AttendanceHistoryPanel
          members={members}
          sessions={sessions}
          filter={filter}
          onFilterChange={setFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          checkpointFilter={checkpointFilter}
          onCheckpointFilterChange={setCheckpointFilter}
          fromDate={fromDate}
          onFromDateChange={setFromDate}
          toDate={toDate}
          onToDateChange={setToDate}
          onClearFilters={clearFilters}
        />
      </SectionCard>
    </div>
  );
}
