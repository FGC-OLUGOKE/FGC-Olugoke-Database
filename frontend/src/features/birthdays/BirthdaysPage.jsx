import { useEffect, useMemo, useState } from "react";
import BirthdayHeader from "./components/BirthdayHeader";
import BirthdayStats from "./components/BirthdayStats";
import NextBirthdayCard from "./components/NextBirthdayCard";
import TodaysBirthdays from "./components/TodaysBirthdays";
import BirthdaySearchAndFilters from "./components/BirthdaySearchAndFilters";
import BirthdayCalendar from "./components/BirthdayCalendar";
import SelectedDateBirthdays from "./components/SelectedDateBirthdays";
import BirthdayList from "./components/BirthdayList";
import BirthdayDetailModal from "./components/BirthdayDetailModal";
import LoadingState from "../../components/ui/LoadingState";
import Pagination from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/ToastProvider";
import { getMembers, updateMember } from "../members/api";
import { getNextBirthday } from "../../lib/birthdayUtils";
import MemberDetailsDrawer from "../members/components/MemberDetailsDrawer";
import MemberForm from "../members/components/MemberForm";

const PAGE_SIZE = 10;

function getTimePeriodRange(period, today) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const dow = start.getDay();

  switch (period) {
    case "Today":
      return [start, new Date(start)];
    case "This Week": {
      const end = new Date(start);
      end.setDate(start.getDate() + (6 - dow));
      return [start, end];
    }
    case "Next Week": {
      const endThisWeek = new Date(start);
      endThisWeek.setDate(start.getDate() + (6 - dow));
      const nextStart = new Date(endThisWeek);
      nextStart.setDate(endThisWeek.getDate() + 1);
      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextStart.getDate() + 6);
      return [nextStart, nextEnd];
    }
    case "This Month":
      return [start, new Date(start.getFullYear(), start.getMonth() + 1, 0)];
    case "Next Month":
      return [
        new Date(start.getFullYear(), start.getMonth() + 1, 1),
        new Date(start.getFullYear(), start.getMonth() + 2, 0),
      ];
    default:
      return null; // "All Upcoming"
  }
}

function matchesTimePeriod(nextDate, period, today) {
  const range = getTimePeriodRange(period, today);
  if (!range) return true;
  const [start, end] = range;
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);
  return nextDate >= start && nextDate <= endOfDay;
}

/**
 * BirthdaysPage
 *
 * Entirely derived from Members data (getMembers()) — there's no
 * separate "birthdays" entity or mock dataset. Reuses
 * MemberDetailsDrawer and MemberForm directly for "View Full
 * Profile" / "Edit Member" so those stay the single source of truth
 * for member editing, rather than duplicating that UI here.
 */
export default function BirthdaysPage() {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [timePeriod, setTimePeriod] = useState("All Upcoming");
  const [category, setCategory] = useState("All");
  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [sort, setSort] = useState("nearest");
  const [page, setPage] = useState(1);

  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  const [birthdayModalEntry, setBirthdayModalEntry] = useState(null);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);

  const [profileMember, setProfileMember] = useState(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const [formMember, setFormMember] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getMembers()
      .then((data) => {
        if (isMounted) setMembers(data);
      })
      .catch(() => {
        if (isMounted) toast.error("Couldn't load birthdays. Try refreshing.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const birthdayEntries = useMemo(() => {
    return members
      .map((member) => ({ member, birthday: getNextBirthday(member.dateOfBirth) }))
      .filter((entry) => entry.birthday !== null);
  }, [members]);

  const todayEntries = useMemo(
    () => birthdayEntries.filter((e) => e.birthday.daysAway === 0),
    [birthdayEntries]
  );

  const weekCount = useMemo(() => {
    const today = new Date();
    const [, end] = getTimePeriodRange("This Week", today);
    return birthdayEntries.filter((e) => e.birthday.next <= end).length;
  }, [birthdayEntries]);

  const nextWeekCount = useMemo(() => {
    const today = new Date();
    const [start, end] = getTimePeriodRange("Next Week", today);
    return birthdayEntries.filter((e) => e.birthday.next >= start && e.birthday.next <= end).length;
  }, [birthdayEntries]);

  const monthCount = useMemo(() => {
    const today = new Date();
    const [, end] = getTimePeriodRange("This Month", today);
    return birthdayEntries.filter((e) => e.birthday.next <= end).length;
  }, [birthdayEntries]);

  // "Next Birthday" means the closest UPCOMING one — someone whose
  // birthday is today belongs to Today's Birthdays instead, not here.
  // Without excluding daysAway === 0, a birthday happening today would
  // always win (since 0 is the smallest possible value), duplicating
  // that member into both sections.
  const nextEntry = useMemo(() => {
    const upcoming = birthdayEntries.filter((e) => e.birthday.daysAway > 0);
    if (upcoming.length === 0) return null;
    return [...upcoming].sort((a, b) => a.birthday.daysAway - b.birthday.daysAway)[0];
  }, [birthdayEntries]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const today = new Date();

    return birthdayEntries.filter(({ member, birthday }) => {
      const matchesSearch =
        !query ||
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) ||
        member.departments.some((d) => d.toLowerCase().includes(query)) ||
        member.category.toLowerCase().includes(query);

      const matchesCategory = category === "All" || member.category === category;
      const matchesDepartment =
        department === "All Departments" || member.departments.includes(department);
      const matchesStatus = status === "All Status" || member.status === status;
      const matchesPeriod = matchesTimePeriod(birthday.next, timePeriod, today);

      return matchesSearch && matchesCategory && matchesDepartment && matchesStatus && matchesPeriod;
    });
  }, [birthdayEntries, search, category, department, status, timePeriod]);

  const sortedEntries = useMemo(() => {
    const result = [...filteredEntries];
    result.sort((a, b) => {
      switch (sort) {
        case "nearest":
          return a.birthday.daysAway - b.birthday.daysAway;
        case "furthest":
          return b.birthday.daysAway - a.birthday.daysAway;
        case "az":
          return `${a.member.firstName} ${a.member.lastName}`.localeCompare(
            `${b.member.firstName} ${b.member.lastName}`
          );
        case "za":
          return `${b.member.firstName} ${b.member.lastName}`.localeCompare(
            `${a.member.firstName} ${a.member.lastName}`
          );
        case "youngest":
          return a.birthday.turningAge - b.birthday.turningAge;
        case "oldest":
          return b.birthday.turningAge - a.birthday.turningAge;
        default:
          return 0;
      }
    });
    return result;
  }, [filteredEntries, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedEntries.slice(start, start + PAGE_SIZE);
  }, [sortedEntries, currentPage]);

  const selectedDateMembers = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return members.filter((m) => {
      if (!m.dateOfBirth) return false;
      const dob = new Date(m.dateOfBirth);
      return dob.getMonth() === selectedCalendarDate.getMonth() && dob.getDate() === selectedCalendarDate.getDate();
    });
  }, [members, selectedCalendarDate]);

  function handleViewBirthday(member) {
    const entry = birthdayEntries.find((e) => e.member.id === member.id);
    setBirthdayModalEntry(entry ?? { member, birthday: null });
    setIsBirthdayModalOpen(true);
  }

  function handleCloseBirthdayModal() {
    setIsBirthdayModalOpen(false);
  }

  function handleViewFullProfile(member) {
    setIsBirthdayModalOpen(false);
    setProfileMember(member);
    setIsProfileDrawerOpen(true);
  }

  function handleCloseProfileDrawer() {
    setIsProfileDrawerOpen(false);
  }

  function handleEditMember(member) {
    setIsBirthdayModalOpen(false);
    setIsProfileDrawerOpen(false);
    setFormMember(member);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  async function handleSaveMember(formData) {
    try {
      await updateMember(formMember.id, formData);
      setMembers((prev) => prev.map((m) => (m.id === formMember.id ? { ...m, ...formData } : m)));
      toast.success(`${formData.firstName} ${formData.lastName} was updated`);
      setIsFormOpen(false);
    } catch {
      toast.error("Something went wrong saving this member.");
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading birthdays..." />;
  }

  return (
    <div className="space-y-6">
      <BirthdayHeader todayCount={todayEntries.length} weekCount={weekCount} monthCount={monthCount} />

      <BirthdayStats
        todayCount={todayEntries.length}
        weekCount={weekCount}
        nextWeekCount={nextWeekCount}
        monthCount={monthCount}
      />

      <NextBirthdayCard entry={nextEntry} onSelect={handleViewBirthday} />

      <TodaysBirthdays entries={todayEntries} onSelect={handleViewBirthday} />

      <BirthdaySearchAndFilters
        search={search}
        onSearchChange={setSearch}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        category={category}
        onCategoryChange={setCategory}
        department={department}
        onDepartmentChange={setDepartment}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BirthdayCalendar
          members={members}
          selectedDate={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
        />
        <SelectedDateBirthdays
          date={selectedCalendarDate}
          members={selectedDateMembers}
          onSelect={handleViewBirthday}
          onClear={() => setSelectedCalendarDate(null)}
        />
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-900">All Upcoming Birthdays</h2>
        <BirthdayList
          entries={pageEntries}
          groupByTime={sort === "nearest" || sort === "furthest"}
          onView={handleViewBirthday}
          onEdit={handleEditMember}
        />
        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          totalItems={sortedEntries.length}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          itemLabel="birthdays"
        />
      </div>

      <BirthdayDetailModal
        member={birthdayModalEntry?.member}
        birthday={birthdayModalEntry?.birthday}
        isOpen={isBirthdayModalOpen}
        onClose={handleCloseBirthdayModal}
        onViewProfile={handleViewFullProfile}
        onEdit={handleEditMember}
      />

      <MemberDetailsDrawer
        member={profileMember}
        isOpen={isProfileDrawerOpen}
        onClose={handleCloseProfileDrawer}
        onEdit={handleEditMember}
      />

      <MemberForm
        member={formMember}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveMember}
      />
    </div>
  );
}
