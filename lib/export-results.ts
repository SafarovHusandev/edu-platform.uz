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

// PDF'ning standart shrifti (Helvetica) o'zbekcha ʻ/ʼ va ayrim tirnoqlarni
// chiqara olmaydi — oddiy apostrofga almashtiramiz
function pdfSafe(value: string) {
  return value.replace(/[ʻʼ‘’`´]/g, "'").replace(/[“”]/g, '"')
}

export async function exportRowsToPdf(
  rows: ExportRow[],
  columns: ExportColumn[],
  filename: string,
  title?: string,
  options: { orientation?: "portrait" | "landscape"; subtitle?: string } = {}
) {
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default
  const doc = new jsPDF({ orientation: options.orientation ?? "portrait" })

  let startY = 14
  if (title) {
    doc.setFontSize(14)
    doc.text(pdfSafe(title), 14, 15)
    startY = 22
  }
  if (options.subtitle) {
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(pdfSafe(options.subtitle), 14, title ? 21 : 15)
    doc.setTextColor(0)
    startY = title ? 26 : 20
  }

  autoTable(doc, {
    startY,
    head: [columns.map((column) => pdfSafe(column.label))],
    body: rows.map((row) => columns.map((column) => pdfSafe(String(row[column.key] ?? "")))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  doc.save(`${filename}.pdf`)
}
