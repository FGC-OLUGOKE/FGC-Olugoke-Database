import { useMemo } from "react";
import SectionCard from "../../../components/ui/SectionCard";
import LineTrendChart from "../../../components/ui/LineTrendChart";

const CATEGORY_COLORS = { Children: "#d6b447", Teenager: "#4a2969", Youth: "#154d78", Adult: "#9e263b" };
const CATEGORY_LIST = ["Children", "Teenager", "Youth", "Adult"];

/**
 * CategoryGrowthSection
 *
 * Super Admin only — "View category growth and trends" per the
 * role spec. Deliberately NOT a new parallel mock dataset: this is
 * genuinely DERIVED from real member data. For each of the last 8
 * months, it counts how many members of each category had already
 * joined (dateJoined on or before that month) — the same technique
 * as a cumulative growth line, just split by category instead of
 * aggregated.
 *
 * Worth knowing: this won't necessarily match the whole-church
 * "Membership Growth" chart above it number-for-number, since that
 * one is still a separate, hand-authored illustrative mock series
 * (see features/dashboard/mockData.js) rather than derived from the
 * same member records. Fully unifying those into one source of
 * truth is a reasonable follow-up, just a bigger change than this
 * fix — flagging it here rather than quietly leaving two data
 * models that could drift.
 */
export default function CategoryGrowthSection({ members }) {
  const data = useMemo(() => buildCategorySeries(members), [members]);

  return (
    <SectionCard title="Category Growth &amp; Trends">
      <LineTrendChart
        data={data}
        xKey="month"
        lines={CATEGORY_LIST.map((cat) => ({
          dataKey: cat,
          color: CATEGORY_COLORS[cat],
          label: cat,
        }))}
        height={240}
      />
    </SectionCard>
  );
}

function buildCategorySeries(members) {
  const now = new Date();
  const months = [];
  for (let i = 7; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }

  return months.map((monthDate) => {
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const point = { month: monthDate.toLocaleDateString("en-US", { month: "short" }) };
    CATEGORY_LIST.forEach((cat) => {
      point[cat] = members.filter(
        (m) => m.category === cat && m.dateJoined && new Date(m.dateJoined) <= endOfMonth
      ).length;
    });
    return point;
  });
}