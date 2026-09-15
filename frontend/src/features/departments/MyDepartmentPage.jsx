import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ArrowRight, Cake, ClipboardCheck, Users } from "lucide-react";

import SectionCard from "../../components/ui/SectionCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { getDepartments } from "./api";
import { getMembers } from "../members/api";
import { getAttendanceHistory } from "../attendance/api";
import { getApprovalRequests } from "../approvals/api";
import MemberList from "../members/components/MemberList";
import MemberStatusSection from "../dashboard/components/MemberStatusSection";
import MembershipByCategorySection from "../dashboard/components/MembershipByCategorySection";
import AttendanceStats from "../attendance/component/AttendanceStats";
import { getNextBirthday } from "../../lib/birthdayUtils";
import { getScopedDepartments, isDepartmentAdmin, isPastorate, isSuperAdmin } from "../../lib/permissions";

const CATEGORY_COLORS = {
  Children: "#d6b447",
  Teenager: "#4a2969",
  Youth: "#154d78",
  Adult: "#9e263b",
};

export default function MyDepartmentPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { departmentId } = useParams();
  const [department, setDepartment] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getDepartments(), getMembers(), getAttendanceHistory(), getApprovalRequests()])
      .then(([departments, memberData, attendanceData, requestData]) => {
        if (!mounted) return;
        const scopedDepartments = getScopedDepartments(user, Array.isArray(departments) ? departments : []);
        const requestedDepartment = departmentId
          ? scopedDepartments.find((item) => String(item.id) === departmentId)
          : null;
        setDepartment(
          requestedDepartment ||
          (isDepartmentAdmin(user)
            ? scopedDepartments.find((item) => item.name === user?.scope)
            : scopedDepartments[0]) ||
          null,
        );
        setMembers(Array.isArray(memberData) ? memberData : []);
        setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
        setRequests(Array.isArray(requestData) ? requestData : []);
      })
      .catch(() => {
        if (mounted) toast.error("Couldn't load your department. Try refreshing.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [departmentId, toast, user]);

  const departmentMembers = useMemo(
    () => members.filter((member) => member.departments?.includes(department?.name)),
    [members, department?.name],
  );
  const departmentAttendance = useMemo(
    () => attendance.filter((record) => record.department === department?.name || record.departmentName === department?.name),
    [attendance, department?.name],
  );
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const upcomingBirthdays = useMemo(
    () =>
      departmentMembers
        .map((member) => ({ member, birthday: getNextBirthday(member.dateOfBirth) }))
        .filter((entry) => entry.birthday && entry.birthday.daysAway >= 0)
        .sort((a, b) => a.birthday.daysAway - b.birthday.daysAway)
        .slice(0, 5),
    [departmentMembers],
  );

  if (!isDepartmentAdmin(user) && !isPastorate(user) && !isSuperAdmin(user)) return null;
  if (isLoading) return <LoadingState label="Loading your department..." />;

  if (!department) {
    return (
      <EmptyState
        icon={Users}
        title="Department not found"
        description="Your account is not currently assigned to a department."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#154d78]">My Department</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{department.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {department.pastorateName || "Pastorate not assigned"} · {department.description || "Department overview and member management"}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/members")}>
          Manage members <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Users} label="Department Members" value={departmentMembers.length} />
        <SummaryCard icon={Users} label="Active Members" value={departmentMembers.filter((member) => member.status === "Active").length} />
        <SummaryCard icon={ClipboardCheck} label="Attendance Records" value={departmentAttendance.length} />
        <SummaryCard icon={ClipboardCheck} label="Pending Requests" value={pendingRequests.length} />
      </div>

      <SectionCard title="Department Information">
        <div className="grid gap-4 sm:grid-cols-3">
          <Info label="Pastorate" value={department.pastorateName} />
          <Info label="Department Admin" value={department.departmentAdmin?.name || user.name} />
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <MembershipByCategorySection members={departmentMembers} />
        <MemberStatusSection members={departmentMembers} />
      </div>

      <SectionCard title="Attendance Overview">
        <AttendanceStats records={departmentAttendance} />
        {departmentAttendance.length === 0 && (
          <p className="mt-4 text-center text-sm text-gray-500">No attendance records are available for this department yet.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Upcoming Birthdays"
        actionLabel="View birthdays"
        onAction={() => navigate("/birthdays")}
      >
        {upcomingBirthdays.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No upcoming birthdays found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingBirthdays.map(({ member, birthday }) => (
              <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Cake className="h-4 w-4 shrink-0 text-[#d6b447]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-gray-500">{birthday.next.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
                <Badge tone={member.status === "Active" ? "active" : "inactive"}>
                  {birthday.daysAway === 0 ? "Today" : `In ${birthday.daysAway} days`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Department Members">
        <MemberList members={departmentMembers} onView={() => navigate("/members")} />
      </SectionCard>

      <SectionCard title="Pending Requests">
        {pendingRequests.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No pending requests for your account.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{request.memberName}</p>
                  <p className="text-xs text-gray-500">{request.type === "delete" ? "Deletion request" : "Profile update request"}</p>
                </div>
                <Badge tone="info">Pending</Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <Icon className="h-5 w-5 text-[#154d78]" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value || "—"}</p>
    </div>
  );
}
