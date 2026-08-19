import { useEffect, useMemo, useState } from "react";
import ReportsHeader from "./components/ReportsHeader";
import OverallStatsSection from "./components/OverallStatsSection";
import MembershipGrowthReport from "./components/MembershipGrowthReport";
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

const CATEGORY_COLORS = { Children: "#d6b447", Teenager: "#4a2969", Youth: "#154d78", Adult: "#9e263b" };
const GENDER_COLORS = { Male: "#154d78", Female: "#4a2969" };
const CATEGORY_LIST = ["Children", "Teenager", "Youth", "Adult"];

function isProfileComplete(m) {
<<<<<<< HEAD
  return Boolean(m.phone && m.email && m.address && m.photoUrl && m.department);
=======
  return Boolean(m.phone && m.email && m.address && m.photoUrl && m.departments.length > 0);
>>>>>>> 72c3eaa55af4aca31cc89465f0cdd46eee6d5900
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
      return { start: new Date(today.getFullYear(), today.getMonth() - 2, 1), end: monthEnd };
    case "Last 6 Months":
      return { start: new Date(today.getFullYear(), today.getMonth() - 5, 1), end: monthEnd };
    case "This Year": {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "Custom Date Range": {
      if (!customStart || !customEnd) return { start: monthStart, end: monthEnd };
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
 * Answers "what does the church's data tell us over a selected
 * period" — distinct from Dashboard's "what's happening right now."
 * Fetches raw datasets once via getReportsData() (which itself just
 * calls each feature's own api.js), then every report section below
 * is a derived useMemo over that data + the current report period.
 * Nothing here owns data — Members/Departments/Attendance/Events
 * remain the single source of truth throughout.
 */
export default function ReportsPage() {
  const toast = useToast();
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

  const range = useMemo(
    () => getPeriodRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );
  const previousRange = useMemo(() => getPreviousPeriodRange(range), [range]);

  const newMembersInPeriod = useMemo(
    () => members.filter((m) => inRange(m.dateJoined, range)),
    [members, range]
  );

  const attendanceInPeriod = useMemo(
    () => attendance.filter((a) => inRange(a.date, range)),
    [attendance, range]
  );
  const attendancePrevPeriod = useMemo(
    () => attendance.filter((a) => inRange(a.date, previousRange)),
    [attendance, previousRange]
  );

  const overallStats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "Active").length;
    const inactive = members.filter((m) => m.status === "Inactive").length;
    const workers = members.filter((m) => m.worker).length;
    const totalAttendance = attendanceInPeriod.reduce((sum, a) => sum + a.total, 0);
    const avgAttendance = attendanceInPeriod.length
      ? Math.round(totalAttendance / attendanceInPeriod.length)
      : 0;
    const completeCount = members.filter(isProfileComplete).length;
    const profileCompletionPct = total ? Math.round((completeCount / total) * 100) : 0;

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
  }, [members, attendanceInPeriod, newMembersInPeriod]);

  const categoryBreakdown = useMemo(
    () =>
      CATEGORY_LIST.map((name) => ({
        name,
        value: members.filter((m) => m.category === name).length,
        color: CATEGORY_COLORS[name],
      })),
    [members]
  );

  const genderBreakdown = useMemo(
    () =>
      ["Male", "Female"].map((name) => ({
        name,
        value: members.filter((m) => m.gender === name).length,
        color: GENDER_COLORS[name],
      })),
    [members]
  );

  const departmentBreakdown = useMemo(() => {
    const totalWorkers = members.filter((m) => m.worker).length || 1;
    return departments
      .map((dept) => {
<<<<<<< HEAD
        const count = members.filter((m) => m.department === dept.name).length;
        const workerCount = members.filter((m) => m.department === dept.name && m.worker).length;
=======
        const count = members.filter((m) => m.departments.includes(dept.name)).length;
        const workerCount = members.filter((m) => m.departments.includes(dept.name) && m.worker).length;
>>>>>>> 72c3eaa55af4aca31cc89465f0cdd46eee6d5900
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
    const highest = attendanceInPeriod.reduce((max, a) => (a.total > max.total ? a : max));
    const lowest = attendanceInPeriod.reduce((min, a) => (a.total < min.total ? a : min));

    const prevTotal = attendancePrevPeriod.reduce((s, a) => s + a.total, 0);
    const prevAvg = attendancePrevPeriod.length ? prevTotal / attendancePrevPeriod.length : 0;
    const changePct = prevAvg ? (((average - prevAvg) / prevAvg) * 100).toFixed(1) : "0.0";

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
    const total = members.length;
    const active = members.filter((m) => m.status === "Active").length;
    const inactive = total - active;
    return {
      active,
      inactive,
      total,
      activePct: total ? Math.round((active / total) * 100) : 0,
      inactivePct: total ? Math.round((inactive / total) * 100) : 0,
    };
  }, [members]);

  const profileCompletion = useMemo(() => {
    const total = members.length;
    const missing = {
      phone: members.filter((m) => !m.phone).length,
      email: members.filter((m) => !m.email).length,
      address: members.filter((m) => !m.address).length,
      photo: members.filter((m) => !m.photoUrl).length,
<<<<<<< HEAD
      department: members.filter((m) => !m.department).length,
=======
      department: members.filter((m) => m.departments.length === 0).length,
>>>>>>> 72c3eaa55af4aca31cc89465f0cdd46eee6d5900
    };
    const complete = members.filter(isProfileComplete).length;
    const incomplete = total - complete;
    const affected = members
      .filter((m) => !isProfileComplete(m))
      .map((m) => ({
        member: m,
        missingFields: [
          !m.photoUrl && "Photo",
          !m.phone && "Phone",
          !m.email && "Email",
          !m.address && "Address",
<<<<<<< HEAD
          !m.department && "Department",
=======
          m.departments.length === 0 && "Department",
>>>>>>> 72c3eaa55af4aca31cc89465f0cdd46eee6d5900
        ].filter(Boolean),
      }));

    return { total, complete, incomplete, missing, affected };
  }, [members]);

  const growthSummary = useMemo(() => {
    if (growth.length === 0) return null;
    const starting = growth[0].total;
    const ending = growth[growth.length - 1].total;
    const netGrowth = ending - starting;
    const growthPct = starting ? ((netGrowth / starting) * 100).toFixed(1) : "0.0";
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
    const entries = members
      .map((m) => ({ member: m, birthday: getNextBirthday(m.dateOfBirth) }))
      .filter((e) => e.birthday);

    const thisMonth = entries.filter(
      (e) =>
        e.birthday.next.getMonth() === today.getMonth() &&
        e.birthday.next.getFullYear() === today.getFullYear()
    );
    const upcoming = [...entries].sort((a, b) => a.birthday.daysAway - b.birthday.daysAway).slice(0, 5);
    const byCategory = CATEGORY_LIST.map((c) => ({
      category: c,
      count: thisMonth.filter((e) => e.member.category === c).length,
    }));

    return { thisMonthCount: thisMonth.length, upcoming, byCategory };
  }, [members]);

  const eventStats = useMemo(() => {
    const today = new Date();
    const total = events.length;
    const upcoming = events.filter((e) => new Date(e.date) >= today).length;
    const completed = total - upcoming;

    const typeMap = new Map();
    events.forEach((e) => {
      typeMap.set(e.type, (typeMap.get(e.type) ?? 0) + 1);
    });
    const byType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

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
    if (growthSummary) {
      const isPositive = Number(growthSummary.growthPct) >= 0;
      insights.push(
        `Membership ${isPositive ? "increased" : "decreased"} by ${Math.abs(
          Number(growthSummary.growthPct)
        )}% over the selected period.`
      );
    }
    const attendancePositive = Number(attendanceStats.changePct) >= 0;
    insights.push(
      `Average attendance ${attendancePositive ? "increased" : "decreased"} by ${Math.abs(
        Number(attendanceStats.changePct)
      )}% compared with the previous period.`
    );
    insights.push(
      `${newMembersInPeriod.length} new member${newMembersInPeriod.length === 1 ? "" : "s"} joined during the selected period.`
    );
    insights.push(
      `${profileCompletion.incomplete} member${profileCompletion.incomplete === 1 ? "" : "s"} have incomplete profiles.`
    );
    insights.push(
      `${memberStatusBreakdown.inactive} member${memberStatusBreakdown.inactive === 1 ? "" : "s"} ${
        memberStatusBreakdown.inactive === 1 ? "is" : "are"
      } currently inactive.`
    );
    if (departmentBreakdown.length > 0 && departmentBreakdown[0].workerCount > 0) {
      insights.push(
        `${departmentBreakdown[0].name} has the highest number of workers (${departmentBreakdown[0].workerCount}).`
      );
    }
    insights.push(`${birthdayStats.thisMonthCount} birthday${birthdayStats.thisMonthCount === 1 ? "" : "s"} this month.`);
    insights.push(`${eventStats.upcoming} event${eventStats.upcoming === 1 ? "" : "s"} scheduled.`);
    return insights;
  }, [
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
      "reports-overview.xlsx"
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

      <MembershipGrowthReport growth={growth} summary={growthSummary} period={period} />

      <MembershipDemographicsSection
        categoryBreakdown={categoryBreakdown}
        genderBreakdown={genderBreakdown}
        total={members.length}
      />

      <DepartmentReport departments={departmentBreakdown} members={members} period={period} />

      <AttendanceReport records={attendanceInPeriod} stats={attendanceStats} period={period} />

      <NewMembersReport newMembers={newMembersInPeriod} breakdown={newMembersBreakdown} period={period} />

      <MemberStatusReport breakdown={memberStatusBreakdown} members={members} period={period} />

      <ProfileCompletionReport completion={profileCompletion} period={period} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BirthdayReport stats={birthdayStats} />
        <EventsReport stats={eventStats} events={upcomingEvents} />
      </div>

      <KeyInsightsSection insights={keyInsights} />

      <QuickReportActions onAddMember={() => setIsAddMemberOpen(true)} />

      <MemberForm
        member={null}
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSave={handleCreateMember}
      />
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 72c3eaa55af4aca31cc89465f0cdd46eee6d5900
