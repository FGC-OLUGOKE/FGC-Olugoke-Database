import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LoadingState from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/ToastProvider";
import { getCached } from "../../lib/apiClient";
import { getScopedMembers } from "../../lib/permissions";
import { useAuth } from "../auth/AuthContext";
import { getMembers } from "../members/api";
import {
  createAttendanceSession,
  getAttendanceHistory,
  updateAttendanceSession,
} from "./api";
import AttendanceLanding from "./component/AttendanceLanding";
import AttendanceSessionView from "./component/AttendanceSessionView";
import { ATTENDANCE_TYPES, FALLBACK_MEMBERS } from "./attendanceConstants";
import { labelForType, memberName, today } from "./attendanceUtils";

export default function AttendancePage() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState(() => getCached("/members/") || FALLBACK_MEMBERS);
  const [selectedType, setSelectedType] = useState(null);
  const [checkpoint, setCheckpoint] = useState("pre-sermon");
  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState({});
  const [unregistered, setUnregistered] = useState([]);
  const [newAttendee, setNewAttendee] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("draft");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const editId = searchParams.get("edit");
  const editSession = savedSessions.find((item) => String(item.id) === String(editId));
  const editBlocked = Boolean(
    editId &&
      savedSessions.length &&
      (!editSession || editSession.status === "submitted" || editSession.status === "locked"),
  );
  const pageError = editBlocked ? "This attendance session is submitted or unavailable and cannot be edited." : "";

  useEffect(() => {
    let mounted = true;

    Promise.all([getMembers().catch(() => null), getAttendanceHistory()])
      .then(([memberData, attendanceSessions]) => {
        if (!mounted) return;
        if (Array.isArray(memberData) && memberData.length) setMembers(memberData);
        if (Array.isArray(attendanceSessions)) setSavedSessions(attendanceSessions);
      })
      .catch(() => {
        if (mounted) toast.error("Attendance history could not be loaded. Local records are still available.");
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!editId || !savedSessions.length) return;

    const session = editSession;
    if (!session || session.status === "submitted" || session.status === "locked") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setSelectedType(session.type);
      setCheckpoint(session.checkpoint || "single");
      setDate(session.date || today());
      setAttendance(session.attendance || {});
      setUnregistered(session.unregisteredAttendees || []);
      setEditingSessionId(session.id);
      setSessionStatus(session.status || "saved");
    });

    return () => cancelAnimationFrame(frame);
  }, [editId, editSession, savedSessions]);

  const scopedMembers = useMemo(() => getScopedMembers(user, members), [members, user]);

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedMembers
      .filter((member) => !categoryFilter || member.category === categoryFilter)
      .filter((member) => memberName(member).toLowerCase().includes(query))
      .sort((a, b) => {
        if (sortBy === "status") {
          return (attendance[b.id] || "absent").localeCompare(attendance[a.id] || "absent");
        }
        return memberName(a).localeCompare(memberName(b));
      });
  }, [attendance, categoryFilter, scopedMembers, search, sortBy]);

  const totals = useMemo(() => {
    const presentMembers = Object.values(attendance).filter(
      (status) => status === "present",
    ).length;
    return {
      total: scopedMembers.length + unregistered.length,
      present: presentMembers + unregistered.length,
      absent: scopedMembers.length - presentMembers,
    };
  }, [attendance, scopedMembers.length, unregistered.length]);

  function openType(typeId) {
    setSelectedType(typeId);
    setCheckpoint(typeId === "sunday-service" ? "pre-sermon" : "single");
    setDate(today());
    setAttendance({});
    setUnregistered([]);
    setSearch("");
    setCategoryFilter("");
    setEditingSessionId(null);
    setSessionStatus("draft");
  }

  function setMemberStatus(memberId, status) {
    setAttendance((current) => {
      const next = { ...current };
      next[memberId] = status;
      return next;
    });
  }

  function addUnregistered() {
    const name = newAttendee.trim();
    if (!name) return;
    setUnregistered((current) => [...current, { id: `unregistered-${Date.now()}`, name, status: "present" }]);
    setNewAttendee("");
  }

  function requestSaveAttendance() {
    if (!selectedType || isSaving) return;
    const selectedDate = new Date(`${date}T00:00:00`);
    const todayDate = new Date(`${today()}T00:00:00`);

    if (selectedDate > todayDate) {
      toast.error("Attendance cannot be recorded for a future date.");
      return;
    }

    const duplicate = savedSessions.find(
      (session) =>
        String(session.id) !== String(editingSessionId || editId) &&
        session.type === selectedType &&
        (session.checkpoint || "single") === checkpoint &&
        session.date === date,
    );

    if (duplicate) {
      toast.error("Attendance for this type, date, and checkpoint already exists.");
      return;
    }

    setIsConfirmOpen(true);
  }

  async function saveAttendance() {
    if (!selectedType || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        type: selectedType,
        checkpoint,
        date,
        eventName: labelForType(selectedType, checkpoint),
        attendance,
        unregisteredAttendees: unregistered,
        totals,
        status: "saved",
      };
      const saved = editingSessionId
        ? await updateAttendanceSession(editingSessionId, payload)
        : await createAttendanceSession(payload);

      setSavedSessions((current) => {
        const withoutCurrent = current.filter((item) => String(item.id) !== String(saved.id));
        return [saved, ...withoutCurrent];
      });
      setIsConfirmOpen(false);
      toast.success("Attendance recorded successfully.");
      navigate("/attendance/sessions");
    } catch {
      toast.error("Attendance could not be saved. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDraft() {
    if (!selectedType || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        type: selectedType,
        checkpoint,
        date,
        eventName: labelForType(selectedType, checkpoint),
        attendance,
        unregisteredAttendees: unregistered,
        totals,
        status: "draft",
      };
      const saved = editingSessionId
        ? await updateAttendanceSession(editingSessionId, payload)
        : await createAttendanceSession(payload);
      setSavedSessions((current) => [saved, ...current.filter((item) => String(item.id) !== String(saved.id))]);
      toast.success("Attendance draft saved.");
      navigate("/attendance/sessions");
    } catch {
      toast.error("Attendance draft could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading attendance..." />;

  if (!selectedType) {
    return (
      <>
        <AttendanceLanding
          attendanceTypes={ATTENDANCE_TYPES}
          onSelectType={openType}
        />
        {pageError && <Feedback>{pageError}</Feedback>}
      </>
    );
  }

  const type = ATTENDANCE_TYPES.find((item) => item.id === selectedType);

  return (
    <>
      <AttendanceSessionView
        type={type}
        checkpoint={checkpoint}
        date={date}
        onDateChange={setDate}
        onBack={() => setSelectedType(null)}
        onCheckpointChange={setCheckpoint}
        totals={totals}
        visibleMembers={visibleMembers}
        attendance={attendance}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onStatusChange={setMemberStatus}
        newAttendee={newAttendee}
        onNewAttendeeChange={setNewAttendee}
        onAddUnregistered={addUnregistered}
        unregistered={unregistered}
        onRemoveUnregistered={(id) => setUnregistered((current) => current.filter((attendee) => attendee.id !== id))}
        onSave={requestSaveAttendance}
        onSaveDraft={saveDraft}
        isSaving={isSaving}
        sessionStatus={sessionStatus}
        isEditing={Boolean(editingSessionId)}
      />
      {pageError && <Feedback>{pageError}</Feedback>}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={editingSessionId ? "Save attendance changes?" : "Save attendance session?"}
        description={`This will save ${totals.present} present and ${totals.absent} absent for ${labelForType(selectedType, checkpoint)} on ${date}.`}
        confirmLabel="Save session"
        confirmVariant="primary"
        loadingLabel="Saving..."
        isLoading={isSaving}
        onConfirm={saveAttendance}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}

function Feedback({ children }) {
  return <div className="mt-4 rounded-lg border border-[#9e263b]/20 bg-[#9e263b]/5 px-4 py-3 text-sm text-[#9e263b]">{children}</div>;
}
