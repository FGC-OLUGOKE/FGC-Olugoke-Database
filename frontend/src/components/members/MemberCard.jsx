import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlinePencilSquare,
} from "react-icons/hi2";

const MemberCard = ({ member }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-start justify-between">

        {/* Left */}

        <div className="flex gap-4">

          <img
            src={member.picture}
            alt={member.firstName}
            className="h-20 w-20 rounded-xl object-cover"
          />

          <div>

            <h2 className="text-xl font-bold text-slate-800">
              {member.title && `${member.title} `}
              {member.firstName} {member.lastName}
            </h2>

            <p className="mt-1 text-slate-500">
              {member.gender} • {member.category}
            </p>

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">

              {member.phone && (
                <div className="flex items-center gap-2">
                  <HiOutlinePhone />
                  {member.phone}
                </div>
              )}

              {member.email && (
                <div className="flex items-center gap-2">
                  <HiOutlineEnvelope />
                  {member.email}
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Right */}

        <div className="flex flex-col items-end gap-3">

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              member.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {member.status}
          </span>

          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm transition hover:bg-slate-100">

            <HiOutlinePencilSquare />

            Edit

          </button>

        </div>

      </div>

      {/* Bottom */}

      <div className="mt-5 flex flex-wrap gap-2">

        {member.department && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
            {member.department}
          </span>
        )}

        {member.maritalStatus && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
            {member.maritalStatus}
          </span>
        )}

      </div>

    </div>
  );
};

export default MemberCard;