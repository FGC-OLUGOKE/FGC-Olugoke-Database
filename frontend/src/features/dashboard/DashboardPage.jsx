import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import StatsRow from "./components/StatsRow";
import MembershipGrowthSection from "./components/MembershipGrowthSection";
import MembershipByCategorySection from "./components/MembershipByCategorySection";
import GenderDistributionSection from "./components/GenderDistributionSection";
import DepartmentOverviewSection from "./components/DepartmentOverviewSection";
import RecentMembersSection from "./components/RecentMembersSection";
import UpcomingBirthdaysSection from "./components/UpcomingBirthdaysSection";
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

/**
 * DashboardPage
 *
 * Fetches everything through getDashboardData() (features/dashboard/api.js),
 * which itself reuses the Members/Departments api layers as the
 * single source of truth for those datasets. All derived numbers
 * (stats, alerts) are computed here via useMemo from that data —
 * nothing is hardcoded.
 *
 * Note: this page holds its own local `members` state (separate from
 * MembersPage's). Without a shared store/context, quick-adding a
 * member here won't be reflected if you separately navigate to
 * /members in the same session — worth revisiting with real shared
 * state once the backend exists.
 */
export default function DashboardPage() {
  const toast = useToast();
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
        if (isMounted) toast.error("Couldn't load the dashboard. Try refreshing.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === "Active").length,
      newMembersThisMonth: members.filter((m) => {
        const joined = new Date(m.dateJoined);
        return joined.getFullYear() === now.getFullYear() && joined.getMonth() === now.getMonth();
      }).length,
      workersCount: members.filter((m) => m.worker).length,
    };
  }, [members]);

  const needsAttention = useMemo(() => {
    const alerts = [];

    const incompleteProfiles = members.filter((m) => !m.occupation?.trim());
    if (incompleteProfiles.length > 0) {
      alerts.push({
        title: `${incompleteProfiles.length} member${incompleteProfiles.length === 1 ? "" : "s"} with incomplete profiles`,
        description: `${incompleteProfiles
          .map((m) => `${m.firstName} ${m.lastName}`)
          .join(", ")} — missing occupation details.`,
      });
    }

    const inactiveMembers = members.filter((m) => m.status === "Inactive");
    if (inactiveMembers.length > 0) {
      alerts.push({
        title: `${inactiveMembers.length} member${inactiveMembers.length === 1 ? "" : "s"} may need follow-up`,
        description: `${inactiveMembers
          .map((m) => `${m.firstName} ${m.lastName}`)
          .join(", ")} marked Inactive.`,
      });
    }

    const now = new Date();
    const soonConvention = events.find((e) => {
      const daysAway = (new Date(e.date) - now) / (1000 * 60 * 60 * 24);
      return daysAway >= 0 && daysAway <= 30 && e.name.toLowerCase().includes("convention");
    });
    if (soonConvention) {
      alerts.push({
        title: `${soonConvention.name} is coming up`,
        description: `Scheduled for ${new Date(soonConvention.date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })} — confirm venue and logistics.`,
      });
    }

    return alerts;
  }, [members, events]);

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
      <DashboardHeader onAddMember={() => setIsAddMemberOpen(true)} />

      <StatsRow
        totalMembers={stats.totalMembers}
        activeMembers={stats.activeMembers}
        newMembersThisMonth={stats.newMembersThisMonth}
        workersCount={stats.workersCount}
      />

      <QuickActionsSection onAddMember={() => setIsAddMemberOpen(true)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MembershipGrowthSection data={growth} />
        </div>
        <MembershipByCategorySection members={members} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GenderDistributionSection members={members} />
        <DepartmentOverviewSection departments={departments} members={members} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentMembersSection members={members} />
        <UpcomingBirthdaysSection members={members} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingEventsSection events={events} />
        <AttendanceOverviewSection attendance={attendance} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MemberStatusSection members={members} />
        <NeedsAttentionSection alerts={needsAttention} />
      </div>

      <RecentActivitySection activity={activity} />

      <MemberForm
        member={null}
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSave={handleCreateMember}
      />
    </div>
  );
}