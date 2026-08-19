import { Lightbulb } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";

export default function KeyInsightsSection({ insights }) {
  return (
    <SectionCard title="Key Insights">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {insights.map((text, index) => (
          <li key={index} className="flex items-start gap-2.5 rounded-lg bg-[#154d78]/5 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#154d78]" strokeWidth={2} />
            <p className="text-sm text-gray-700">{text}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}