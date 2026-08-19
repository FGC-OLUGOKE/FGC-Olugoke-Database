import { useState } from "react";
import { FileDown } from "lucide-react";
import Button from "./Button";

/**
 * ExportButton
 *
 * Small secondary-styled button used within a report section (not
 * a global toolbar) — per the spec, export actions should sit next
 * to the specific report they export, not clutter the page header.
 */
export default function ExportButton({ onExport, label = "Export Excel" }) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleClick() {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={isExporting} className="text-xs">
      <FileDown className="h-3.5 w-3.5" />
      {isExporting ? "Exporting..." : label}
    </Button>
  );
}