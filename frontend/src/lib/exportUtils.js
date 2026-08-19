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