export interface ExportColumn {
  key: string
  label: string
}

export type ExportRow = Record<string, string | number>

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function exportRowsToExcel(
  rows: ExportRow[],
  columns: ExportColumn[],
  filename: string
) {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Natijalar")

  sheet.columns = columns.map((column) => ({
    header: column.label,
    key: column.key,
    width: Math.max(column.label.length + 4, 18),
  }))
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  }

  for (const row of rows) sheet.addRow(row)

  const buffer = await workbook.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${filename}.xlsx`
  )
}

export async function exportRowsToPdf(
  rows: ExportRow[],
  columns: ExportColumn[],
  filename: string,
  title?: string
) {
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default
  const doc = new jsPDF()

  if (title) {
    doc.setFontSize(14)
    doc.text(title, 14, 15)
  }

  autoTable(doc, {
    startY: title ? 22 : 14,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => String(row[column.key] ?? ""))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  doc.save(`${filename}.pdf`)
}
