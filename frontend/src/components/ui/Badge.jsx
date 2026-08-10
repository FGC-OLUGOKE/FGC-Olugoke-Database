/**
 * Badge
 *
 * Small status/category pill reused across the app (member status,
 * category tags, etc.) so pill styling never drifts between places.
 *
 * `tone` maps to a small fixed set of colors:
 * - "success"  → active/positive states
 * - "neutral"  → inactive/default states
 * - "info"     → category or informational tags (uses brand purple)
 */
const TONES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  neutral: "bg-gray-100 text-gray-600 ring-gray-500/10",
  inactive: "bg-[#9e263b]/10 text-[#9e263b] ring-[#9e263b]/10",
  info: "bg-[#4a2969]/10 text-[#4a2969] ring-[#4a2969]/20",
};

export default function Badge({ children, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}