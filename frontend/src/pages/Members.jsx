import { useState } from "react";
import membersData from "../data/members";

import SearchBar from "../components/members/SearchBar";
import MemberList from "../components/members/MemberList";
import MemberDetailsModal from "../components/members/MemberDetailsModal";
import MemberForm from "../components/members/MemberForm";
import StatsCards from "../components/members/StatsCards";
// import StatCards from "../components/members/StatCards";

const Members = () => {
  const [members] = useState(membersData);

  const [selectedMember, setSelectedMember] = useState(null);

  const [showDetails, setShowDetails] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [editingMember, setEditingMember] = useState(null);

  const handleManage = (member) => {
    setSelectedMember(member);
    setShowDetails(true);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setShowForm(true);
  };

  const handleEditMember = () => {
    setShowDetails(false);
    setEditingMember(selectedMember);
    setShowForm(true);
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Members</p>
            <h2 className="mt-3 text-4xl font-bold">{members.length}</h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Members</p>
            <h2 className="mt-3 text-4xl font-bold text-[#4a2969]">
              {members.filter((m) => m.status === "Active").length}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Departments</p>
            <h2 className="mt-3 text-4xl font-bold text-[#154d78]">
              {new Set(members.map((m) => m.department)).size}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Inactive</p>
            <h2 className="mt-3 text-4xl font-bold text-[#9e263b]">
              {members.filter((m) => m.status !== "Active").length}
            </h2>
          </div>
        </section> <br />
        <SearchBar onAddMember={handleAddMember} />

        <MemberList
          members={members}
          onManage={handleManage}
        />

        <MemberDetailsModal
          member={selectedMember}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          onEdit={handleEditMember}
        />

        <MemberForm
          isOpen={showForm}
          member={editingMember}
          onClose={() => setShowForm(false)}
        />
      </div>
    </main>
  );
};

export default Members;