import * as XLSX from 'xlsx'

export interface ExportColumn<T> {
  label: string
  value: (row: T) => string | number | null | undefined
}

export function exportToXlsx<T>(rows: T[], columns: ExportColumn<T>[], filename: string): void {
  const header = columns.map((c) => c.label)
  const data = rows.map((row) => columns.map((c) => c.value(row) ?? ''))
  const ws = XLSX.utils.aoa_to_sheet([header, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dados')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
