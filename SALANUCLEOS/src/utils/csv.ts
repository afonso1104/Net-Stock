type Cell = string | number | null | undefined

function escapeCell(value: Cell) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  // Evita que o Excel interprete texto escrito pelos utilizadores como fórmula.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** CSV com «;» e BOM UTF-8, para abrir diretamente no Excel em português. */
export function toCsv(rows: Cell[][]) {
  return '﻿' + rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')
}

export function downloadCsv(filename: string, rows: Cell[][]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob); anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000)
}
