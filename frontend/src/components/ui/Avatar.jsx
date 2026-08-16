/**
 * Avatar
 *
 * Shared "member avatar" used everywhere a circle-with-initials
 * currently appears (MemberList, MemberCard, MemberDetailsDrawer,
 * Dashboard's Recent Members, every Birthdays component,
 * MemberPicker). Shows the member's `photoUrl` as an actual photo
 * when one exists; falls back to initials otherwise — so adding a
 * photo later doesn't require touching each consumer again.
 *
 * Sizing/color are passed in via className/toneClassName rather than
 * a fixed size enum, since existing call sites already use several
 * different sizes and tones (blue, gold, etc.) — this only
 * centralizes the "photo vs. initials" decision, not the styling.
 *
 * Props:
 * - firstName     (string)
 * - lastName      (string)
 * - photoUrl      (string, optional) — data URL or real image URL
 * - className     (string) — sizing + text size, e.g. "h-10 w-10 text-sm"
 * - toneClassName (string) — background/text color for the initials fallback
 */
export default function Avatar({
  firstName = "",
  lastName = "",
  photoUrl,
  className = "h-10 w-10 text-sm",
  toneClassName = "bg-[#154d78]/10 text-[#154d78]",
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`.trim() || "Member photo"}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${toneClassName} ${className}`}
    >
      {initials || "?"}
    </div>
  );
  }
