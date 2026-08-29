import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { CalendarDays, ClipboardCheck, Save, Users } from "lucide-react";
import SectionCard from "../../components/ui/SectionCard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import Badge from "../../components/ui/Badge";
import { useToast } from "../../components/ui/ToastProvider";
import { getAttendanceHistory, recordAttendance } from "./api";
import { isCategoryAdmin, isSuperAdmin } from "../../lib/permissions";
import AttendanceStats from "./component/AttendanceStats";
import AttendanceHistory from "./component/AttendanceHistory";

const CATEGORY_FIELDS = [
  { key: "adults", label: "Adult" },
  { key: "youth", label: "Youth" },
  { key: "teenagers", label: "Teenager" },
  { key: "children", label: "Children" },
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyForm(user) {
  return {
    date: todayValue(),
    adults: "",
    youth: "",
    teenagers: "",
    children: "",
  };
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;
  return Number(value);
}

export default function AttendancePage() {
  const toast = useToast();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(() => createEmptyForm(user));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const canRecord = isSuperAdmin(user) || isCategoryAdmin(user);
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
  const visibleCategoryFields = isScopedRecorder
    ? CATEGORY_FIELDS.filter((field) => field.key === scopedCategoryKey)
    : CATEGORY_FIELDS;

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getAttendanceHistory()
      .then((data) => {
        if (mounted) setRecords(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted)
          setError("Couldn't load attendance records. Try refreshing.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function update(field, value) {
    if (/^\d*$/.test(value)) {
      setForm((previous) => ({ ...previous, [field]: value }));
      setError("");
    }
  }

  function buildSubmissionPayload(formData) {
    if (!isScopedRecorder) {
      return {
        date: formData.date,
        adults: toNumber(formData.adults),
        youth: toNumber(formData.youth),
        teenagers: toNumber(formData.teenagers),
        children: toNumber(formData.children),
      };
    }

    return {
      date: formData.date,
      adults: scopedCategoryKey === "adults" ? toNumber(formData.adults) : 0,
      youth: scopedCategoryKey === "youth" ? toNumber(formData.youth) : 0,
      teenagers:
        scopedCategoryKey === "teenagers" ? toNumber(formData.teenagers) : 0,
      children:
        scopedCategoryKey === "children" ? toNumber(formData.children) : 0,
    };
  }

  const calculatedTotal = (
    isScopedRecorder ? visibleCategoryFields : CATEGORY_FIELDS
  ).reduce((sum, field) => sum + toNumber(form[field.key]), 0);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.date) {
      setError("Select the attendance date.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildSubmissionPayload(form);
      const saved = await recordAttendance(payload);
      setRecords((previous) => {
        const withoutSameDate = previous.filter(
          (record) => record.date !== saved.date,
        );
        return [...withoutSameDate, saved].sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
      });
      setForm(createEmptyForm(user));
      toast.success("Attendance recorded successfully.");
    } catch {
      toast.error("Couldn't save attendance. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [records],
  );

  if (isLoading) return <LoadingState label="Loading attendance..." />;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-[#154d78]" strokeWidth={2} />
          <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Record and review weekly church service attendance by category.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#9e263b]/20 bg-[#9e263b]/5 px-4 py-3 text-sm text-[#9e263b]">
          {error}
        </div>
      )}

      <AttendanceStats
        records={records}
        categoryKey={isScopedRecorder ? scopedCategoryKey : null}
        categoryLabel={isScopedRecorder ? user.scope : null}
      />

      {canRecord && (
        <SectionCard title="Record Church Service Attendance">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Attendance Date"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    date: event.target.value,
                  }))
                }
              />
              <Input
                label="Total Appearances"
                type="number"
                min="0"
                value={calculatedTotal}
                readOnly
              />
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#4a2969]" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-gray-900">
                  Appearances by Category
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {visibleCategoryFields.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    type="number"
                    min="0"
                    value={form[field.key]}
                    disabled={
                      isScopedRecorder && field.key !== scopedCategoryKey
                    }
                    onChange={(event) => update(field.key, event.target.value)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={isSaving}>
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {isScopedRecorder && (
        <SectionCard title={`${user.scope} Attendance`}>
          <div className="rounded-lg border border-[#154d78]/15 bg-[#154d78]/5 px-4 py-3 text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              Category-scoped attendance view
            </p>
            <p className="mt-1">
              Attendance figures shown here are limited to your assigned
              category, and the record form allows you to submit counts for{" "}
              {user.scope.toLowerCase()} attendance.
            </p>
          </div>
        </SectionCard>
      )}

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
            categoryKey={isScopedRecorder ? scopedCategoryKey : null}
          />
        )}
      </SectionCard>
    </div>
  );
}
