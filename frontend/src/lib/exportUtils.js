import * as XLSX from "xlsx";

/**
 * Builds and downloads an .xlsx workbook. Used by every "Export
 * Excel" button on the Reports page so they all produce consistently
 * structured files instead of each hand-rolling their own.
 *
 * `sheets`: array of {
 *   name        (string)  sheet tab name (auto-truncated to Excel's 31-char limit)
 *   reportName  (string)  title shown in row 1
 *   period      (string, optional)  shown in row 2 if provided
 *   columns     (string[])  header row
 *   rows        (any[][])  data rows, same column order as `columns`
 * }
 *
 * Each sheet gets: report title, period (if given), a "generated on"
 * timestamp, a blank row, then the header + data. Column widths are
 * auto-sized from header length so numbers/short codes don't look
 * cramped. (Frozen header rows aren't included — reliable freeze-pane
 * writing isn't supported by the free SheetJS build this project
 * uses; noting that here rather than shipping something that
 * silently doesn't work in every spreadsheet app.)
 */
export function exportToExcel(sheets, filename) {
  const workbook = XLSX.utils.book_new();
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  sheets.forEach(({ name, reportName, period, columns, rows }) => {
    const aoa = [
      [reportName ?? name],
      period ? [`Period: ${period}`] : null,
      [`Generated: ${generatedAt}`],
      [],
      columns,
      ...rows,
    ].filter(Boolean);

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet["!cols"] = columns.map((col) => ({
      wch: Math.max(String(col).length + 2, 14),
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
  });

  XLSX.writeFile(workbook, filename);
}

export function exportToCsv(columns, rows, filename) {
  const escapeCell = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [columns, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function printReport({ title, subtitle, columns, rows }) {
  const popup = window.open("", "attendance-print", "width=1000,height=700");
  if (!popup) return;
  const cell = (value) => `<td>${String(value ?? "").replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char])}</td>`;
  popup.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#17202a}h1{margin:0 0 4px;font-size:22px}p{color:#667085}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border:1px solid #d9dee7;padding:9px;text-align:left;font-size:12px}th{background:#f2f5f8}@media print{button{display:none}}</style></head><body><h1>${title}</h1><p>${subtitle || ""}</p><table><thead><tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map(cell).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>window.print();</script></body></html>`);
  popup.document.close();
}