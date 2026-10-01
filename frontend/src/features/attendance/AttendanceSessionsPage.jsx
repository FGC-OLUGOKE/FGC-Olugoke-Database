import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronRight, History, LockKeyhole, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ExportButton from "../../components/ui/ExportButton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LoadingState from "../../components/ui/LoadingState";
import Select from "../../components/ui/Select";
import { exportToCsv, exportToExcel, printReport } from "../../lib/exportUtils";
import { useToast } from "../../components/ui/ToastProvider";
import { getAttendanceHistory, submitAttendanceSession } from "./api";
import { labelForType } from "./attendanceUtils";
import AttendanceNavigation from "./component/AttendanceNavigation";

export default function AttendanceSessionsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAttendanceHistory()
      .then((data) => mounted && setSessions(Array.isArray(data) ? data : []))
      .catch(() => mounted && toast.error("Saved attendance sessions could not be loaded."))
      .finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, [toast]);

  const visibleSessions = useMemo(() => [...sessions]
    .filter((session) => !typeFilter || session.type === typeFilter)
    .sort((a, b) => sort === "oldest" ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date)), [sessions, sort, typeFilter]);

  function exportRows() {
    return visibleSessions.map((session) => [
      session.date,
      session.eventName || labelForType(session.type, session.checkpoint),
      session.status === "submitted" || session.status === "locked" ? "Submitted" : session.status === "draft" ? "Draft" : "Saved",
      session.totals?.total ?? 0,
      session.totals?.present ?? 0,
      session.totals?.absent ?? 0,
    ]);
  }

  const exportColumns = ["Date", "Attendance type", "Status", "Total", "Present", "Absent"];

  function exportSessions() {
    exportToExcel([{
      name: "Saved Sessions",
      reportName: "Saved Attendance Sessions",
      columns: exportColumns,
      rows: exportRows(),
    }], "saved-attendance-sessions.xlsx");
  }

  async function confirmSubmit() {
    if (!pendingSubmit) return;
    setIsSubmitting(true);
    try {
      const updated = await submitAttendanceSession(pendingSubmit.id);
      setSessions((current) => current.map((session) => session.id === updated.id ? updated : session));
      setPendingSubmit(null);
      toast.success("Attendance session submitted and locked.");
    } catch {
      toast.error("This attendance session could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading saved attendance sessions..." />;

  return (
    <div className="space-y-6">
      <AttendanceNavigation />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate("/attendance")} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#154d78]"><ArrowLeft className="h-4 w-4" /> Back to attendance</button>
          <div className="flex items-center gap-2"><History className="h-5 w-5 text-[#154d78]" /><h1 className="text-2xl font-semibold text-gray-900">Saved attendance sessions</h1></div>
          <p className="mt-1 text-sm text-gray-500">Choose a saved session to read its full attendance details.</p>
        </div>
        <div className="flex flex-wrap gap-3"><ExportButton onExport={exportSessions} label="Export Excel" /><button type="button" onClick={() => exportToCsv(exportColumns, exportRows(), "saved-attendance-sessions.csv")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">Export CSV</button><button type="button" onClick={() => printReport({ title: "Saved Attendance Sessions", columns: exportColumns, rows: exportRows() })} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">Export PDF</button><button type="button" onClick={() => navigate("/attendance/history")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"><CalendarDays className="h-4 w-4" /> History view</button></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2"><Select label="Attendance type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} placeholder="All types" options={[{ value: "sunday-service", label: "Sunday Service" }, { value: "bible-study", label: "Bible Study" }, { value: "prayer-meeting", label: "Prayer Meeting" }]} /><Select label="Sort sessions" value={sort} onChange={(event) => setSort(event.target.value)} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }]} /></div>

      {visibleSessions.length === 0 ? <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">No saved attendance sessions found.</div> : <div className="grid gap-4 lg:grid-cols-2">{visibleSessions.map((session) => <SessionCard key={session.id} session={session} onView={() => navigate(`/attendance/history/${encodeURIComponent(session.id)}`)} onEdit={() => navigate(`/attendance?edit=${encodeURIComponent(session.id)}`)} onSubmit={() => setPendingSubmit(session)} />)}</div>}
      <ConfirmDialog isOpen={Boolean(pendingSubmit)} title="Submit and lock this session?" description="Submitted attendance cannot be edited. Confirm that the recorded totals are final." confirmLabel="Submit and lock" confirmVariant="primary" isLoading={isSubmitting} onConfirm={confirmSubmit} onCancel={() => setPendingSubmit(null)} />
    </div>
  );
}

function SessionCard({ session, onView, onEdit, onSubmit }) {
  const submitted = session.status === "submitted" || session.status === "locked";
  const statusLabel = submitted ? "Submitted" : session.status === "draft" ? "Draft" : "Saved";
  return <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold text-gray-900">{session.eventName || labelForType(session.type, session.checkpoint)}</p><p className="mt-1 text-sm text-gray-500">{session.date}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${submitted ? "bg-gray-100 text-gray-500" : session.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{statusLabel}</span></div><div className="mt-5 grid grid-cols-3 gap-2"><Metric label="Total" value={session.totals?.total ?? 0} /><Metric label="Present" value={session.totals?.present ?? 0} /><Metric label="Absent" value={session.totals?.absent ?? 0} /></div><div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={onView} className="inline-flex items-center gap-1.5 rounded-lg bg-[#154d78] px-3 py-2 text-sm font-semibold text-white hover:bg-[#103d60]">View details <ChevronRight className="h-4 w-4" /></button>{submitted ? <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500"><LockKeyhole className="h-3.5 w-3.5" /> Locked</span> : <><button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"><Pencil className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={onSubmit} className="rounded-lg border border-[#154d78]/20 bg-[#154d78]/5 px-3 py-2 text-sm font-semibold text-[#154d78] hover:bg-[#154d78]/10">Submit</button></>}</div></article>;
}

function Metric({ label, value }) { return <div className="rounded-lg bg-gray-50 px-3 py-2"><p className="text-lg font-semibold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>; }
