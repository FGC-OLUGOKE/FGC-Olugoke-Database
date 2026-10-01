import { useEffect, useState } from "react";
import { ArrowLeft, History } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import ExportButton from "../../components/ui/ExportButton";
import LoadingState from "../../components/ui/LoadingState";
import SectionCard from "../../components/ui/SectionCard";
import { getCached } from "../../lib/apiClient";
import { exportToCsv, exportToExcel, printReport } from "../../lib/exportUtils";
import { useToast } from "../../components/ui/ToastProvider";
import { getAttendanceHistory } from "./api";
import AttendanceHistoryPanel from "./component/AttendanceHistoryPanel";
import { FALLBACK_MEMBERS } from "./attendanceConstants";
import { labelForType } from "./attendanceUtils";
import { getMembers } from "../members/api";
import AttendanceNavigation from "./component/AttendanceNavigation";

export default function AttendanceHistoryDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [members, setMembers] = useState(() => getCached("/members/") || FALLBACK_MEMBERS);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getAttendanceHistory(), getMembers().catch(() => null)])
      .then(([sessions, memberData]) => {
        if (!mounted) return;
        const found = sessions.find((item) => String(item.id) === String(sessionId));
        if (!found) {
          toast.error("Attendance session could not be found.");
          navigate("/attendance/sessions", { replace: true });
          return;
        }
        setSession(found);
        if (Array.isArray(memberData) && memberData.length) setMembers(memberData);
      })
      .catch(() => toast.error("Attendance details could not be loaded."))
      .finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, [navigate, sessionId, toast]);

  function exportDetails() {
    if (!session) return;
    const attendance = session.attendance || {};
    const memberRows = members
      .filter((member) => attendance[member.id] === "present")
      .map((member) => [`${member.firstName || ""} ${member.lastName || ""}`.trim(), "Present"]);
    const unregisteredRows = (session.unregisteredAttendees || []).map((attendee) => [attendee.name, "Present (unregistered)"]);
    const columns = ["Member", "Status"];
    const rows = [...memberRows, ...unregisteredRows];
    exportToExcel([{
      name: "Session Details",
      reportName: session.eventName || labelForType(session.type, session.checkpoint),
      period: session.date,
      columns,
      rows,
    }], `attendance-${session.date || "session"}.xlsx`);
  }

  function exportCsv() {
    if (!session) return;
    const attendance = session.attendance || {};
    const rows = [
      ...members.filter((member) => attendance[member.id] === "present").map((member) => [`${member.firstName || ""} ${member.lastName || ""}`.trim(), "Present"]),
      ...(session.unregisteredAttendees || []).map((attendee) => [attendee.name, "Present (unregistered)"]),
    ];
    exportToCsv(["Member", "Status"], rows, `attendance-${session.date || "session"}.csv`);
  }

  function exportPdf() {
    if (!session) return;
    const attendance = session.attendance || {};
    const rows = [
      ...members.filter((member) => attendance[member.id] === "present").map((member) => [`${member.firstName || ""} ${member.lastName || ""}`.trim(), "Present"]),
      ...(session.unregisteredAttendees || []).map((attendee) => [attendee.name, "Present (unregistered)"]),
    ];
    printReport({ title: session.eventName || "Attendance session", subtitle: session.date, columns: ["Member", "Status"], rows });
  }

  if (isLoading) return <LoadingState label="Loading attendance details..." />;
  if (!session) return null;

  return <div className="space-y-6"><AttendanceNavigation /><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><button type="button" onClick={() => navigate("/attendance/sessions")} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#154d78]"><ArrowLeft className="h-4 w-4" /> Back to saved sessions</button><div className="flex items-center gap-2"><History className="h-5 w-5 text-[#154d78]" /><h1 className="text-2xl font-semibold text-gray-900">Session details</h1></div><p className="mt-1 text-sm text-gray-500">{session.eventName || labelForType(session.type, session.checkpoint)} · {session.date}</p></div><div className="flex flex-wrap gap-2"><ExportButton onExport={exportDetails} label="Export Excel" /><button type="button" onClick={exportCsv} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Export CSV</button><button type="button" onClick={exportPdf} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Export PDF</button></div></div><SectionCard title="Recorded attendance"><AttendanceHistoryPanel members={members} sessions={[session]} type={{ title: session.eventName || labelForType(session.type, session.checkpoint) }} filter="" onFilterChange={() => {}} /></SectionCard></div>;
}
