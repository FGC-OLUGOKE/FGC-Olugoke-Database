import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";
import ExportButton from "../../../components/ui/ExportButton";
import { exportToExcel } from "../../../lib/exportUtils";
import { getCurrentAge } from "../../../lib/birthdayUtils";

export default function NewMembersReport({ newMembers, breakdown, period }) {
  const navigate = useNavigate();

  function handleExport() {
    exportToExcel(
      [
        {
          name: "New Members",
          reportName: "New Members Report",
          period,
          columns: [
            "Full Name",
            "Gender",
            "Category",
            "Date of Birth",
            "Age",
            "Date Joined",
            "Department",
            "Status",
            "Phone Number",
            "Email",
          ],
          rows: newMembers.map((m) => [
            `${m.firstName} ${m.lastName}`,
            m.gender,
            m.category,
            m.dateOfBirth || "—",
            m.dateOfBirth ? getCurrentAge(m.dateOfBirth) : "—",
            m.dateJoined || "-",
            m.departments.join(", ") || "Not Assigned",
            m.status,
            m.phone || "Not provided",
            m.email || "Not provided",
          ]),
        },
      ],
      "new-members-report.xlsx"
    );
  }

  return (
    <SectionCard title="New Members Report">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>
            <span className="font-semibold text-gray-900">{breakdown.total}</span> total
          </span>
          <span>
            <span className="font-semibold text-gray-900">{breakdown.male}</span> male
          </span>
          <span>
            <span className="font-semibold text-gray-900">{breakdown.female}</span> female
          </span>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {breakdown.byCategory.map((c) => (
          <div key={c.category} className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-semibold text-gray-900">{c.count}</p>
            <p className="text-xs text-gray-500">{c.category}</p>
          </div>
        ))}
      </div>

      {newMembers.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No new members"
          description="No new members were registered during this period."
        />
      ) : (
        <>
          <div className="hidden flex-col gap-2 md:flex">
            {newMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate("/members")}
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-left hover:bg-gray-50/60"
              >
                <Avatar firstName={m.firstName} lastName={m.lastName} photoUrl={m.photoUrl} className="h-9 w-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {m.category} · {m.departments.join(", ") || "Not Assigned"}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{m.dateJoined || "-"}</span>
                <Badge tone={m.status === "Active" ? "active" : "inactive"}>{m.status}</Badge>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {newMembers.map((m) => (
              <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar firstName={m.firstName} lastName={m.lastName} photoUrl={m.photoUrl} className="h-11 w-11 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {m.category} · {m.departments.join(", ") || "Not Assigned"}
                    </p>
                  </div>
                  <Badge tone={m.status === "Active" ? "success" : "neutral"}>{m.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}