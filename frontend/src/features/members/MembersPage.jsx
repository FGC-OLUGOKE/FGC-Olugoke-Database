import { useMemo, useState } from "react";
import SearchBar from "./components/SearchBar";
import StatsCards from "./components/StatsCards";
import MemberList from "./components/MemberList";
import MemberDetailsDrawer from "./components/MemberDetailsDrawer";
import MemberForm from "./components/MemberForm";
import mockMembers from "./mockData";

/**
 * MembersPage
 *
 * Owns all filter/search/sort state, the selected member, and which
 * drawer (if any) is open. SearchBar, StatsCards, MemberList,
 * MemberDetailsDrawer, and MemberForm all stay pure/controlled —
 * this file is the only place that knows how they connect.
 *
 * `mockMembers` is temporary. Swap it for real data once the API
 * exists — nothing below needs to change to support that.
 */
export default function MembersPage() {
  const [members] = useState(mockMembers);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [sort, setSort] = useState("az");

  const [selectedMember, setSelectedMember] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [formMember, setFormMember] = useState(null); // null = "Add" mode
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    setFormMember(null); // Add mode
    setIsFormOpen(true);
  }

  function handleEdit(member) {
    setFormMember(member); // Edit mode
    setIsFormOpen(true);
    setIsDrawerOpen(false); // close the profile drawer if it was open
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  // Placeholder — this is the seam where your API call goes.
  // No fake persistence happens here on purpose (per the API boundary
  // agreement): the form data is simply logged so you can see it's
  // wired correctly, then handed off wherever your POST/PUT call
  // should live.
  function handleSaveMember(formData) {
    console.log(
      formMember ? "Update member:" : "Create member:",
      formData
    );
    setIsFormOpen(false);
  }

  function handleDelete(member) {
    console.log("Delete member:", member);
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
        <button
          type="button"
          onClick={handleAddNew}
          className="inline-flex items-center justify-center rounded-lg bg-[#154d78] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#123f61] sm:w-auto"
        >
          + New Member
        </button>
      </div>

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
    </div>
  );
}