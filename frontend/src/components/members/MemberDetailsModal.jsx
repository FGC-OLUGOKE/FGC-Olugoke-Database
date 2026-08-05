import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  User,
  Heart,
  Building2,
  Pencil,
  Trash2,
} from "lucide-react";

const MemberDetailsModal = ({
  member,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !member) return null;

  return (
    <>
      {/* Overlay */}

      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />

      {/* Drawer */}

      <div className="fixed right-0 top-0 z-50 flex h-screen w-full justify-end">

        <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">

          {/* Header */}

          <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Member Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete member information
              </p>

            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-3 transition hover:bg-slate-100"
            >
              <X size={22} />
            </button>

          </div>

          {/* Scrollable Body */}

          <div className="flex-1 overflow-y-auto">

            {/* Hero */}

            <div className="border-b border-slate-100 px-8 py-8">

              <div className="flex flex-col items-center">

                <img
                  src={member.picture}
                  alt={member.firstName}
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-[#154d78]/10"
                />

                <h2 className="mt-5 text-3xl font-bold text-slate-900">

                  {member.title && `${member.title} `}
                  {member.firstName} {member.lastName}

                </h2>

                <p className="mt-2 text-slate-500">
                  {member.department}
                </p>

                <span
                  className={`mt-4 rounded-full px-5 py-2 text-sm font-semibold ${
                    member.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {member.status}
                </span>

                <button
                  onClick={() => onEdit(member)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#154d78] px-6 py-3 font-semibold text-white transition hover:bg-[#103c5d]"
                >
                  <Pencil size={18} />

                  Edit Member
                </button>

              </div>

            </div>

            {/* Personal Information */}

            <div className="space-y-8 p-8">

              <section className="rounded-3xl border border-slate-200 p-6">

                <div className="mb-6 flex items-center gap-3">

                  <User
                    size={22}
                    className="text-[#154d78]"
                  />

                  <h3 className="text-xl font-bold">
                    Personal Information
                  </h3>

                </div>

                <div className="grid grid-cols-2 gap-6">

                  <div>

                    <p className="text-sm text-slate-500">
                      Gender
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.gender}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Category
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.category}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Marital Status
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.maritalStatus || "Not Provided"}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Occupation
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.occupation || "Not Provided"}
                    </p>

                  </div>

                </div>

              </section>
                            {/* Contact Information */}

              <section className="rounded-3xl border border-slate-200 p-6">

                <div className="mb-6 flex items-center gap-3">

                  <Phone
                    size={22}
                    className="text-[#154d78]"
                  />

                  <h3 className="text-xl font-bold">
                    Contact Information
                  </h3>

                </div>

                <div className="space-y-5">

                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                    <div className="flex items-center gap-3">

                      <Mail
                        size={18}
                        className="text-slate-400"
                      />

                      <span className="text-slate-500">
                        Email
                      </span>

                    </div>

                    <span className="font-medium">
                      {member.email || "Not Provided"}
                    </span>

                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                    <div className="flex items-center gap-3">

                      <Phone
                        size={18}
                        className="text-slate-400"
                      />

                      <span className="text-slate-500">
                        Phone
                      </span>

                    </div>

                    <span className="font-medium">
                      {member.phone}
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <MapPin
                        size={18}
                        className="text-slate-400"
                      />

                      <span className="text-slate-500">
                        Address
                      </span>

                    </div>

                    <span className="font-medium text-right">
                      {member.address || "Not Provided"}
                    </span>

                  </div>

                </div>

              </section>

              {/* Church Information */}

              <section className="rounded-3xl border border-slate-200 p-6">

                <div className="mb-6 flex items-center gap-3">

                  <Building2
                    size={22}
                    className="text-[#154d78]"
                  />

                  <h3 className="text-xl font-bold">
                    Church Information
                  </h3>

                </div>

                <div className="grid grid-cols-2 gap-6">

                  <div>

                    <p className="text-sm text-slate-500">
                      Department
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.department}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Status
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.status}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Date Joined
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.dateJoined || "Not Provided"}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Membership ID
                    </p>

                    <p className="mt-1 font-semibold">
                      #{member.id}
                    </p>

                  </div>

                </div>

              </section>

              {/* Spiritual Information */}

              <section className="rounded-3xl border border-slate-200 p-6">

                <div className="mb-6 flex items-center gap-3">

                  <Heart
                    size={22}
                    className="text-[#154d78]"
                  />

                  <h3 className="text-xl font-bold">
                    Spiritual Information
                  </h3>

                </div>

                <div className="grid grid-cols-2 gap-6">

                  <div>

                    <p className="text-sm text-slate-500">
                      Baptized
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.baptized || "No"}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Worker
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.worker || "No"}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Cell Group
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.cellGroup || "Not Assigned"}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Service Unit
                    </p>

                    <p className="mt-1 font-semibold">
                      {member.department}
                    </p>

                  </div>

                </div>

              </section>

            </div>

          </div>

          {/* Footer */}

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-8 py-6">

            <button className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50">

              <Trash2 size={18} />

              Delete Member

            </button>

            <button
              onClick={onClose}
              className="rounded-2xl bg-[#154d78] px-8 py-3 font-semibold text-white transition hover:bg-[#103c5d]"
            >
              Close
            </button>

          </div>

        </div>

      </div>

    </>
  );
};

export default MemberDetailsModal;