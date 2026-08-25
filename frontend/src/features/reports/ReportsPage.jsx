import { useEffect, useMemo, useState } from "react";
import ReportsHeader from "./components/ReportsHeader";
import OverallStatsSection from "./components/OverallStatsSection";
import MembershipGrowthReport from "./components/MembershipGrowthReport";
import CategoryGrowthSection from "./components/CategoryGrowthSection";
import MembershipDemographicsSection from "./components/MembershipDemographicsSection";
import DepartmentReport from "./components/DepartmentReport";
import AttendanceReport from "./components/AttendanceReport";
import NewMembersReport from "./components/NewMembersReport";
import MemberStatusReport from "./components/MemberStatusReport";
import ProfileCompletionReport from "./components/ProfileCompletionReport";
import BirthdayReport from "./components/BirthdayReport";
import EventsReport from "./components/EventsReport";
import KeyInsightsSection from "./components/KeyInsightsSection";
import QuickReportActions from "./components/QuickReportActions";
import LoadingState from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/ToastProvider";
import { getReportsData } from "./api";
import { createMember } from "../members/api";
import { getNextBirthday } from "../../lib/birthdayUtils";
import { exportToExcel } from "../../lib/exportUtils";
import MemberForm from "../members/components/MemberForm";
import { useAuth } from "../auth/AuthContext";
import { getScopedMembers, isSuperAdmin } from "../../lib/permissions";

const CATEGORY_COLORS = {
  Children: "#d6b447",
  Teenager: "#4a2969",
  Youth: "#154d78",
  Adult: "#9e263b",
};
const GENDER_COLORS = { Male: "#154d78", Female: "#4a2969" };
const CATEGORY_LIST = ["Children", "Teenager", "Youth", "Adult"];

function isProfileComplete(m) {
  return Boolean(
    m.phone && m.email && m.address && m.photoUrl && m.departments.length > 0,
  );
}

function inRange(dateStr, range) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= range.start && d <= range.end;
}

function getPeriodRange(period, customStart, customEnd, today = new Date()) {
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  switch (period) {
    case "This Month":
      return { start: monthStart, end: monthEnd };
    case "Last Month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "Last 3 Months":
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 2, 1),
        end: monthEnd,
      };
    case "Last 6 Months":
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 5, 1),
        end: monthEnd,
      };
    case "This Year": {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "Custom Date Range": {
      if (!customStart || !customEnd)
        return { start: monthStart, end: monthEnd };
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return { start: new Date(customStart), end };
    }
    default:
      return { start: monthStart, end: monthEnd };
  }
}

function getPreviousPeriodRange(range) {
  const durationMs = range.end - range.start;
  const prevEnd = new Date(range.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: prevStart, end: prevEnd };
}

/**
 * ReportsPage
 *
 * Role-scoped: `scopedMembers` filters to the current user's
 * category before any member-derived report runs, per "Category
 * Admin reports should be limited to their category... They should
 * not access complete church-wide reports."
 *
 * Three sections are HIDDEN for Staff Admin rather than shown
 * with fake-scoped data, same reasoning as Dashboard: Membership
 * Growth and Attendance are backed by church-wide aggregate mock
 * data with no per-category breakdown, and the category-donut half
 * of Membership Demographics is meaningless when every member IS
 * already the admin's one category. Department Report is hidden too
 * — not a Staff Admin's concern per the spec (Staff Admins and
 * Department Admins are separate systems).
 */
export default function ReportsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [events, setEvents] = useState([]);
  const [growth, setGrowth] = useState([]);

  const [period, setPeriod] = useState("This Month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getReportsData()
      .then((data) => {
        if (!isMounted) return;
        setMembers(data.members);
        setDepartments(data.departments);
        setAttendance(data.attendance);
        setEvents(data.events);
        setGrowth(data.growth);
      })
      .catch(() => {
        if (isMounted) toast.error("Couldn't load reports. Try refreshing.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scopedMembers = useMemo(
    () => getScopedMembers(user, members),
    [user, members],
  );

  const range = useMemo(
    () => getPeriodRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );
  const previousRange = useMemo(() => getPreviousPeriodRange(range), [range]);

  const newMembersInPeriod = useMemo(
    () => scopedMembers.filter((m) => inRange(m.dateJoined, range)),
    [scopedMembers, range],
  );

  const attendanceInPeriod = useMemo(
    () => attendance.filter((a) => inRange(a.date, range)),
    [attendance, range],
  );
  const attendancePrevPeriod = useMemo(
    () => attendance.filter((a) => inRange(a.date, previousRange)),
    [attendance, previousRange],
  );

  const overallStats = useMemo(() => {
    const total = scopedMembers.length;
    const active = scopedMembers.filter((m) => m.status === "Active").length;
    const inactive = scopedMembers.filter(
      (m) => m.status === "Inactive",
    ).length;
    const workers = scopedMembers.filter((m) => m.worker).length;
    // Attendance is church-wide only (see file header) — shown as-is
    // even for scoped roles, since there's no honest way to split it
    // by category with the current API data shape.
    const totalAttendance = attendanceInPeriod.reduce(
      (sum, a) => sum + a.total,
      0,
    );
    const avgAttendance = attendanceInPeriod.length
      ? Math.round(totalAttendance / attendanceInPeriod.length)
      : 0;
    const completeCount = scopedMembers.filter(isProfileComplete).length;
    const profileCompletionPct = total
      ? Math.round((completeCount / total) * 100)
      : 0;

    return {
      total,
      active,
      inactive,
      workers,
      newMembers: newMembersInPeriod.length,
      totalAttendance,
      avgAttendance,
      profileCompletionPct,
    };
  }, [scopedMembers, attendanceInPeriod, newMembersInPeriod]);

  const categoryBreakdown = useMemo(
    () =>
      CATEGORY_LIST.map((name) => ({
        name,
        value: scopedMembers.filter((m) => m.category === name).length,
        color: CATEGORY_COLORS[name],
      })),
    [scopedMembers],
  );

  const genderBreakdown = useMemo(
    () =>
      ["Male", "Female"].map((name) => ({
        name,
        value: scopedMembers.filter((m) => m.gender === name).length,
        color: GENDER_COLORS[name],
      })),
    [scopedMembers],
  );

  const departmentBreakdown = useMemo(() => {
    const totalWorkers = members.filter((m) => m.worker).length || 1;
    return departments
      .map((dept) => {
        const count = members.filter((m) =>
          m.departments.includes(dept.name),
        ).length;
        const workerCount = members.filter(
          (m) => m.departments.includes(dept.name) && m.worker,
        ).length;
        return {
          name: dept.name,
          count,
          workerCount,
          pctOfWorkers: Math.round((workerCount / totalWorkers) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [members, departments]);

  const attendanceStats = useMemo(() => {
    if (attendanceInPeriod.length === 0) {
      return {
        total: 0,
        average: 0,
        highest: null,
        lowest: null,
        changePct: "0.0",
        byCategory: { adults: 0, youth: 0, teenagers: 0, children: 0 },
      };
    }
    const total = attendanceInPeriod.reduce((s, a) => s + a.total, 0);
    const average = Math.round(total / attendanceInPeriod.length);
    const highest = attendanceInPeriod.reduce((max, a) =>
      a.total > max.total ? a : max,
    );
    const lowest = attendanceInPeriod.reduce((min, a) =>
      a.total < min.total ? a : min,
    );

    const prevTotal = attendancePrevPeriod.reduce((s, a) => s + a.total, 0);
    const prevAvg = attendancePrevPeriod.length
      ? prevTotal / attendancePrevPeriod.length
      : 0;
    const changePct = prevAvg
      ? (((average - prevAvg) / prevAvg) * 100).toFixed(1)
      : "0.0";

    const byCategory = {
      adults: attendanceInPeriod.reduce((s, a) => s + a.adults, 0),
      youth: attendanceInPeriod.reduce((s, a) => s + a.youth, 0),
      teenagers: attendanceInPeriod.reduce((s, a) => s + a.teenagers, 0),
      children: attendanceInPeriod.reduce((s, a) => s + a.children, 0),
    };

    return { total, average, highest, lowest, changePct, byCategory };
  }, [attendanceInPeriod, attendancePrevPeriod]);

  const newMembersBreakdown = useMemo(() => {
    const byCategory = CATEGORY_LIST.map((c) => ({
      category: c,
      count: newMembersInPeriod.filter((m) => m.category === c).length,
    }));
    return {
      total: newMembersInPeriod.length,
      byCategory,
      male: newMembersInPeriod.filter((m) => m.gender === "Male").length,
      female: newMembersInPeriod.filter((m) => m.gender === "Female").length,
    };
  }, [newMembersInPeriod]);

  const memberStatusBreakdown = useMemo(() => {
    const total = scopedMembers.length;
    const active = scopedMembers.filter((m) => m.status === "Active").length;
    const inactive = total - active;
    return {
      active,
      inactive,
      total,
      activePct: total ? Math.round((active / total) * 100) : 0,
      inactivePct: total ? Math.round((inactive / total) * 100) : 0,
    };
  }, [scopedMembers]);

  const profileCompletion = useMemo(() => {
    const total = scopedMembers.length;
    const missing = {
      phone: scopedMembers.filter((m) => !m.phone).length,
      email: scopedMembers.filter((m) => !m.email).length,
      address: scopedMembers.filter((m) => !m.address).length,
      photo: scopedMembers.filter((m) => !m.photoUrl).length,
      department: scopedMembers.filter((m) => m.departments.length === 0)
        .length,
    };
    const complete = scopedMembers.filter(isProfileComplete).length;
    const incomplete = total - complete;
    const affected = scopedMembers
      .filter((m) => !isProfileComplete(m))
      .map((m) => ({
        member: m,
        missingFields: [
          !m.photoUrl && "Photo",
          !m.phone && "Phone",
          !m.email && "Email",
          !m.address && "Address",
          m.departments.length === 0 && "Department",
        ].filter(Boolean),
      }));

    return { total, complete, incomplete, missing, affected };
  }, [scopedMembers]);

  const growthSummary = useMemo(() => {
    if (growth.length === 0) return null;
    const starting = growth[0].total;
    const ending = growth[growth.length - 1].total;
    const netGrowth = ending - starting;
    const growthPct = starting
      ? ((netGrowth / starting) * 100).toFixed(1)
      : "0.0";
    return {
      starting,
      ending,
      netGrowth,
      growthPct,
      newMembers: newMembersInPeriod.length,
      inactiveMembers: memberStatusBreakdown.inactive,
    };
  }, [growth, newMembersInPeriod, memberStatusBreakdown]);

  const birthdayStats = useMemo(() => {
    const today = new Date();
    const entries = scopedMembers
      .map((m) => ({ member: m, birthday: getNextBirthday(m.dateOfBirth) }))
      .filter((e) => e.birthday);

    const thisMonth = entries.filter(
      (e) =>
        e.birthday.next.getMonth() === today.getMonth() &&
        e.birthday.next.getFullYear() === today.getFullYear(),
    );
    const upcoming = [...entries]
      .sort((a, b) => a.birthday.daysAway - b.birthday.daysAway)
      .slice(0, 5);
    const byCategory = CATEGORY_LIST.map((c) => ({
      category: c,
      count: thisMonth.filter((e) => e.member.category === c).length,
    }));

    return { thisMonthCount: thisMonth.length, upcoming, byCategory };
  }, [scopedMembers]);

  const eventStats = useMemo(() => {
    const today = new Date();
    const total = events.length;
    const upcoming = events.filter((e) => new Date(e.date) >= today).length;
    const completed = total - upcoming;

    const typeMap = new Map();
    events.forEach((e) => {
      typeMap.set(e.type, (typeMap.get(e.type) ?? 0) + 1);
    });
    const byType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    return { total, upcoming, completed, byType };
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return [...events]
      .filter((e) => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

  const keyInsights = useMemo(() => {
    const insights = [];

    if (isSuperAdmin(user) && growthSummary) {
      const isPositive = Number(growthSummary.growthPct) >= 0;
      insights.push(
        `Membership ${isPositive ? "increased" : "decreased"} by ${Math.abs(
          Number(growthSummary.growthPct),
        )}% over the selected period.`,
      );
    }

    if (isSuperAdmin(user)) {
      const attendancePositive = Number(attendanceStats.changePct) >= 0;
      insights.push(
        `Average attendance ${attendancePositive ? "increased" : "decreased"} by ${Math.abs(
          Number(attendanceStats.changePct),
        )}% compared with the previous period.`,
      );
    }

    insights.push(
      `${newMembersInPeriod.length} new member${newMembersInPeriod.length === 1 ? "" : "s"} joined during the selected period.`,
    );
    insights.push(
      `${profileCompletion.incomplete} member${profileCompletion.incomplete === 1 ? "" : "s"} have incomplete profiles.`,
    );
    insights.push(
      `${memberStatusBreakdown.inactive} member${memberStatusBreakdown.inactive === 1 ? "" : "s"} ${
        memberStatusBreakdown.inactive === 1 ? "is" : "are"
      } currently inactive.`,
    );

    if (
      isSuperAdmin(user) &&
      departmentBreakdown.length > 0 &&
      departmentBreakdown[0].workerCount > 0
    ) {
      insights.push(
        `${departmentBreakdown[0].name} has the highest number of workers (${departmentBreakdown[0].workerCount}).`,
      );
    }

    insights.push(
      `${birthdayStats.thisMonthCount} birthday${birthdayStats.thisMonthCount === 1 ? "" : "s"} this month.`,
    );
    insights.push(
      `${eventStats.upcoming} event${eventStats.upcoming === 1 ? "" : "s"} scheduled.`,
    );
    return insights;
  }, [
    user,
    growthSummary,
    attendanceStats,
    newMembersInPeriod,
    profileCompletion,
    memberStatusBreakdown,
    departmentBreakdown,
    birthdayStats,
    eventStats,
  ]);

  function handleGenerate() {
    toast.success(`Report updated for ${period}`);
  }

  function handlePrint() {
    window.print();
  }

  function handleExportAll() {
    exportToExcel(
      [
        {
          name: "Overview",
          reportName: "Church Reports Overview",
          period,
          columns: ["Metric", "Value"],
          rows: [
            ["Total Members", overallStats.total],
            ["Active Members", overallStats.active],
            ["Inactive Members", overallStats.inactive],
            ["New Members", overallStats.newMembers],
            ["Workers", overallStats.workers],
            ["Total Attendance", overallStats.totalAttendance],
            ["Average Attendance", overallStats.avgAttendance],
            ["Profile Completion", `${overallStats.profileCompletionPct}%`],
          ],
        },
      ],
      "reports-overview.xlsx",
    );
  }

  async function handleCreateMember(formData) {
    try {
      const created = await createMember(formData);
      setMembers((prev) => [...prev, created]);
      toast.success(`${formData.firstName} ${formData.lastName} was added`);
      setIsAddMemberOpen(false);
    } catch {
      toast.error("Something went wrong adding this member.");
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading reports..." />;
  }

  const showChurchWideSections = isSuperAdmin(user);

  return (
    <div className="space-y-6">
      <ReportsHeader
        period={period}
        onPeriodChange={setPeriod}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
        onGenerate={handleGenerate}
        onPrint={handlePrint}
        onExportAll={handleExportAll}
      />

      <OverallStatsSection stats={overallStats} period={period} />

      {showChurchWideSections && (
        <MembershipGrowthReport
          growth={growth}
          summary={growthSummary}
          period={period}
        />
      )}

      {showChurchWideSections && <CategoryGrowthSection members={members} />}

      {showChurchWideSections ? (
        <MembershipDemographicsSection
          categoryBreakdown={categoryBreakdown}
          genderBreakdown={genderBreakdown}
          total={scopedMembers.length}
        />
      ) : (
        <MembershipDemographicsSection
          categoryBreakdown={[]}
          genderBreakdown={genderBreakdown}
          total={scopedMembers.length}
        />
      )}

      {showChurchWideSections && (
        <DepartmentReport
          departments={departmentBreakdown}
          members={members}
          period={period}
        />
      )}

      {showChurchWideSections && (
        <AttendanceReport
          records={attendanceInPeriod}
          stats={attendanceStats}
          period={period}
        />
      )}

      <NewMembersReport
        newMembers={newMembersInPeriod}
        breakdown={newMembersBreakdown}
        period={period}
      />

      <MemberStatusReport
        breakdown={memberStatusBreakdown}
        members={scopedMembers}
        period={period}
      />

      <ProfileCompletionReport completion={profileCompletion} period={period} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BirthdayReport stats={birthdayStats} />
        <EventsReport stats={eventStats} events={upcomingEvents} />
      </div>

      <KeyInsightsSection insights={keyInsights} />

      <QuickReportActions
        user={user}
        onAddMember={() => setIsAddMemberOpen(true)}
      />

      <MemberForm
        member={null}
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSave={handleCreateMember}
        lockedCategory={undefined}
      />
    </div>
  );
}
