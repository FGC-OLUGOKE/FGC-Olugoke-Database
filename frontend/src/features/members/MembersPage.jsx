import { useEffect, useMemo, useState } from "react";
import SearchBar from "./components/SearchBar";
import StatsCards from "./components/StatsCards";
import MemberList from "./components/MemberList";
import MemberDetailsDrawer from "./components/MemberDetailsDrawer";
import MemberForm from "./components/MemberForm";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LoadingState from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/ToastProvider";
import { getMembers, createMember, updateMember, deleteMember } from "./api";

/**
 * MembersPage
 *
 * Owns all filter/search/sort state, the selected member, and which
 * drawer (if any) is open. Data comes from features/members/api.js —
 * NOT from mockData directly — so swapping to a real backend later
 * only requires editing api.js. This page just calls getMembers(),
 * createMember(), updateMember(), deleteMember() and doesn't know or
 * care whether those are backed by mock data or a real request.
 */
export default function MembersPage() {
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [sort, setSort] = useState("az");

  const [selectedMember, setSelectedMember] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [formMember, setFormMember] = useState(null); // null = "Add" mode
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [memberPendingDelete, setMemberPendingDelete] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getMembers()
      .then((data) => {
        if (isMounted) setMembers(data);
      })
      .catch(() => {
        if (isMounted) toast.error("Couldn't load members. Try refreshing.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = members.filter((m) => {
      const matchesSearch =
        !query ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.phone.toLowerCase().includes(query) ||
        m.title.toLowerCase().includes(query);

      const matchesCategory = category === "All" || m.category === category;

      const matchesDepartment =
        department === "All Departments" || m.department === department;

      const matchesStatus = status === "All Status" || m.status === status;

      return (
        matchesSearch && matchesCategory && matchesDepartment && matchesStatus
      );
    });

    result = [...result].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();

      switch (sort) {
        case "az":
          return nameA.localeCompare(nameB);
        case "za":
          return nameB.localeCompare(nameA);
        case "newest":
          return new Date(b.dateJoined) - new Date(a.dateJoined);
        case "oldest":
          return new Date(a.dateJoined) - new Date(b.dateJoined);
        default:
          return 0;
      }
    });

    return result;
  }, [members, search, category, department, status, sort]);

  function handleView(member) {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
  }

  function handleAddNew() {
    setFormMember(null);
    setIsFormOpen(true);
  }

  function handleEdit(member) {
    setFormMember(member);
    setIsFormOpen(true);
    setIsDrawerOpen(false);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  // Calls the api.js seam directly. Once that file's functions hit a
  // real backend instead of the simulated mock delay, this code
  // doesn't change at all.
  async function handleSaveMember(formData) {
    try {
      if (formMember) {
        await updateMember(formMember.id, formData);
        setMembers((prev) =>
          prev.map((m) => (m.id === formMember.id ? { ...m, ...formData } : m))
        );
        toast.success(`${formData.firstName} ${formData.lastName} was updated`);
      } else {
        const created = await createMember(formData);
        setMembers((prev) => [...prev, created]);
        toast.success(`${formData.firstName} ${formData.lastName} was added`);
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Something went wrong saving this member.");
    }
  }

  function handleDelete(member) {
    setMemberPendingDelete(member);
  }

  function handleCancelDelete() {
    setMemberPendingDelete(null);
  }

  async function handleConfirmDelete() {
    try {
      await deleteMember(memberPendingDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberPendingDelete.id));
      toast.success(
        `${memberPendingDelete.firstName} ${memberPendingDelete.lastName} was deleted`
      );
    } catch {
      toast.error("Something went wrong deleting this member.");
    } finally {
      setMemberPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all church members from one place.
          </p>
        </div>
        <Button variant="primary" onClick={handleAddNew} className="sm:w-auto">
          + New Member
        </Button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading members..." />
      ) : (
        <>
          {/* Stats reflect the full member base, not the active filters */}
          <StatsCards members={members} />

          <SearchBar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            department={department}
            onDepartmentChange={setDepartment}
            status={status}
            onStatusChange={setStatus}
            sort={sort}
            onSortChange={setSort}
          />

          <MemberList
            members={filteredMembers}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      <MemberDetailsDrawer
        member={selectedMember}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onEdit={handleEdit}
      />

      <MemberForm
        member={formMember}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveMember}
      />

      <ConfirmDialog
        isOpen={Boolean(memberPendingDelete)}
        title="Delete this member?"
        description={
          memberPendingDelete
            ? `This will permanently remove ${memberPendingDelete.firstName} ${memberPendingDelete.lastName} from the church database. This action can't be undone.`
            : ""
        }
        confirmLabel="Delete Member"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}