import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import StatsRow from "./components/StatsRow";
import MembershipGrowthSection from "./components/MembershipGrowthSection";
import MembershipByCategorySection from "./components/MembershipByCategorySection";
import GenderDistributionSection from "./components/GenderDistributionSection";
import DepartmentOverviewSection from "./components/DepartmentOverviewSection";
import RecentMembersSection from "./components/RecentMembersSection";
import UpcomingEventsSection from "./components/UpcomingEventsSection";
import AttendanceOverviewSection from "./components/AttendanceOverviewSection";
import MemberStatusSection from "./components/MemberStatusSection";
import QuickActionsSection from "./components/QuickActionsSection";
import NeedsAttentionSection from "./components/NeedsAttentionSection";
import RecentActivitySection from "./components/RecentActivitySection";
import LoadingState from "../../components/ui/LoadingState";
import MemberForm from "../members/components/MemberForm";
import { useToast } from "../../components/ui/ToastProvider";
import { getDashboardData } from "./api";
import { createMember } from "../members/api";
import { useAuth } from "../auth/AuthContext";
import {
  getScopedMembers,
  canCreateMember,
  isSuperAdmin,
  isDepartmentAdmin,
} from "../../lib/permissions";

/**
 * DashboardPage
 *
 * Role-scoped: Staff Admins see the exact same
 * components as Super Admin, just fed `scopedMembers` instead of the
 * full church member list — so "Total Members" naturally becomes
 * a department-scoped member total,
 * without needing three separate dashboard implementations.
 *
 * Two sections are intentionally HIDDEN for scoped roles rather than
 * shown with fake-scoped data: Membership Growth and Attendance
 * Overview. Both are backed by church-wide aggregates with no
 * per-department breakdown — showing
 * them "as if" scoped to Youth or Media would just be the full
 * church's numbers mislabeled. Same for Membership by Category (a
 * category-scoped admin's members ARE all one category, so a
 * category breakdown chart is meaningless for them) and Department
 * Overview is hidden for Staff Admins because it is not a
 * department-level view.
 */
export default function DashboardPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [events, setEvents] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getDashboardData()
      .then((data) => {
        if (!isMounted) return;
        setMembers(data.members);
        setDepartments(data.departments);
        setGrowth(data.growth);
        setAttendance(data.attendance);
        setEvents(data.events);
        setActivity(data.activity);
      })
      .catch(() => {
        if (isMounted)
          toast.error("Couldn't load the dashboard. Try refreshing.");
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

  const scopeLabel = useMemo(() => {
    if (isDepartmentAdmin(user)) return `${user.scope} Department`;
    return null;
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      totalMembers: scopedMembers.length,
      activeMembers: scopedMembers.filter((m) => m.status === "Active").length,
      newMembersThisMonth: scopedMembers.filter((m) => {
        const joined = new Date(m.dateJoined);
        return (
          joined.getFullYear() === now.getFullYear() &&
          joined.getMonth() === now.getMonth()
        );
      }).length,
      workersCount: scopedMembers.filter((m) => m.worker).length,
    };
  }, [scopedMembers]);

  const needsAttention = useMemo(() => {
    const alerts = [];

    const incompleteProfiles = scopedMembers.filter(
      (m) => !m.occupation?.trim(),
    );
    if (incompleteProfiles.length > 0) {
      alerts.push({
        title: `${incompleteProfiles.length} member${incompleteProfiles.length === 1 ? "" : "s"} with incomplete profiles`,
        description: `${incompleteProfiles
          .map((m) => `${m.firstName} ${m.lastName}`)
          .join(", ")} — missing occupation details.`,
      });
    }

    const inactiveMembers = scopedMembers.filter(
      (m) => m.status === "Inactive",
    );
    if (inactiveMembers.length > 0) {
      alerts.push({
        title: `${inactiveMembers.length} member${inactiveMembers.length === 1 ? "" : "s"} may need follow-up`,
        description: `${inactiveMembers
          .map((m) => `${m.firstName} ${m.lastName}`)
          .join(", ")} marked Inactive.`,
      });
    }

    if (isSuperAdmin(user)) {
      const now = new Date();
      const soonConvention = events.find((e) => {
        const daysAway = (new Date(e.date) - now) / (1000 * 60 * 60 * 24);
        return (
          daysAway >= 0 &&
          daysAway <= 30 &&
          e.name.toLowerCase().includes("convention")
        );
      });
      if (soonConvention) {
        alerts.push({
          title: `${soonConvention.name} is coming up`,
          description: `Scheduled for ${new Date(
            soonConvention.date,
          ).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })} — confirm venue and logistics.`,
        });
      }
    }

    return alerts;
  }, [scopedMembers, events, user]);

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
    return <LoadingState label="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        scopeLabel={scopeLabel}
        showAddMember={canCreateMember(user)}
        onAddMember={() => setIsAddMemberOpen(true)}
      />

      <StatsRow
        totalMembers={stats.totalMembers}
        activeMembers={stats.activeMembers}
        newMembersThisMonth={stats.newMembersThisMonth}
        workersCount={stats.workersCount}
      />

      <QuickActionsSection
        user={user}
        onAddMember={() => setIsAddMemberOpen(true)}
      />

      {isSuperAdmin(user) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MembershipGrowthSection data={growth} />
          </div>
          <MembershipByCategorySection members={scopedMembers} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GenderDistributionSection members={scopedMembers} />
        {isSuperAdmin(user) && (
          <DepartmentOverviewSection
            departments={departments}
            members={scopedMembers}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentMembersSection members={scopedMembers} />
        {!isDepartmentAdmin(user) && <UpcomingEventsSection events={events} />}
      </div>

      {isSuperAdmin(user) && (
        <AttendanceOverviewSection attendance={attendance} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MemberStatusSection members={scopedMembers} />
        <NeedsAttentionSection alerts={needsAttention} />
      </div>

      <RecentActivitySection activity={activity} />

      {canCreateMember(user) && (
        <MemberForm
          member={null}
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          onSave={handleCreateMember}
          lockedCategory={undefined}
        />
      )}
    </div>
  );
}
