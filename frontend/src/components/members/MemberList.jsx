import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";

const MemberList = ({
  members,
  onManage,
  onEdit,
}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target)
    ) {
      setOpenMenu(null);
    }
  };

  const handleEscape = (e) => {
    if (e.key === "Escape") {
      setOpenMenu(null);
    }
  };

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  document.addEventListener(
    "keydown",
    handleEscape
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );

    document.removeEventListener(
      "keydown",
      handleEscape
    );
  };
}, []);

  return (
    <section className="mt-8 rounded-[30px] border border-slate-200 bg-white shadow-sm">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">

        <div>

          <h2 className="text-2xl font-bold text-slate-900">
            Members Directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {members.length} registered members
          </p>

        </div>

        <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          {members.length} Members
        </div>

      </div>

      {/* Desktop */}

      <div className="hidden overflow-x-auto xl:block">

        <table className="w-full">

          <thead className="sticky top-0 z-10 bg-slate-50">

            <tr className="border-b border-slate-200 text-left">

              <th className="px-8 py-5 text-sm font-semibold text-slate-500">
                Member
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                Department
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                Category
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                Status
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                Joined
              </th>

              <th className="px-8 py-5 text-right text-sm font-semibold text-slate-500">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {members.map((member) => (

              <tr
                key={member.id}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >

                {/* Member */}

                <td className="px-8 py-5">

                  <div className="flex items-center gap-4">

                    <img
                      src={member.picture}
                      alt={member.firstName}
                      className="h-16 w-16 rounded-2xl object-cover shadow-sm"
                    />

                    <div>

                      <h3 className="font-semibold text-slate-900">

                        {member.title && `${member.title} `}

                        {member.firstName} {member.lastName}

                      </h3>

                      <div className="mt-2 flex items-center gap-5 text-sm text-slate-500">

                        <span className="flex items-center gap-2">

                          <Mail size={14} />

                          {member.email || "No email"}

                        </span>

                        <span className="flex items-center gap-2">

                          <Phone size={14} />

                          {member.phone}

                        </span>

                      </div>

                    </div>

                  </div>

                </td>

                {/* Department */}

                <td className="px-6 py-5">

                  <span className="rounded-full bg-[#154d78]/10 px-4 py-2 text-sm font-semibold text-[#154d78]">

                    {member.department}

                  </span>

                </td>

                {/* Category */}

                <td className="px-6 py-5">

                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm">

                    {member.category}

                  </span>

                </td>

                {/* Status */}

                <td className="px-6 py-5">

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                      member.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />

                    {member.status}
                  </span>

                </td>

                {/* Joined */}

                <td className="px-6 py-5 text-sm text-slate-500">

                  {member.dateJoined || "--"}

                </td>

                {/* Actions */}

                <td ref={openMenu === member.id ? menuRef : null} className="relative px-8 py-5 text-right">

                  <button
                    onClick={() =>
                      setOpenMenu(
                        openMenu === member.id ? null : member.id
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-[#154d78] hover:text-[#154d78]"
                  >
                    Manage

                    <span
                      className={`transition ${
                        openMenu === member.id
                          ? "rotate-180"
                          : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {openMenu === member.id && (

                    <div className="absolute right-8 top-14 z-[9999] mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-2xl">

                      <button
                        onClick={() => {
                          onManage(member);
                          setOpenMenu(null);
                        }}
                        className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm transition hover:bg-slate-50"
                      >
                        <Eye size={17} />

                        View Profile
                      </button>

                      <button
                        onClick={() => {
                          onEdit(member);
                          setOpenMenu(null);
                        }}
                        className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm transition hover:bg-slate-50"
                      >
                        <Pencil size={17} />

                        Edit Member
                      </button>

                      <button
                        className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={17} />

                        Delete Member
                      </button>                 
                    </div>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* Mobile View */}

      <div className="divide-y divide-slate-100 xl:hidden">

        {members.map((member) => (

          <div
            key={member.id}
            className="p-6 transition hover:bg-slate-50"
          >

            <div className="flex items-start gap-4">

              <img
                src={member.picture}
                alt={member.firstName}
                className="h-20 w-20 rounded-2xl object-cover shadow-sm"
              />

              <div className="min-w-0 flex-1">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h3 className="text-lg font-semibold text-slate-900">

                      {member.title && `${member.title} `}
                      {member.firstName} {member.lastName}

                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {member.email || "No Email"}
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setOpenMenu(
                        openMenu === member.id ? null : member.id
                      )
                    }
                    className="rounded-xl p-2 transition hover:bg-slate-100"
                  >
                    <MoreVertical size={18} />
                  </button>

                </div>

                <div className="mt-5 flex flex-wrap gap-2">

                  <span className="rounded-full bg-[#154d78]/10 px-3 py-1 text-xs font-semibold text-[#154d78]">
                    {member.department}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                    {member.category}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      member.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {member.status}
                  </span>

                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-500">

                  <p>
                    <span className="font-medium text-slate-700">
                      Phone:
                    </span>{" "}
                    {member.phone}
                  </p>

                  <p>
                    <span className="font-medium text-slate-700">
                      Joined:
                    </span>{" "}
                    {member.dateJoined || "--"}
                  </p>

                </div>

                {openMenu === member.id && (

                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">

                    <button
                      onClick={() => {
                        onManage(member);
                        setOpenMenu(null);
                      }}
                      className="block w-full border-b border-slate-100 px-5 py-4 text-left text-sm transition hover:bg-slate-50"
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() => {
                        onEdit(member);
                        setOpenMenu(null);
                      }}
                      className="block w-full border-b border-slate-100 px-5 py-4 text-left text-sm transition hover:bg-slate-50"
                    >
                      Edit Member
                    </button>

                    <button
                      className="block w-full px-5 py-4 text-left text-sm text-red-600 transition hover:bg-red-50"
                    >
                      Delete Member
                    </button>

                  </div>

                )}

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* Pagination */}

      <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-8 py-5 sm:flex-row">

        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold">1</span> -
          <span className="font-semibold">
            {" "}
            {members.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold">
            {members.length}
          </span>{" "}
          members
        </p>

        <div className="flex items-center gap-2">

          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>

          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#154d78] font-semibold text-white">
            1
          </button>

          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-100">
            <ChevronRight size={18} />
          </button>

        </div>

      </div>

    </section>
  );
};

export default MemberList;