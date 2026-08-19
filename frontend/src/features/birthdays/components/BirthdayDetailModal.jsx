import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Cake, Pencil, Eye } from "lucide-react";
import useEscapeKey from "../../../hooks/useEscapeKey";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Avatar from "../../../components/ui/Avatar";

/**
 * BirthdayDetailModal
 *
 * Always a centered modal at every screen size (unlike MemberForm,
 * which is a drawer-on-mobile/modal-on-desktop hybrid) — the spec
 * for this page explicitly calls for "centered on desktop, properly
 * sized on mobile," not a full-screen mobile drawer. Portal-rendered
 * to document.body with its own z-index, so it can never end up
 * visually trapped underneath another component.
 */
export default function BirthdayDetailModal({ member, birthday, isOpen, onClose, onViewProfile, onEdit }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    document.body.style.overflow = "";
    const timeout = setTimeout(() => setShouldRender(false), 150);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEscapeKey(() => onClose?.(), isOpen);

  if (!shouldRender || !member) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-150 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-150 ease-out ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-lg bg-white/80 p-1.5 text-gray-400 backdrop-blur hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-[#d6b447]/10 to-transparent px-6 pb-6 pt-8 text-center">
            <Avatar
              firstName={member.firstName}
              lastName={member.lastName}
              photoUrl={member.photoUrl}
              className="h-20 w-20 text-2xl"
            />
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {member.title} {member.firstName} {member.lastName}
              </p>
              {birthday && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {birthday.next.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            {birthday && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d6b447]/15 px-3 py-1 text-xs font-medium text-[#7a5f24]">
                <Cake className="h-3.5 w-3.5" />
                Turning {birthday.turningAge}
              </span>
            )}
          </div>

          <div className="space-y-2.5 px-6 py-4">
            <DetailRow label="Department" value={member.departments.join(", ") || "Not Assigned"} />
            <DetailRow label="Category" value={member.category} />
            <DetailRow
              label="Status"
              value={<Badge tone={member.status === "Active" ? "success" : "neutral"}>{member.status}</Badge>}
            />
            <DetailRow label="Phone" value={member.phone || "—"} />
            <DetailRow label="Email" value={member.email || "—"} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row">
          <Button variant="secondary" onClick={() => onEdit(member)} className="flex-1">
            <Pencil className="h-3.5 w-3.5" />
            Edit Member
          </Button>
          <Button variant="primary" onClick={() => onViewProfile(member)} className="flex-1">
            <Eye className="h-3.5 w-3.5" />
            View Full Profile
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
