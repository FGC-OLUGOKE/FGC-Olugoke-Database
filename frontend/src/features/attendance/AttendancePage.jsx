import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";

import { CalendarDays, ClipboardCheck } from "lucide-react";

import SectionCard from "../../components/ui/SectionCard";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import FloatingActionButton from "../../components/ui/FloatingActionButton";
import { useToast } from "../../components/ui/ToastProvider";

import {
  getAttendanceHistory,
  recordAttendance,
} from "./api";

import {
  isCategoryAdmin,
  isSuperAdmin,
} from "../../lib/permissions";

import AttendanceStats from "./component/AttendanceStats";
import AttendanceHistory from "./component/AttendanceHistory";
import AttendanceForm from "./component/AttendanceForm";

export default function AttendancePage() {
  const toast = useToast();
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] =
    useState(false);
  const [error, setError] = useState("");

  /*
   * --------------------------------------------------
   * PERMISSIONS
   * --------------------------------------------------
   *
   * Only Super Admin can CREATE an attendance session.
   *
   * Category admins are scoped to their own category.
   * They can view attendance related to their category,
   * but they cannot create a church attendance session.
   */
  const canRecord = isSuperAdmin(user);

  const isScopedRecorder = isCategoryAdmin(user);

  const scopedCategoryKey = useMemo(() => {
    const fieldByCategory = {
      Adult: "adults",
      Youth: "youth",
      Teenager: "teenagers",
      Children: "children",
    };

    return fieldByCategory[user?.scope] || null;
  }, [user]);

  /*
   * --------------------------------------------------
   * LOAD ATTENDANCE HISTORY
   * --------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    setIsLoading(true);
    setError("");

    getAttendanceHistory()
      .then((data) => {
        if (mounted) {
          setRecords(
            Array.isArray(data) ? data : [],
          );
        }
      })
      .catch(() => {
        if (mounted) {
          setError(
            "Couldn't load attendance records. Try refreshing.",
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * --------------------------------------------------
   * SAVE ATTENDANCE
   * --------------------------------------------------
   *
   * This is only reachable by Super Admin because
   * category admins cannot open AttendanceForm.
   */
  async function handleSaveAttendance(payload) {
    if (isSaving) return;
    setIsSaving(true);
    setError("");

    try {
      const saved = await recordAttendance(payload);

      setRecords((previous) => {
        return [...previous, saved].sort(
          (a, b) =>
            new Date(a.date) - new Date(b.date),
        );
      });

      setIsRecordDrawerOpen(false);

      toast.success(
        "Attendance recorded successfully.",
      );
    } catch (err) {
      console.error(err);

      toast.error(
        "Couldn't save attendance. Try again.",
      );

      throw err;
    } finally {
      setIsSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * SORT RECORDS
   * --------------------------------------------------
   */
  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date),
      ),
    [records],
  );

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */
  if (isLoading) {
    return (
      <LoadingState label="Loading attendance..." />
    );
  }

  return (
    <div className="space-y-6">
      {/* --------------------------------------------
          PAGE HEADER
      --------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck
              className="h-5 w-5 text-[#154d78]"
              strokeWidth={2}
            />

            <h1 className="text-2xl font-semibold text-gray-900">
              Attendance
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Record and review weekly church service
            attendance by category.
          </p>
        </div>

        {/* ------------------------------------------
            ONLY SUPER ADMIN CAN CREATE SESSION
        ------------------------------------------- */}
        {canRecord && (
          <Button
            type="button"
            className="hidden md:inline-flex sm:w-auto"
            onClick={() => {
              setError("");
              setIsRecordDrawerOpen(true);
            }}
          >
            <ClipboardCheck className="h-4 w-4" />
            Record Attendance
          </Button>
        )}
      </div>

      {canRecord && (
        <FloatingActionButton
          label="Record Attendance"
          storageKey="attendance-create"
          onClick={() => {
            setError("");
            setIsRecordDrawerOpen(true);
          }}
        />
      )}

      {/* --------------------------------------------
          ERROR
      --------------------------------------------- */}
      {error && (
        <div className="rounded-lg border border-[#9e263b]/20 bg-[#9e263b]/5 px-4 py-3 text-sm text-[#9e263b]">
          {error}
        </div>
      )}

      {/* --------------------------------------------
          ATTENDANCE STATISTICS
      --------------------------------------------- */}
      <AttendanceStats
        records={records}
        categoryKey={
          isScopedRecorder
            ? scopedCategoryKey
            : null
        }
        categoryLabel={
          isScopedRecorder
            ? user?.scope
            : null
        }
      />

      {/* --------------------------------------------
          CATEGORY ADMIN INFORMATION
      --------------------------------------------- */}
      {isScopedRecorder && (
        <SectionCard
          title={`${user.scope} Attendance`}
        >
          <div className="rounded-lg border border-[#154d78]/15 bg-[#154d78]/5 px-4 py-3 text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              Category-scoped attendance view
            </p>

            <p className="mt-1">
              Attendance figures shown here are
              limited to your assigned category.
              You cannot create or configure an
              attendance session.
            </p>
          </div>
        </SectionCard>
      )}

      {/* --------------------------------------------
          ATTENDANCE HISTORY
      --------------------------------------------- */}
      <SectionCard title="Attendance History">
        {sortedRecords.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No attendance records"
            description="Attendance records will appear here after the first service attendance is recorded."
          />
        ) : (
          <AttendanceHistory
            records={sortedRecords}
            categoryKey={
              isScopedRecorder
                ? scopedCategoryKey
                : null
            }
          />
        )}
      </SectionCard>

      {/* --------------------------------------------
          RECORD ATTENDANCE DRAWER
          
          IMPORTANT:
          Category admins cannot even mount/open
          this form.
      --------------------------------------------- */}
      {isSuperAdmin(user) && (
        <AttendanceForm
          isOpen={isRecordDrawerOpen}
          onClose={() =>
            setIsRecordDrawerOpen(false)
          }
          onSave={handleSaveAttendance}
          user={user}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
