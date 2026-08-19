import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import ExportButton from "../../../components/ui/ExportButton";
import { exportToExcel } from "../../../lib/exportUtils";

/**
 * ProfileCompletionReport
 *
 * Directly serves the reality that Phone/Email/Address/Photo/
 * Department are all intentionally optional at registration — this
 * is how admins find and follow up on the records that need
 * completing later, without those optional fields having blocked
 * registration in the first place.
 */
export default function ProfileCompletionReport({ completion, period }) {
  const navigate = useNavigate();
  const { total, complete, incomplete, missing, affected } = completion;

  function handleExport() {
    exportToExcel(
      [
        {
          name: "Profile Completion",
          reportName: "Profile Completion Report",
          period,
          columns: [
            "Full Name",
            "Category",
            "Gender",
            "Status",
            "Missing Photo",
            "Missing Phone",
            "Missing Email",
            "Missing Address",
            "Missing Department",
          ],
          rows: affected.map(({ member: m, missingFields }) => [
            `${m.firstName} ${m.lastName}`,
            m.category,
            m.gender,
            m.status,
            missingFields.includes("Photo") ? "Yes" : "No",
            missingFields.includes("Phone") ? "Yes" : "No",
            missingFields.includes("Email") ? "Yes" : "No",
            missingFields.includes("Address") ? "Yes" : "No",
            missingFields.includes("Department") ? "Yes" : "No",
          ]),
        },
      ],
      "profile-completion-report.xlsx"
    );
  }

  const summaryItems = [
    { label: "Complete Profiles", value: complete },
    { label: "Incomplete Profiles", value: incomplete },
    { label: "Missing Phone", value: missing.phone },
    { label: "Missing Email", value: missing.email },
    { label: "Missing Address", value: missing.address },
    { label: "Missing Photo", value: missing.photo },
    { label: "Missing Department", value: missing.department },
  ];

  return (
    <SectionCard title="Profile Completion">
      <div className="mb-4 flex justify-end">
        <ExportButton onExport={handleExport} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-semibold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-[11px] text-gray-400">
              {total ? Math.round((item.value / total) * 100) : 0}%
            </p>
          </div>
        ))}
      </div>

      {affected.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No incomplete profiles found"
          description="Every member profile is complete."
        />
      ) : (
        <ul className="divide-y divide-gray-100">
          {affected.map(({ member: m, missingFields }) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-xs text-gray-500">Missing: {missingFields.join(", ")}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge tone="neutral">{m.category}</Badge>
                  <Badge tone={m.status === "Active" ? "success" : "neutral"}>{m.status}</Badge>
                </div>
              </div>
              <Button variant="secondary" onClick={() => navigate("/members")} className="text-xs">
                Complete Profile
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 72c3eaa55af4aca31cc89465f0cdd46eee6d5900
